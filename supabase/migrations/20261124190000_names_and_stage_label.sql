-- =============================================================================
-- 007 — Teljes név becenévvel + menet közben számolt gyakorlási fázis
--
-- 1. profiles.last_name / first_name / nickname. A megjelenített név (display_name)
--    ezekből áll össze triggerrel:  Vezetéknév Keresztnév "Becenév"
--    (becenév nélkül: Vezetéknév Keresztnév). Minden meglévő felület a display_name-t
--    mutatja, így egyszerre átáll.
-- 2. A tag a saját nevét és becenevét módosíthatja (guard_profile_update bővítése).
-- 3. handle_new_user: a fiók létrehozásakor átvett vezeték- és keresztnév.
-- 4. community_authors: a gyakorlási fázist (pl. „I. lépcső · 4. hét”) a lépcsők és a
--    belépés/nyitás dátuma alapján számolja; volt tagnál továbbra sincs fázis.
-- =============================================================================

-- 1. Névmezők ------------------------------------------------------------------
alter table public.profiles
  add column last_name  text check (char_length(last_name) between 1 and 60),
  add column first_name text check (char_length(first_name) between 1 and 60),
  add column nickname   text check (char_length(nickname) between 1 and 30 and position('"' in nickname) = 0);

alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles add constraint profiles_display_name_check check (char_length(display_name) <= 160);

create or replace function public.compose_display_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_name  := nullif(btrim(new.last_name), '');
  new.first_name := nullif(btrim(new.first_name), '');
  new.nickname   := nullif(btrim(new.nickname), '');
  -- Ha van legalább egy névrész, abból áll össze a név; különben marad a korábbi.
  if new.last_name is not null or new.first_name is not null then
    new.display_name := concat_ws(' ', new.last_name, new.first_name)
                        || case when new.nickname is not null then ' "' || new.nickname || '"' else '' end;
  end if;
  return new;
end;
$$;

-- A „profiles_compose…” név miatt a guard előtt fut (BEFORE triggerek ábécérendben).
create trigger profiles_compose_name before insert or update of last_name, first_name, nickname on public.profiles
  for each row execute function public.compose_display_name();

-- 2. A tag a saját nevét és becenevét is módosíthatja --------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_free constant text[] := array['display_name', 'bio', 'updated_at', 'leaderboard_hidden', 'last_name', 'first_name', 'nickname'];
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

-- 3. Új fiók: a vezeték- és keresztnév átvétele a metaadatokból ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, last_name, first_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(left(btrim(new.raw_user_meta_data ->> 'last_name'), 60), ''),
    nullif(left(btrim(new.raw_user_meta_data ->> 'first_name'), 60), ''),
    case when lower(new.email) = any (select lower(e) from public.app_settings s, unnest(s.superadmin_emails) e)
         then 'superadmin' else 'member' end::public.user_role
  );
  return new;
end;
$$;

-- 4. Gyakorlási fázis ----------------------------------------------------------
-- Egy tag aktuális hete egy lépcsőn (belső; a current_week párja tetszőleges tagra).
create or replace function public._member_week(p_user uuid, p_stage smallint)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when start_date is null or start_date > public.budapest_today() then null
           else ((public.budapest_today() - start_date) / 7) + 1
         end
    from (
      select case p_stage
               when 1 then (p.membership_started_at at time zone 'Europe/Budapest')::date
               when 2 then (p.m2_unlocked_at at time zone 'Europe/Budapest')::date
               when 3 then (p.ip3_unlocked_at at time zone 'Europe/Budapest')::date
             end as start_date
        from public.profiles p
       where p.id = p_user
    ) x
$$;

-- A fázis szövege: a legmagasabb nyitott lépcső és azon belül a hét.
create or replace function public._stage_label(p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_p     public.profiles;
  v_stage smallint;
  v_name  text;
  v_week  integer;
begin
  select * into v_p from public.profiles where id = p_user;
  if not found then return null; end if;
  if v_p.retreat_unlocked then return 'IV. lépcső · Szabadság'; end if;
  v_stage := case when v_p.ip3_unlocked then 3 when v_p.m2_unlocked then 2 else 1 end;
  v_name  := case v_stage when 1 then 'I. lépcső' when 2 then 'II. lépcső' else 'IP 3' end;
  v_week  := public._member_week(p_user, v_stage);
  return case
           when v_week is null then v_name
           when v_week <= 8 then v_name || ' · ' || v_week || '. hét'
           when v_week = 9 then v_name || ' · lezárás'
           else v_name || ' · elvégezve'
         end;
end;
$$;

create or replace function public.community_authors(p_ids uuid[])
returns table (
  id                   uuid,
  display_name         text,
  is_current_member    boolean,
  current_stage_label  text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         p.display_name,
         active.is_active,
         case when active.is_active then coalesce(p.current_stage_label, public._stage_label(p.id)) end
    from public.profiles p
   cross join public.app_settings s
   cross join lateral (
     select p.tier <> 'none'
            and (p.subscription_status in ('active', 'trialing')
                 or (p.subscription_status = 'past_due'
                     and coalesce(p.past_due_since, now()) + make_interval(days => s.past_due_grace_days) > now())) as is_active
   ) active
   where p.id = any (p_ids)
     and (public.has_member_access() or public.is_admin())
$$;

-- Jogok: a belső segédfüggvényeket kliens nem hívhatja.
revoke execute on function public.compose_display_name() from public, anon, authenticated;
revoke execute on function public._member_week(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._stage_label(uuid) from public, anon, authenticated;
grant execute on function public._member_week(uuid, smallint) to service_role;
grant execute on function public._stage_label(uuid) to service_role;
