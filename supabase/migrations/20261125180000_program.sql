-- =============================================================================
-- 020 — Egyéni program (docs/KONCEPCIO.md, 2026. november 25.)
--   * A Társaság megszűnik: új regisztráció lezárva.
--   * Jelentkezés: kétrészes felmérés (egészségügyi adat → kifejezett hozzájárulás),
--     szűrés (csak az „azonnal” kezdő minősített), saját konzultációs időpontfoglaló.
--   * Résztvevők: 4+4 hónapos program, alkalmak, gyakorlási terv, heti beszámoló.
--   * A résztvevő hozzáfér a Jelenlét (1.) és a Tudatosság (2.) lépcső tananyagához.
--   * Nyílt Est: a program résztvevőinek díjmentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Beállítások
-- -----------------------------------------------------------------------------
update public.app_settings set registration_open = false, terms_version = '2026-11-25' where id;

alter table public.app_settings
  add column consultation_meet_url text check (consultation_meet_url is null or consultation_meet_url ~ '^https://'),
  add column consultation_default_minutes smallint not null default 30
    check (consultation_default_minutes between 10 and 180),
  add column application_retention_days smallint not null default 180
    check (application_retention_days between 30 and 730),
  add column health_consent_version text not null default '2026-11-25';

alter table public.admin_notifications drop constraint admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check check (kind in (
  'chargeback', 'revenue_warning', 'payment_failed', 'progression_request', 'overbooking', 'other',
  'application', 'consultation_booked', 'weekly_report'));

-- -----------------------------------------------------------------------------
-- 2. Jelentkezések (felmérés)
-- -----------------------------------------------------------------------------
create type public.application_start as enum ('azonnal', 'egy_heten_belul', 'egy_honapon_belul', 'kesobb', 'nem_tudom');
create type public.application_status as enum ('uj', 'foglalt', 'konzultalt', 'resztvevo', 'nem_lett', 'archiv');

create table public.applications (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  token                uuid not null unique default gen_random_uuid(),
  full_name            text not null check (char_length(btrim(full_name)) between 2 and 120),
  email                text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                text check (phone is null or char_length(phone) <= 40),
  -- A) állapotfelmérés a hat pillér mentén (jsonb: { pillar: { rating 1-5, note } , alvas.hours })
  pillars              jsonb not null,
  -- B) helyzet és szándék
  problem              text not null check (char_length(btrim(problem)) between 3 and 4000),
  severity             smallint not null check (severity between 1 and 10),
  urgency              smallint not null check (urgency between 1 and 10),
  invest_money         text not null check (invest_money in ('igen', 'talan', 'nem')),
  invest_time          text not null check (invest_time in ('igen', 'talan', 'nem')),
  invest_energy        text not null check (invest_energy in ('igen', 'talan', 'nem')),
  start_when           public.application_start not null,
  qualified            boolean generated always as (start_when = 'azonnal') stored,
  -- hozzájárulások (GDPR 9. cikk: egészségügyi adat)
  health_consent_at    timestamptz not null,
  health_consent_version text not null,
  privacy_consent_at   timestamptz not null,
  status               public.application_status not null default 'uj',
  admin_note           text check (admin_note is null or char_length(admin_note) <= 4000)
);
create index applications_created_idx on public.applications (created_at desc);
create index applications_email_idx on public.applications (lower(email));

-- -----------------------------------------------------------------------------
-- 3. Konzultációs időpontok (saját foglalórendszer)
-- -----------------------------------------------------------------------------
create table public.consultation_slots (
  id               uuid primary key default gen_random_uuid(),
  starts_at        timestamptz not null,
  duration_minutes smallint not null default 30 check (duration_minutes between 10 and 180),
  meet_url         text check (meet_url is null or meet_url ~ '^https://'),
  application_id   uuid unique references public.applications (id) on delete set null,
  booked_at        timestamptz,
  created_at       timestamptz not null default now(),
  unique (starts_at)
);
create index consultation_slots_starts_idx on public.consultation_slots (starts_at);

-- -----------------------------------------------------------------------------
-- 4. Résztvevők, alkalmak, heti beszámolók
-- -----------------------------------------------------------------------------
create type public.enrollment_status as enum ('aktiv', 'lezart');
create type public.program_session_status as enum ('tervezett', 'megtartott', 'elmaradt');

create table public.program_enrollments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  application_id  uuid references public.applications (id) on delete set null,
  starts_on       date not null,
  -- a Tudatosság (2. lépcső) nyitása; alapból a 10. hét eleje (Jelenlét + IP 1 = 8+1 hét)
  stage2_from     date not null,
  status          public.enrollment_status not null default 'aktiv',
  practice_plan   text check (practice_plan is null or char_length(practice_plan) <= 20000),
  admin_note      text check (admin_note is null or char_length(admin_note) <= 20000),
  created_at      timestamptz not null default now(),
  closed_at       timestamptz,
  check (stage2_from >= starts_on)
);
-- Egyszerre egy aktív program tagonként.
create unique index program_enrollments_one_active on public.program_enrollments (user_id) where status = 'aktiv';

create table public.program_sessions (
  id               uuid primary key default gen_random_uuid(),
  enrollment_id    uuid not null references public.program_enrollments (id) on delete cascade,
  starts_at        timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 10 and 240),
  meet_url         text check (meet_url is null or meet_url ~ '^https://'),
  status           public.program_session_status not null default 'tervezett',
  note             text check (note is null or char_length(note) <= 4000),  -- a résztvevő is látja
  created_at       timestamptz not null default now()
);
create index program_sessions_enrollment_idx on public.program_sessions (enrollment_id, starts_at);

create table public.weekly_reports (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.program_enrollments (id) on delete cascade,
  week_start      date not null,   -- a hét hétfője, Budapest-idő szerint
  practice_days   smallint not null check (practice_days between 0 and 7),
  went_well       text check (went_well is null or char_length(went_well) <= 4000),
  was_hard        text check (was_hard is null or char_length(was_hard) <= 4000),
  question        text check (question is null or char_length(question) <= 4000),
  admin_reply     text check (admin_reply is null or char_length(admin_reply) <= 4000),
  replied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (enrollment_id, week_start)
);

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
alter table public.applications        enable row level security;
alter table public.consultation_slots  enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.program_sessions    enable row level security;
alter table public.weekly_reports      enable row level security;
alter table public.applications        force row level security;
alter table public.consultation_slots  force row level security;
alter table public.program_enrollments force row level security;
alter table public.program_sessions    force row level security;
alter table public.weekly_reports      force row level security;

-- Jelentkezés és időpont: csak admin (a nyilvános oldal service role-lal, RPC-n keresztül ír).
create policy applications_admin on public.applications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy consultation_slots_admin on public.consultation_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Résztvevő: a sajátját olvassa; írni csak az admin ír (a beszámoló RPC-n át).
create policy program_enrollments_own on public.program_enrollments
  for select to authenticated using (user_id = (select auth.uid()));
create policy program_enrollments_admin on public.program_enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy program_sessions_own on public.program_sessions
  for select to authenticated using (exists (
    select 1 from public.program_enrollments e
     where e.id = enrollment_id and e.user_id = (select auth.uid())));
create policy program_sessions_admin on public.program_sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy weekly_reports_own on public.weekly_reports
  for select to authenticated using (exists (
    select 1 from public.program_enrollments e
     where e.id = enrollment_id and e.user_id = (select auth.uid())));
create policy weekly_reports_admin on public.weekly_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A belső megjegyzés (admin_note) a résztvevő elől rejtve: oszlopszintű jog.
revoke select on public.program_enrollments from authenticated;
grant select (id, user_id, application_id, starts_on, stage2_from, status, practice_plan, created_at, closed_at)
  on public.program_enrollments to authenticated;
grant insert, update, delete on public.program_enrollments to authenticated;
grant select, insert, update, delete on public.applications, public.consultation_slots,
  public.program_sessions, public.weekly_reports to authenticated;
grant all on public.applications, public.consultation_slots, public.program_enrollments,
  public.program_sessions, public.weekly_reports to service_role;

-- Az admin a teljes sort (admin_note-tal) ezen keresztül olvassa.
create or replace function public.admin_enrollment_notes(p_enrollment_id uuid)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak admin.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  return (select admin_note from public.program_enrollments where id = p_enrollment_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Résztvevői jogosultság és a tananyag
-- -----------------------------------------------------------------------------
create or replace function public.is_program_participant()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.program_enrollments e
     where e.user_id = (select auth.uid())
       and e.status = 'aktiv'
       and e.starts_on <= public.budapest_today()
  )
$$;

-- Aktív hozzáférés: a régi tagság VAGY aktív programrészvétel.
create or replace function public.has_member_access()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_program_participant() or exists (
    select 1
    from public.profiles p
    cross join public.app_settings s
    where p.id = (select auth.uid())
      and p.tier <> 'none'
      and (
        p.subscription_status in ('active', 'trialing')
        or (p.subscription_status = 'past_due'
            and coalesce(p.past_due_since, now()) + make_interval(days => s.past_due_grace_days) > now())
      )
  )
$$;

create or replace function public.can_access_stage(p_stage smallint)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1 from public.program_enrollments e
       where e.user_id = (select auth.uid()) and e.status = 'aktiv'
         and e.starts_on <= public.budapest_today()
         and case p_stage
               when 1 then true
               when 2 then e.stage2_from <= public.budapest_today()
               else false
             end
    )
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and public.has_member_access()
        and case p_stage
              when 1 then true
              when 2 then p.m2_unlocked
              when 3 then p.ip3_unlocked
              when 4 then p.retreat_unlocked
              else false
            end
    )
$$;

-- A hét: résztvevőnél a programkezdéstől (1.) ill. a Tudatosság nyitásától (2.).
create or replace function public.current_week(p_stage smallint)
returns integer
language sql stable security definer
set search_path = ''
as $$
  select case
           when start_date is null or start_date > public.budapest_today() then null
           else ((public.budapest_today() - start_date) / 7) + 1
         end
  from (
    select coalesce(
      (select case p_stage when 1 then e.starts_on when 2 then e.stage2_from else null end
         from public.program_enrollments e
        where e.user_id = (select auth.uid()) and e.status = 'aktiv'
        limit 1),
      (select case p_stage
                when 1 then (p.membership_started_at at time zone 'Europe/Budapest')::date
                when 2 then (p.m2_unlocked_at at time zone 'Europe/Budapest')::date
                when 3 then (p.ip3_unlocked_at at time zone 'Europe/Budapest')::date
                else null
              end
         from public.profiles p where p.id = (select auth.uid()))
    ) as start_date
  ) x
$$;

-- A program áttekintése a résztvevőnek (és adminnak, user_id megadásával).
create or replace function public.my_program()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_e      public.program_enrollments;
  v_today  date := public.budapest_today();
  v_month  integer;
  v_next   public.program_sessions;
  v_week   date := v_today - (extract(isodow from v_today)::integer - 1);
  v_report boolean;
begin
  select * into v_e from public.program_enrollments
   where user_id = (select auth.uid())
   order by (status = 'aktiv') desc, starts_on desc limit 1;
  if not found then
    return null;
  end if;

  -- hányadik hónap (1-től); a 9. hónaptól a program lezárult
  v_month := (extract(year from age(v_today, v_e.starts_on)) * 12 + extract(month from age(v_today, v_e.starts_on)))::integer + 1;

  select * into v_next from public.program_sessions
   where enrollment_id = v_e.id and status = 'tervezett'
     and starts_at + make_interval(mins => duration_minutes) > now()
   order by starts_at limit 1;

  select exists (select 1 from public.weekly_reports where enrollment_id = v_e.id and week_start = v_week) into v_report;

  return jsonb_build_object(
    'enrollment_id', v_e.id,
    'status', v_e.status,
    'starts_on', v_e.starts_on,
    'ends_on', (v_e.starts_on + interval '8 months')::date,
    'learning_ends_on', (v_e.starts_on + interval '4 months')::date,
    'stage2_from', v_e.stage2_from,
    'started', v_e.starts_on <= v_today,
    'month', greatest(v_month, 0),
    'phase', case
               when v_e.status = 'lezart' then 'lezarult'
               when v_e.starts_on > v_today then 'hamarosan'
               when v_today < (v_e.starts_on + interval '4 months')::date then 'tanulas'
               when v_today < (v_e.starts_on + interval '8 months')::date then 'integracio'
               else 'lezarult'
             end,
    'practice_plan', v_e.practice_plan,
    'week_start', v_week,
    'report_done', v_report,
    'next_session', case when v_next.id is null then null else jsonb_build_object(
      'id', v_next.id, 'starts_at', v_next.starts_at, 'duration_minutes', v_next.duration_minutes,
      'note', v_next.note,
      -- a belépő link a kezdés előtt 15 perccel jelenik meg
      'meet_url', case when now() >= v_next.starts_at - interval '15 minutes' then v_next.meet_url end
    ) end
  );
end;
$$;

-- Heti beszámoló: az aktuális hétre, a saját aktív programjába (újraküldés felülírja).
create or replace function public.submit_weekly_report(
  p_practice_days smallint,
  p_went_well text,
  p_was_hard text,
  p_question text
)
returns public.weekly_reports
language plpgsql security definer
set search_path = ''
as $$
declare
  v_e     public.program_enrollments;
  v_today date := public.budapest_today();
  v_week  date := v_today - (extract(isodow from v_today)::integer - 1);
  v_r     public.weekly_reports;
begin
  select * into v_e from public.program_enrollments
   where user_id = (select auth.uid()) and status = 'aktiv' and starts_on <= v_today;
  if not found then
    raise exception 'Nincs aktív programod.' using errcode = 'P0001', hint = 'NOT_PARTICIPANT';
  end if;
  if p_practice_days is null or p_practice_days not between 0 and 7 then
    raise exception 'A gyakorlónapok száma 0 és 7 között lehet.' using errcode = 'P0001', hint = 'INVALID_DAYS';
  end if;

  insert into public.weekly_reports (enrollment_id, week_start, practice_days, went_well, was_hard, question)
  values (v_e.id, v_week, p_practice_days, nullif(btrim(p_went_well), ''), nullif(btrim(p_was_hard), ''), nullif(btrim(p_question), ''))
  on conflict (enrollment_id, week_start) do update
     set practice_days = excluded.practice_days,
         went_well = excluded.went_well,
         was_hard = excluded.was_hard,
         question = excluded.question,
         updated_at = now()
  returning * into v_r;

  insert into public.admin_notifications (kind, payload)
  values ('weekly_report', jsonb_build_object('enrollment_id', v_e.id, 'report_id', v_r.id, 'week_start', v_week));

  return v_r;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Nyilvános folyamat (csak service role: a weboldal szerveroldali kódja)
-- -----------------------------------------------------------------------------
create or replace function public.submit_application(
  p_full_name text,
  p_email text,
  p_phone text,
  p_pillars jsonb,
  p_problem text,
  p_severity smallint,
  p_urgency smallint,
  p_invest_money text,
  p_invest_time text,
  p_invest_energy text,
  p_start_when public.application_start,
  p_health_consent boolean,
  p_privacy_consent boolean
)
returns public.applications
language plpgsql security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_version text;
begin
  perform public._require_service_role();
  if not coalesce(p_health_consent, false) then
    raise exception 'Az egészségügyi adatok kezeléséhez kifejezett hozzájárulás kell.' using errcode = 'P0001', hint = 'HEALTH_CONSENT_REQUIRED';
  end if;
  if not coalesce(p_privacy_consent, false) then
    raise exception 'Az adatkezelési tájékoztató elfogadása kötelező.' using errcode = 'P0001', hint = 'PRIVACY_CONSENT_REQUIRED';
  end if;
  if jsonb_typeof(p_pillars) <> 'object' then
    raise exception 'Hiányos felmérés.' using errcode = 'P0001', hint = 'INVALID_PILLARS';
  end if;
  select health_consent_version into v_version from public.app_settings where id;

  insert into public.applications (
    full_name, email, phone, pillars, problem, severity, urgency,
    invest_money, invest_time, invest_energy, start_when,
    health_consent_at, health_consent_version, privacy_consent_at
  ) values (
    btrim(p_full_name), lower(btrim(p_email)), nullif(btrim(p_phone), ''), p_pillars, btrim(p_problem), p_severity, p_urgency,
    p_invest_money, p_invest_time, p_invest_energy, p_start_when,
    now(), v_version, now()
  )
  returning * into v_a;

  insert into public.admin_notifications (kind, payload)
  values ('application', jsonb_build_object('application_id', v_a.id, 'qualified', v_a.qualified));
  return v_a;
end;
$$;

-- A foglalóoldal adatai a jelentkezés tokenje alapján (személyes adat csak a keresztnév szintjén).
create or replace function public.application_booking_info(p_token uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_s public.consultation_slots;
  v_meet text;
begin
  perform public._require_service_role();
  select * into v_a from public.applications where token = p_token;
  if not found then
    return null;
  end if;
  select * into v_s from public.consultation_slots where application_id = v_a.id;
  select consultation_meet_url into v_meet from public.app_settings where id;
  return jsonb_build_object(
    'application_id', v_a.id,
    'full_name', v_a.full_name,
    'email', v_a.email,
    'qualified', v_a.qualified,
    'booked', case when v_s.id is null then null else jsonb_build_object(
      'slot_id', v_s.id, 'starts_at', v_s.starts_at, 'duration_minutes', v_s.duration_minutes,
      'meet_url', coalesce(v_s.meet_url, v_meet)) end,
    'slots', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'starts_at', s.starts_at, 'duration_minutes', s.duration_minutes) order by s.starts_at)
        from public.consultation_slots s
       where s.application_id is null and s.starts_at > now() + interval '2 hours'
         and s.starts_at < now() + interval '60 days'
    ), '[]'::jsonb)
  );
end;
$$;

-- Időpont lefoglalása: csak minősített jelentkezés, egy időpont / jelentkezés, zárolással.
create or replace function public.book_consultation_slot(p_token uuid, p_slot_id uuid)
returns public.consultation_slots
language plpgsql security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_s public.consultation_slots;
begin
  perform public._require_service_role();
  select * into v_a from public.applications where token = p_token for update;
  if not found then
    raise exception 'A jelentkezés nem található.' using errcode = 'P0001', hint = 'APPLICATION_NOT_FOUND';
  end if;
  if not v_a.qualified then
    raise exception 'Konzultációt most nem lehet foglalni.' using errcode = 'P0001', hint = 'NOT_QUALIFIED';
  end if;
  if exists (select 1 from public.consultation_slots where application_id = v_a.id) then
    raise exception 'Már van lefoglalt időpontod.' using errcode = 'P0001', hint = 'ALREADY_BOOKED';
  end if;

  select * into v_s from public.consultation_slots where id = p_slot_id for update;
  if not found or v_s.starts_at <= now() + interval '2 hours' then
    raise exception 'Ez az időpont nem foglalható.' using errcode = 'P0001', hint = 'SLOT_NOT_AVAILABLE';
  end if;
  if v_s.application_id is not null then
    raise exception 'Ezt az időpontot közben valaki más lefoglalta.' using errcode = 'P0001', hint = 'SLOT_TAKEN';
  end if;

  update public.consultation_slots set application_id = v_a.id, booked_at = now()
   where id = v_s.id returning * into v_s;
  update public.applications set status = 'foglalt' where id = v_a.id and status = 'uj';

  insert into public.admin_notifications (kind, payload)
  values ('consultation_booked', jsonb_build_object('application_id', v_a.id, 'slot_id', v_s.id, 'starts_at', v_s.starts_at));
  return v_s;
end;
$$;

-- Nyílt Est: a program résztvevőinek díjmentes (az e-mail-cím alapján).
create or replace function public.reserve_guest_seat(
  p_event_id    uuid,
  p_guest_name  text,
  p_guest_email text
)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.app_settings;
  v_event    public.events;
  v_email    text := lower(btrim(p_guest_email));
  v_taken    integer;
  v_reg      public.event_registrations;
  v_price    integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Csak szerveroldalról hívható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or nullif(btrim(p_guest_name), '') is null then
    raise exception 'Adj meg nevet és érvényes e-mail-címet.' using errcode = 'P0001', hint = 'INVALID_GUEST';
  end if;

  select * into strict v_settings from public.app_settings where id;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or not v_event.is_published or v_event.cancelled_at is not null then
    raise exception 'Ez az esemény nem érhető el.' using errcode = 'P0001', hint = 'EVENT_NOT_FOUND';
  end if;
  if v_event.members_only or v_event.price_external_huf is null then
    raise exception 'Erre az alkalomra csak tagok jelentkezhetnek.' using errcode = 'P0001', hint = 'NOT_PUBLIC_EVENT';
  end if;
  if now() < v_event.registration_opens_at then
    raise exception 'A jelentkezés még nem nyílt meg.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_OPEN';
  end if;
  if now() >= v_event.starts_at
     or (v_event.registration_closes_at is not null and now() >= v_event.registration_closes_at) then
    raise exception 'A jelentkezés erre az alkalomra lezárult.' using errcode = 'P0001', hint = 'REGISTRATION_CLOSED';
  end if;

  update public.event_registrations
     set status = 'cancelled', cancelled_at = now()
   where event_id = v_event.id and status = 'pending_payment' and hold_expires_at <= now();

  if exists (
    select 1 from public.event_registrations r
     where r.event_id = v_event.id and r.user_id is null
       and lower(r.guest_email) = v_email and r.status <> 'cancelled'
  ) then
    raise exception 'Ezzel az e-mail-címmel már van jelentkezés erre az alkalomra.'
      using errcode = 'P0001', hint = 'ALREADY_REGISTERED';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_taken from public.event_registrations r
     where r.event_id = v_event.id and r.status <> 'cancelled';
    if v_taken >= v_event.capacity then
      raise exception 'Erre az alkalomra minden hely betelt.' using errcode = 'P0001', hint = 'EVENT_FULL';
    end if;
  end if;

  -- A program aktív résztvevője díjmentesen jön.
  v_price := case when exists (
      select 1 from public.program_enrollments e
        join public.profiles p on p.id = e.user_id
       where e.status = 'aktiv' and lower(p.email) = v_email
    ) then 0 else v_event.price_external_huf end;

  insert into public.event_registrations (
    event_id, user_id, guest_name, guest_email, is_member_seat, price_huf, status, hold_expires_at
  ) values (
    v_event.id, null, btrim(p_guest_name), v_email, false, v_price,
    case when v_price = 0 then 'confirmed' else 'pending_payment' end::public.registration_status,
    case when v_price = 0 then null
         else now() + make_interval(mins => v_settings.payment_hold_minutes) end
  )
  returning * into v_reg;

  return v_reg;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Adattakarékosság: a programba nem került jelentkezések törlése
-- -----------------------------------------------------------------------------
create or replace function public.purge_old_applications()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_days integer;
  v_n integer;
begin
  select application_retention_days into v_days from public.app_settings where id;
  with del as (
    delete from public.applications a
     where a.created_at < now() - make_interval(days => v_days)
       and not exists (select 1 from public.program_enrollments e where e.application_id = a.id)
       and not exists (select 1 from public.consultation_slots s where s.application_id = a.id and s.starts_at > now())
    returning 1
  )
  select count(*) into v_n from del;

  -- A program vége (kezdés + 8 hónap, vagy a korábbi lezárás) után 1 évvel: a jelentkezés,
  -- a heti beszámolók és az alkalmak törlése (a fiók és a napló a fiókkal együtt kezelendő).
  with ended as (
    select e.id, e.application_id from public.program_enrollments e
     where least((e.starts_on + interval '8 months'), coalesce(e.closed_at, 'infinity'::timestamptz)) < now() - interval '1 year'
  ), del_r as (
    delete from public.weekly_reports r using ended where r.enrollment_id = ended.id returning 1
  ), del_s as (
    delete from public.program_sessions s using ended where s.enrollment_id = ended.id returning 1
  ), clr as (
    update public.program_enrollments e set practice_plan = null, admin_note = null, application_id = null
      from ended where e.id = ended.id returning ended.application_id
  )
  delete from public.applications a using clr where a.id = clr.application_id;

  return v_n;
end;
$$;
select cron.schedule('purge-old-applications', '47 3 * * *', $$select public.purge_old_applications()$$);

-- -----------------------------------------------------------------------------
-- 9. Jogok
-- -----------------------------------------------------------------------------
revoke execute on function public.submit_application(text, text, text, jsonb, text, smallint, smallint, text, text, text, public.application_start, boolean, boolean) from public, anon, authenticated;
revoke execute on function public.application_booking_info(uuid) from public, anon, authenticated;
revoke execute on function public.book_consultation_slot(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.purge_old_applications() from public, anon, authenticated;
revoke execute on function public.reserve_guest_seat(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.is_program_participant() from public, anon;
revoke execute on function public.my_program() from public, anon;
revoke execute on function public.submit_weekly_report(smallint, text, text, text) from public, anon;
revoke execute on function public.admin_enrollment_notes(uuid) from public, anon;
grant execute on function public.is_program_participant() to authenticated;
grant execute on function public.my_program() to authenticated;
grant execute on function public.submit_weekly_report(smallint, text, text, text) to authenticated;
grant execute on function public.admin_enrollment_notes(uuid) to authenticated;
grant execute on all functions in schema public to service_role;
