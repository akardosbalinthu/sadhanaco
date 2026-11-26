-- =============================================================================
-- 023 — Az egyéni program fizetése Stripe-on (2026. november 26.)
--   * Három fizetési mód (price_catalog = Stripe lookup_key):
--       egyeni_program_egyben     690 000 Ft egyszeri
--       egyeni_program_4_reszlet  4 × 180 000 Ft havonta
--       egyeni_program_havi       8 × 100 000 Ft havonta
--   * Bálint a konzultáció után fizetési linket küld (program_payment_offers);
--     az ügyfél választ a három mód közül, a Stripe Checkouton fizet.
--   * Sikeres első fizetés → automatikus felvétel (fiók + program a megadott kezdőnappal).
--   * Sikertelen részlet → 10 nap türelmi idő (past_due_grace_days), utána a felület szünetel.
-- =============================================================================

insert into public.price_catalog (code, label, amount_huf, stripe_product_id, is_active) values
  ('egyeni_program_egyben',    'Egyéni program – egy összegben',     690000, 'prod_VhIC69usAOqsTU', true),
  ('egyeni_program_4_reszlet', 'Egyéni program – négy részletben',   180000, 'prod_VhIC69usAOqsTU', true),
  ('egyeni_program_havi',      'Egyéni program – havi részletekben', 100000, 'prod_VhIC69usAOqsTU', true)
on conflict (code) do update set label = excluded.label, amount_huf = excluded.amount_huf,
  stripe_product_id = excluded.stripe_product_id, is_active = true, updated_at = now();

-- A program korai indításának kérése (az elállási határidőn belül) is hozzájárulás.
alter table public.purchase_consents drop constraint purchase_consents_consent_kind_check;
alter table public.purchase_consents add constraint purchase_consents_consent_kind_check
  check (consent_kind in ('immediate_performance_withdrawal_waiver', 'program_early_start'));

alter table public.admin_notifications drop constraint admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check check (kind in (
  'chargeback', 'revenue_warning', 'payment_failed', 'progression_request', 'overbooking', 'other',
  'application', 'consultation_booked', 'weekly_report', 'business_inquiry',
  'program_paid', 'program_payment_failed'));

-- -----------------------------------------------------------------------------
-- Fizetési ajánlat (a konzultáció után kiküldött link)
-- -----------------------------------------------------------------------------
create type public.payment_offer_status as enum ('kikuldve', 'fizetve', 'visszavonva');

create table public.program_payment_offers (
  id              uuid primary key default gen_random_uuid(),
  token           uuid not null unique default gen_random_uuid(),
  application_id  uuid references public.applications (id) on delete set null,
  full_name       text not null check (char_length(btrim(full_name)) between 2 and 120),
  email           text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  starts_on       date not null,
  status          public.payment_offer_status not null default 'kikuldve',
  plan            text check (plan is null or plan in ('egyeni_program_egyben', 'egyeni_program_4_reszlet', 'egyeni_program_havi')),
  enrollment_id   uuid,
  stripe_checkout_session_id text,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);
create index program_payment_offers_application_idx on public.program_payment_offers (application_id);

alter table public.program_payment_offers enable row level security;
alter table public.program_payment_offers force row level security;
create policy program_payment_offers_admin on public.program_payment_offers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.program_payment_offers to authenticated;
grant all on public.program_payment_offers to service_role;

-- -----------------------------------------------------------------------------
-- A program fizetési állapota
-- -----------------------------------------------------------------------------
alter table public.program_enrollments
  add column offer_id               uuid references public.program_payment_offers (id) on delete set null,
  add column payment_plan           text check (payment_plan is null or payment_plan in ('egyeni_program_egyben', 'egyeni_program_4_reszlet', 'egyeni_program_havi')),
  add column stripe_customer_id     text,
  add column stripe_subscription_id text unique,
  add column installments_total     smallint check (installments_total between 1 and 12),
  add column installments_paid      smallint not null default 0 check (installments_paid >= 0),
  add column past_due_since         timestamptz;

alter table public.program_payment_offers
  add constraint program_payment_offers_enrollment_fk foreign key (enrollment_id) references public.program_enrollments (id) on delete set null;

-- A résztvevő is lássa a fizetési állapotát (a belső megjegyzés továbbra is rejtett).
grant select (offer_id, payment_plan, installments_total, installments_paid, past_due_since)
  on public.program_enrollments to authenticated;

-- Hozzáfér-e a program felületéhez: aktív, elkezdődött, és nincs 10 napnál régebbi elmaradt részlet.
create or replace function public._enrollment_open(e public.program_enrollments)
returns boolean
language sql stable
set search_path = ''
as $$
  select e.status = 'aktiv'
     and e.starts_on <= public.budapest_today()
     and (e.past_due_since is null
          or e.past_due_since + make_interval(days => (select past_due_grace_days from public.app_settings where id)) > now())
$$;

create or replace function public.is_program_participant()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.program_enrollments e
     where e.user_id = (select auth.uid()) and public._enrollment_open(e)
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
       where e.user_id = (select auth.uid()) and public._enrollment_open(e)
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

-- A heti beszámoló is csak nyitott programba küldhető.
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
  if not found or not public._enrollment_open(v_e) then
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

-- A program áttekintése: kiegészítve a fizetési állapottal.
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
    'payment_overdue', v_e.past_due_since is not null,
    'payment_paused', v_e.status = 'aktiv' and v_e.starts_on <= v_today and not public._enrollment_open(v_e),
    'next_session', case when v_next.id is null then null else jsonb_build_object(
      'id', v_next.id, 'starts_at', v_next.starts_at, 'duration_minutes', v_next.duration_minutes,
      'note', v_next.note,
      'meet_url', case when now() >= v_next.starts_at - interval '15 minutes' then v_next.meet_url end
    ) end
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Szerveroldali (service role) függvények a fizetési folyamathoz
-- -----------------------------------------------------------------------------

-- A fizetési oldal adatai a link tokenje alapján.
create or replace function public.payment_offer_info(p_token uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_o public.program_payment_offers;
begin
  perform public._require_service_role();
  select * into v_o from public.program_payment_offers where token = p_token;
  if not found then
    return null;
  end if;
  return jsonb_build_object('id', v_o.id, 'full_name', v_o.full_name, 'email', v_o.email,
    'starts_on', v_o.starts_on, 'status', v_o.status, 'plan', v_o.plan);
end;
$$;

-- Sikeres első fizetés: program létrehozása (idempotens – egy ajánlat egy program).
create or replace function public.program_payment_completed(
  p_offer_id uuid,
  p_user_id uuid,
  p_plan text,
  p_customer text,
  p_subscription text
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_o public.program_payment_offers;
  v_e uuid;
  v_total smallint := case p_plan when 'egyeni_program_egyben' then 1 when 'egyeni_program_4_reszlet' then 4 when 'egyeni_program_havi' then 8 end;
begin
  perform public._require_service_role();
  if v_total is null then
    raise exception 'Ismeretlen fizetési mód.' using errcode = 'P0001', hint = 'INVALID_PLAN';
  end if;
  select * into v_o from public.program_payment_offers where id = p_offer_id for update;
  if not found then
    raise exception 'A fizetési ajánlat nem található.' using errcode = 'P0001', hint = 'OFFER_NOT_FOUND';
  end if;
  if v_o.enrollment_id is not null then
    return v_o.enrollment_id;
  end if;

  -- Ha már van aktív programja (pl. kézzel felvett), ahhoz kötjük a fizetést.
  select id into v_e from public.program_enrollments where user_id = p_user_id and status = 'aktiv';
  if v_e is null then
    insert into public.program_enrollments (user_id, application_id, starts_on, stage2_from)
    values (p_user_id, v_o.application_id, v_o.starts_on, v_o.starts_on + 63)
    returning id into v_e;
  end if;

  update public.program_enrollments
     set offer_id = v_o.id, payment_plan = p_plan, stripe_customer_id = p_customer,
         stripe_subscription_id = nullif(p_subscription, ''), installments_total = v_total,
         installments_paid = case when p_plan = 'egyeni_program_egyben' then 1 else installments_paid end
   where id = v_e;

  update public.program_payment_offers
     set status = 'fizetve', plan = p_plan, enrollment_id = v_e, paid_at = now()
   where id = v_o.id;
  if v_o.application_id is not null then
    update public.applications set status = 'resztvevo' where id = v_o.application_id;
  end if;

  insert into public.admin_notifications (kind, payload)
  values ('program_paid', jsonb_build_object('enrollment_id', v_e, 'name', v_o.full_name, 'plan', p_plan));
  return v_e;
end;
$$;

-- Sikeres részlet (előfizetéses számla). Visszaadja a program azonosítóját, vagy NULL-t.
create or replace function public.program_installment_paid(p_subscription text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public._require_service_role();
  update public.program_enrollments
     set installments_paid = least(installments_paid + 1, coalesce(installments_total, 12)),
         past_due_since = null
   where stripe_subscription_id = p_subscription
  returning id into v_id;
  return v_id;
end;
$$;

-- Sikertelen részlet: a türelmi idő indul (csak az első sikertelen próbálkozáskor). Igaz, ha most indult.
create or replace function public.program_installment_failed(p_subscription text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_e public.program_enrollments;
begin
  perform public._require_service_role();
  select * into v_e from public.program_enrollments where stripe_subscription_id = p_subscription for update;
  if not found or v_e.past_due_since is not null then
    return false;
  end if;
  update public.program_enrollments set past_due_since = now() where id = v_e.id;
  insert into public.admin_notifications (kind, payload)
  values ('program_payment_failed', jsonb_build_object('enrollment_id', v_e.id));
  return true;
end;
$$;

revoke execute on function public.payment_offer_info(uuid) from public, anon, authenticated;
revoke execute on function public.program_payment_completed(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.program_installment_paid(text) from public, anon, authenticated;
revoke execute on function public.program_installment_failed(text) from public, anon, authenticated;
revoke execute on function public._enrollment_open(public.program_enrollments) from public, anon;
grant execute on function public._enrollment_open(public.program_enrollments) to authenticated;
grant execute on all functions in schema public to service_role;
