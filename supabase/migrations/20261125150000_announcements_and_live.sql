-- =============================================================================
-- 015 — Értesítő levelek az új admin tevékenységekről + natív élő alkalmak
-- (CLAUDE.md 7.19)
--
-- 1. Értesítés: minden új esemény, admin-bejegyzés és túra-szavazás egyszer
--    (announced_at) e-mailben kimegy a tagoknak. A tag leiratkozhat
--    (profiles.notify_admin_updates; egykattintásos link: profiles.email_token).
-- 2. Élő alkalom: join_live_event ellenőrzi a jogosultságot és az időablakot,
--    rögzíti a jelenlétet (→ XP a meglévő attended_at triggeren át), és
--    visszaadja a szerepet a LiveKit-belépőhöz. Felvétel: events.recording_bunny_id.
-- =============================================================================

-- ---- 1. Értesítés ------------------------------------------------------------

alter table public.profiles
  add column notify_admin_updates boolean not null default true,
  add column email_token uuid not null default gen_random_uuid();
create unique index profiles_email_token_key on public.profiles (email_token);

alter table public.events add column announced_at timestamptz;
alter table public.posts add column announced_at timestamptz;
alter table public.destination_polls add column announced_at timestamptz;

-- A már meglévő tételekről nem megy utólag levél.
update public.events set announced_at = now() where is_published;
update public.posts set announced_at = now();
update public.destination_polls set announced_at = now();

-- A tag a saját értesítési beállítását is módosíthatja.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_free constant text[] := array['display_name', 'bio', 'updated_at', 'leaderboard_hidden', 'last_name', 'first_name',
                                  'nickname', 'onboarded_at', 'notify_admin_updates'];
begin
  if current_user in ('authenticated', 'anon') and new.role is distinct from old.role
     and not public.is_superadmin() then
    raise exception 'Szerepkört csak superadmin módosíthat.' using errcode = '42501';
  end if;
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (to_jsonb(new) - v_free) is distinct from (to_jsonb(old) - v_free) then
      raise exception 'Ezt a mezőt nem módosíthatod.' using errcode = '42501';
    end if;
  end if;
  if old.order_key is not null and new.order_key is distinct from old.order_key
     and not public.is_superadmin() then
    raise exception 'A rend nem módosítható.' using errcode = '42501', hint = 'ORDER_LOCKED';
  end if;
  return new;
end;
$$;

-- Egy tétel értesítőjét csak egyszer lehet „lefoglalni” (dupla kattintás, újrapróbálás ellen).
create or replace function public.claim_announcement(p_kind text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_service_role();
  if p_kind = 'event' then
    update public.events set announced_at = now()
     where id = p_id and announced_at is null and is_published and cancelled_at is null;
  elsif p_kind = 'post' then
    update public.posts set announced_at = now() where id = p_id and announced_at is null;
  elsif p_kind = 'poll' then
    update public.destination_polls set announced_at = now() where id = p_id and announced_at is null;
  else
    raise exception 'Ismeretlen értesítés-típus.' using errcode = '22023', hint = 'INVALID_KIND';
  end if;
  return found;
end;
$$;

-- A címzettek: aktív (próbaidős, késedelmes) tagok, akik nem iratkoztak le.
create or replace function public.announcement_recipients()
returns table (email text, first_name text, email_token uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public._require_service_role();
  return query
    select p.email, coalesce(nullif(p.first_name, ''), p.display_name), p.email_token
      from public.profiles p
     where p.tier <> 'none'
       and p.subscription_status in ('active', 'trialing', 'past_due')
       and p.notify_admin_updates
       and p.email is not null
     order by p.created_at;
end;
$$;

-- Leiratkozás a levél linkjével (bejelentkezés nélkül).
create or replace function public.unsubscribe_by_token(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_service_role();
  update public.profiles set notify_admin_updates = false where email_token = p_token;
  return found;
end;
$$;

revoke all on function public.claim_announcement(text, uuid) from public, anon, authenticated;
revoke all on function public.announcement_recipients() from public, anon, authenticated;
revoke all on function public.unsubscribe_by_token(uuid) from public, anon, authenticated;
grant execute on function public.claim_announcement(text, uuid) to service_role;
grant execute on function public.announcement_recipients() to service_role;
grant execute on function public.unsubscribe_by_token(uuid) to service_role;

-- ---- 2. Élő alkalmak ---------------------------------------------------------

alter table public.events add column recording_bunny_id text;

-- Az élő Q&A részvétele is XP-t ad (ugyanaz a szabály, mint az online meditációé).
create or replace function public.xp_on_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_day  date;
begin
  if new.user_id is null or new.attended_at is null or old.attended_at is not null then
    return new;
  end if;
  select kind::text, (starts_at at time zone 'Europe/Budapest')::date into v_kind, v_day
    from public.events where id = new.event_id;
  if v_kind in ('online_meditacio', 'qa_elo') then
    perform public._award_xp(new.user_id, 'online_meditation', new.id::text, v_day);
  elsif v_kind = 'tura' then
    perform public._award_xp(new.user_id, 'hike', new.id::text, v_day);
  elsif v_kind in ('nyilt_est', 'gyakorlonap', 'elvonulas') then
    perform public._award_xp(new.user_id, 'event_attendance', new.id::text, v_day);
  end if;
  return new;
end;
$$;

-- Belépés egy élő (online) alkalomba. Szerepek:
--   host    — admin (bármikor beléphet, hogy előkészítsen)
--   speaker — beszélhet (online meditáció: minden jogosult tag; Q&A: Belső Kör)
--   viewer  — csak néz és hallgat (Q&A: A Társaság Tagja)
-- Tagnál az időablak: a kezdés előtt 15 perccel nyílik, a végéig (vagy kezdés + 3 óra) tart.
-- A belépés jelenlétnek számít (attended_at → XP, naponta egyszer).
create or replace function public.join_live_event(p_event_id uuid)
returns table (role text, room text, title text, ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   public.events;
  v_profile public.profiles;
  v_end     timestamptz;
  v_role    text;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '42501', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_event from public.events e where e.id = p_event_id;
  if not found or not v_event.is_published or v_event.cancelled_at is not null or not v_event.is_online then
    raise exception 'Ez az alkalom nem érhető el élőben.' using errcode = 'P0002', hint = 'NOT_LIVE';
  end if;
  v_end := coalesce(v_event.ends_at, v_event.starts_at + interval '3 hours');

  if public.is_admin() then
    return query select 'host'::text, v_event.id::text, v_event.title, v_end;
    return;
  end if;

  if now() < v_event.starts_at - interval '15 minutes' then
    raise exception 'Az élő alkalom a kezdés előtt 15 perccel nyílik.' using errcode = '22023', hint = 'TOO_EARLY';
  end if;
  if now() > v_end then
    raise exception 'Ez az alkalom már véget ért.' using errcode = '22023', hint = 'ENDED';
  end if;
  if not public.is_paying_member() then
    raise exception 'Az élő alkalmak a próbaidő után nyílnak meg.' using errcode = '42501', hint = 'NOT_PAYING';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if v_event.requires_retreat_unlock and not v_profile.retreat_unlocked then
    raise exception 'Ehhez az alkalomhoz még nincs hozzáférésed.' using errcode = '42501', hint = 'TIER_NOT_ALLOWED';
  end if;

  if v_event.kind = 'qa_elo' then
    v_role := case when v_profile.tier = 'belso_kor' then 'speaker' else 'viewer' end;
  elsif v_profile.tier = any (v_event.allowed_tiers) then
    v_role := 'speaker';
  else
    raise exception 'Ehhez az alkalomhoz még nincs hozzáférésed.' using errcode = '42501', hint = 'TIER_NOT_ALLOWED';
  end if;

  -- Jelenlét: online alkalomra nem kell előre jelentkezni; a belépés maga a részvétel.
  update public.event_registrations r
     set attended_at = coalesce(r.attended_at, now())
   where r.event_id = v_event.id and r.user_id = v_uid and r.status = 'confirmed';
  if not found then
    insert into public.event_registrations (event_id, user_id, is_member_seat, tier_at_booking, price_huf, status)
    values (v_event.id, v_uid, true, v_profile.tier, 0, 'confirmed')
    on conflict do nothing;
    update public.event_registrations r
       set attended_at = coalesce(r.attended_at, now())
     where r.event_id = v_event.id and r.user_id = v_uid and r.status = 'confirmed';
  end if;

  return query select v_role, v_event.id::text, v_event.title, v_end;
end;
$$;

revoke all on function public.join_live_event(uuid) from public, anon;
grant execute on function public.join_live_event(uuid) to authenticated;

-- ---- 3. Az admin tagság nélkül is írhat a közösségbe ------------------------
-- (Az admin-bejegyzésről megy az értesítő; a superadmin fióknak nincs tagsága.)
drop policy posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not is_hidden
    and (public.is_admin() or (public.has_member_access() and kind = 'normal'))
  );

drop policy comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (public.is_admin() or public.has_member_access())
    and not is_hidden
    and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden)
  );
