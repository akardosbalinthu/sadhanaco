-- =============================================================================
-- 016 — Élő alkalmak Google Meettel (CLAUDE.md 7.19, módosítva)
-- Az online esemény belépő linkje (pl. Google Meet) külön táblában van, amelyet
-- csak az admin olvas. A tag a join_live_event-en át kapja meg — ugyanazokkal a
-- feltételekkel (időablak, fizető tag, szint), és a belépés jelenlétnek számít.
-- =============================================================================

create table public.event_live_links (
  event_id   uuid primary key references public.events (id) on delete cascade,
  join_url   text not null check (join_url ~ '^https://[^\s]+$' and char_length(join_url) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.event_live_links enable row level security;
alter table public.event_live_links force row level security;

create policy event_live_links_admin on public.event_live_links
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
grant select, insert, update, delete on public.event_live_links to authenticated;

-- A visszatérési típus bővül (join_url), ezért újra kell létrehozni.
drop function public.join_live_event(uuid);
create function public.join_live_event(p_event_id uuid)
returns table (role text, room text, title text, ends_at timestamptz, join_url text)
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
  v_url     text;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '42501', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_event from public.events e where e.id = p_event_id;
  if not found or not v_event.is_published or v_event.cancelled_at is not null or not v_event.is_online then
    raise exception 'Ez az alkalom nem érhető el élőben.' using errcode = 'P0002', hint = 'NOT_LIVE';
  end if;
  v_end := coalesce(v_event.ends_at, v_event.starts_at + interval '3 hours');
  select l.join_url into v_url from public.event_live_links l where l.event_id = v_event.id;

  if public.is_admin() then
    return query select 'host'::text, v_event.id::text, v_event.title, v_end, v_url;
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

  -- Jelenlét: online alkalomra nem kell előre jelentkezni; a belépés maga a részvétel (→ XP).
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

  return query select v_role, v_event.id::text, v_event.title, v_end, v_url;
end;
$$;

revoke all on function public.join_live_event(uuid) from public, anon;
grant execute on function public.join_live_event(uuid) to authenticated;
