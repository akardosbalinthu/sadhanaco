-- =============================================================================
-- 006 — Ranglista a tagoknak (heti, havi, negyedéves) — CLAUDE.md 7.16
--   * csak bejelentkezett, aktív (próbaidős is) tag látja; kívülről nem
--   * az adott időszakban szerzett XP számít (Budapest-idő; hétfőtől vasárnapig)
--   * az első 10 látszik + a saját helyed; megjelenik: név, rend, rang, időszak XP-je
--   * aki nem szeretne szerepelni, elrejtheti magát (profiles.leaderboard_hidden);
--     a saját helyét így is látja, és a negyedéves vacsorameghívásból sem esik ki
--   * a negyedéves első tíz kapja a vacsorameghívást (admin lista, az elrejtetteket is számolva)
--   * az XP-napló továbbra sem olvasható más tagnak — a lista egy függvényen keresztül jön
-- =============================================================================

alter table public.profiles
  add column leaderboard_hidden boolean not null default false;

-- A tag a saját nevét, bemutatkozását és a ranglistán való láthatóságát módosíthatja.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and new.role is distinct from old.role
     and not public.is_superadmin() then
    raise exception 'Szerepkört csak superadmin módosíthat.' using errcode = '42501';
  end if;
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (to_jsonb(new) - array['display_name', 'bio', 'updated_at', 'leaderboard_hidden'])
       is distinct from (to_jsonb(old) - array['display_name', 'bio', 'updated_at', 'leaderboard_hidden']) then
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

-- Az időszak első napja (Budapest-idő).
create or replace function public._period_start(p_period text, p_day date default null)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_day date := coalesce(p_day, '2000-01-01'::date);
begin
  return case p_period
    when 'week'    then date_trunc('week', v_day)::date
    when 'month'   then date_trunc('month', v_day)::date
    when 'quarter' then date_trunc('quarter', v_day)::date
  end;
end;
$$;

-- Az időszak XP-összesítése tagonként (belső).
create or replace function public._leaderboard_scores(p_from date, p_to date)
returns table (user_id uuid, xp bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.user_id, sum(e.xp) as xp
    from public.xp_events e
    join public.profiles p on p.id = e.user_id and e.cycle_started_at = p.membership_started_at
   where e.earned_on between p_from and p_to
     and p.tier <> 'none'
     and p.subscription_status in ('active', 'trialing', 'past_due')
   group by e.user_id;
$$;

create or replace function public.leaderboard(p_period text default 'week')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_today    date := public.budapest_today();
  v_from     date;
  v_to       date;
  v_top      jsonb;
  v_my_xp    bigint;
  v_my_pos   bigint;
  v_settings public.app_settings;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if not public.has_member_access() then
    raise exception 'A ranglista a tagság része.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if p_period not in ('week', 'month', 'quarter') then
    raise exception 'Ismeretlen időszak.' using errcode = 'P0001', hint = 'INVALID_PERIOD';
  end if;

  select * into strict v_settings from public.app_settings where id;
  v_from := public._period_start(p_period, v_today);
  v_to := case p_period
    when 'week'    then v_from + 6
    when 'month'   then (v_from + interval '1 month' - interval '1 day')::date
    else (v_from + interval '3 months' - interval '1 day')::date end;

  with scores as (
    select s.user_id, s.xp, p.display_name, p.order_key, p.leaderboard_hidden,
           (select coalesce(sum(e.xp), 0) from public.xp_events e
             where e.user_id = s.user_id and e.cycle_started_at = p.membership_started_at) as total_xp
      from public._leaderboard_scores(v_from, v_to) s
      join public.profiles p on p.id = s.user_id
  ),
  visible as (
    select *, rank() over (order by xp desc) as pos from scores where not leaderboard_hidden
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'position', v.pos,
           'name', nullif(btrim(v.display_name), ''),
           'order', v.order_key,
           'rank', (select r ->> 'label' from jsonb_array_elements(v_settings.xp_ranks) r
                     where (r ->> 'xp')::integer <= v.total_xp
                     order by (r ->> 'xp')::integer desc limit 1),
           'xp', v.xp,
           'is_me', v.user_id = v_uid)
         order by v.pos, v.display_name), '[]'::jsonb)
    into v_top
    from visible v
   where v.pos <= 10;

  select coalesce(xp, 0) into v_my_xp from public._leaderboard_scores(v_from, v_to) where user_id = v_uid;
  v_my_xp := coalesce(v_my_xp, 0);
  select count(*) + 1 into v_my_pos
    from public._leaderboard_scores(v_from, v_to) s
    join public.profiles p on p.id = s.user_id
   where not p.leaderboard_hidden and s.user_id <> v_uid and s.xp > v_my_xp;

  return jsonb_build_object(
    'period', p_period,
    'starts_on', v_from,
    'ends_on', v_to,
    'top', v_top,
    'me', jsonb_build_object(
      'position', case when v_my_xp > 0 then v_my_pos end,
      'xp', v_my_xp,
      'hidden', (select leaderboard_hidden from public.profiles where id = v_uid))
  );
end;
$$;

-- A negyedév első tíz helyezettje (vacsorameghívás) — csak admin; az elrejtett tagok is számítanak.
create or replace function public.admin_quarter_top10(p_day date default null)
returns table (pos bigint, user_id uuid, display_name text, email text, xp bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from date;
begin
  if not public.is_admin() then
    raise exception 'Csak admin láthatja.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  v_from := public._period_start('quarter', coalesce(p_day, public.budapest_today()));
  return query
    select r.pos, r.user_id, r.display_name, r.email, r.xp from (
      select s.user_id, p.display_name, p.email, s.xp, rank() over (order by s.xp desc) as pos
        from public._leaderboard_scores(v_from, (v_from + interval '3 months' - interval '1 day')::date) s
        join public.profiles p on p.id = s.user_id
    ) r
    where r.pos <= 10
    order by r.pos, r.display_name;
end;
$$;

revoke execute on function
  public._period_start(text, date),
  public._leaderboard_scores(date, date),
  public.leaderboard(text),
  public.admin_quarter_top10(date)
from public, anon, authenticated;
grant execute on function public.leaderboard(text) to authenticated;
grant execute on function public.admin_quarter_top10(date) to authenticated;
grant execute on all functions in schema public to service_role;
