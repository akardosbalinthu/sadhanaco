-- =============================================================================
-- 025 – Az egyéni program 16 hetes (2026. november 28.)
-- A program 8 hónap helyett 16 hét: hetente egy 60 perces alkalom. A heti beszámoló csak a
-- 16 hét alatt küldhető; utána a tananyag, a gyakorlási terv és a napló örökre elérhető marad
-- (a hozzáférés a program végén nem zárul le, csak ha az admin lezárja).
-- A második modul (Tudatosság) alapból a 9. héten nyílik (+56 nap).
-- A havi (8 részletes) fizetési mód megszűnik; a régi rekordok kezelése változatlan.
-- =============================================================================

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
  if v_today >= v_e.starts_on + 112 then
    raise exception 'A program 16 hete lezárult, heti beszámolót már nem kell küldened.' using errcode = 'P0001', hint = 'PROGRAM_ENDED';
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
  v_end    date;
begin
  select * into v_e from public.program_enrollments
   where user_id = (select auth.uid())
   order by (status = 'aktiv') desc, starts_on desc limit 1;
  if not found then
    return null;
  end if;

  v_end := v_e.starts_on + 112; -- 16 hét
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
    'ends_on', v_end - 1,
    'learning_ends_on', v_end - 1,
    'stage2_from', v_e.stage2_from,
    'started', v_e.starts_on <= v_today,
    'month', greatest(v_month, 0),
    'week', greatest(((v_today - v_e.starts_on) / 7) + 1, 0),
    'phase', case
               when v_e.status = 'lezart' then 'lezarult'
               when v_e.starts_on > v_today then 'hamarosan'
               when v_today < v_end then 'tanulas'
               else 'lezarult'
             end,
    'practice_plan', v_e.practice_plan,
    'week_start', v_week,
    'report_done', v_report,
    'reports_open', v_e.starts_on <= v_today and v_today < v_end,
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
    values (p_user_id, v_o.application_id, v_o.starts_on, v_o.starts_on + 56)
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

  -- A program vége (kezdés + 16 hét, vagy a korábbi lezárás) után 1 évvel: a jelentkezés,
  -- a heti beszámolók, az alkalmak és a belső jegyzet törlése. A gyakorlási terv a tananyaggal
  -- és a naplóval együtt a résztvevőé marad (örökös hozzáférés).
  with ended as (
    select e.id, e.application_id from public.program_enrollments e
     where least((e.starts_on + 112)::timestamptz, coalesce(e.closed_at, 'infinity'::timestamptz)) < now() - interval '1 year'
  ), del_r as (
    delete from public.weekly_reports r using ended where r.enrollment_id = ended.id returning 1
  ), del_s as (
    delete from public.program_sessions s using ended where s.enrollment_id = ended.id returning 1
  ), clr as (
    update public.program_enrollments e set admin_note = null, application_id = null
      from ended where e.id = ended.id returning ended.application_id
  )
  delete from public.applications a using clr where a.id = clr.application_id;

  return v_n;
end;
$$;

update public.price_catalog set is_active = false, updated_at = now() where code = 'egyeni_program_havi';

update public.modules set subtitle = case stage
    when 1 then 'A program első fele · 1–8. hét'
    when 2 then 'A program második fele · 9–16. hét'
  end
 where stage in (1, 2);

-- Az ÁSZF új változata (a program 16 hetes, a havi részletfizetés megszűnt).
update public.app_settings set terms_version = '2026-11-28', updated_at = now() where id;
