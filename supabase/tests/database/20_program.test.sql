-- =============================================================================
-- 20_program.test.sql — egyéni program: jelentkezés, szűrés, időpontfoglalás,
-- résztvevői hozzáférés, heti beszámoló, Nyílt Est díjmentesség
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

create function pg_temp.mk_user(p_email text) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  return v;
end $f$;
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;
create function pg_temp.as_service() returns void language sql as $f$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
$f$;
create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
declare h text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  return h;
end $f$;
create function pg_temp.apply(p_email text, p_start public.application_start, p_health boolean default true)
returns public.applications language sql as $f$
  select public.submit_application('Teszt Elek', p_email, null,
    '{"alvas":{"rating":3,"hours":6}}'::jsonb, 'Sokat stresszelek.', 7::smallint, 8::smallint,
    'igen', 'igen', 'talan', p_start, p_health, true);
$f$;

select is((select registration_open from public.app_settings), false, 'az új regisztráció lezárva');

-- 1. Jelentkezés: csak szerveroldalról, hozzájárulással
select pg_temp.act_as(pg_temp.mk_user('kivancsi@example.com'));
select is(pg_temp.err($$ select pg_temp.apply('x@example.com', 'azonnal') $$), 'FORBIDDEN', 'bejelentkezett felhasználó nem hívhatja');
select pg_temp.as_service();
select is(pg_temp.err($$ select pg_temp.apply('x@example.com', 'azonnal', false) $$), 'HEALTH_CONSENT_REQUIRED', 'egészségügyi hozzájárulás nélkül nem megy');

select (pg_temp.apply('gyors@example.com', 'azonnal')).token as t \gset q_
select (pg_temp.apply('lassu@example.com', 'egy_honapon_belul')).token as t \gset nq_
select ok((select qualified from public.applications where token = :'q_t'), 'az „azonnal” minősített');
select ok(not (select qualified from public.applications where token = :'nq_t'), 'a későbbi kezdés nem minősített');
select is((select health_consent_version from public.applications where token = :'q_t'), '2026-11-25', 'a hozzájárulás verziója rögzítve');
select is((select count(*)::int from public.admin_notifications where kind = 'application'), 2, 'admin értesítés minden jelentkezésről');

-- 2. Időpontok
insert into public.consultation_slots (starts_at) values (now() + interval '1 day') returning id as id \gset s1_
insert into public.consultation_slots (starts_at) values (now() + interval '2 days') returning id as id \gset s2_
insert into public.consultation_slots (starts_at) values (now() + interval '1 hour') returning id as id \gset soon_

select is(jsonb_array_length(public.application_booking_info(:'q_t')->'slots'), 2, 'a két órán belüli időpont nem látszik');
select is(pg_temp.err(format($$ select public.book_consultation_slot(%L, %L) $$, :'nq_t', :'s1_id')), 'NOT_QUALIFIED', 'nem minősített nem foglalhat');
select is(pg_temp.err(format($$ select public.book_consultation_slot(%L, %L) $$, :'q_t', :'soon_id')), 'SLOT_NOT_AVAILABLE', 'túl közeli időpont nem foglalható');
select lives_ok(format($$ select public.book_consultation_slot(%L, %L) $$, :'q_t', :'s1_id'), 'minősített foglalhat');
select is(pg_temp.err(format($$ select public.book_consultation_slot(%L, %L) $$, :'q_t', :'s2_id')), 'ALREADY_BOOKED', 'egy jelentkezés egy időpont');
select is((select status::text from public.applications where token = :'q_t'), 'foglalt', 'a jelentkezés állapota: foglalt');
select ok(public.application_booking_info(:'q_t')->'booked' is not null, 'a foglalás visszaolvasható');

select (pg_temp.apply('masik@example.com', 'azonnal')).token as t \gset q2_
select is(pg_temp.err(format($$ select public.book_consultation_slot(%L, %L) $$, :'q2_t', :'s1_id')), 'SLOT_TAKEN', 'foglalt időpontot más nem kaphat');

-- 3. Jogosultság: jelentkezést csak admin lát
select pg_temp.mk_user('adm@example.com') as id \gset adm_
update public.profiles set role = 'admin' where id = :'adm_id';
select pg_temp.mk_user('resztvevo@example.com') as id \gset p_
select pg_temp.mk_user('kulsos@example.com') as id \gset o_

select pg_temp.act_as(:'o_id');
set local role authenticated;
select is((select count(*)::int from public.applications), 0, 'idegen nem látja a jelentkezéseket');
select is((select count(*)::int from public.consultation_slots), 0, 'idegen nem látja az időpontokat');
reset role;

select pg_temp.act_as(:'adm_id');
set local role authenticated;
select is((select count(*)::int from public.applications), 3, 'az admin látja a jelentkezéseket');
select lives_ok(format($$ insert into public.program_enrollments (user_id, starts_on, stage2_from, practice_plan, admin_note)
  values (%L, public.budapest_today() - 70, public.budapest_today() - 7, 'Reggel 10 perc.', 'belső') $$, :'p_id'),
  'az admin felveheti a résztvevőt');
reset role;

-- 4. Résztvevő
select pg_temp.act_as(:'p_id');
set local role authenticated;
select ok(public.has_member_access(), 'a résztvevő hozzáfér');
select ok(public.can_access_stage(1::smallint) and public.can_access_stage(2::smallint), 'mindkét lépcső nyitva');
select ok(not public.can_access_stage(3::smallint), 'a III. lépcső nem része a programnak');
select is(public.current_week(2::smallint), 2, 'a Tudatosság hete a nyitástól számít');
select is((public.my_program())->>'phase', 'tanulas', 'a program az első szakaszban van');
select throws_ok($$ select admin_note from public.program_enrollments $$, '42501', null, 'a belső megjegyzést nem láthatja');
select lives_ok($$ select public.submit_weekly_report(5::smallint, 'Jól ment.', null, 'Kérdés?') $$, 'heti beszámoló küldhető');
select lives_ok($$ select public.submit_weekly_report(6::smallint, 'Még jobban.', null, null) $$, 'a heti beszámoló újraküldhető (felülír)');
select is((select count(*)::int from public.weekly_reports), 1, 'hetente egy beszámoló');
reset role;

select pg_temp.act_as(:'o_id');
set local role authenticated;
select is(pg_temp.err($$ select public.submit_weekly_report(3::smallint, null, null, null) $$), 'NOT_PARTICIPANT', 'nem résztvevő nem küldhet beszámolót');
reset role;

-- 4/b. A 16 hét után: lezárult, beszámoló már nem kell, a tananyag örökre elérhető
update public.program_enrollments set starts_on = public.budapest_today() - 120, stage2_from = public.budapest_today() - 64 where user_id = :'p_id';
select pg_temp.act_as(:'p_id');
set local role authenticated;
select is((public.my_program())->>'phase', 'lezarult', 'a 16. hét után a program lezárult');
select is((public.my_program())->>'week', '18', 'a hét sorszáma a kezdéstől számít');
select is((public.my_program())->>'reports_open', 'false', 'a 16. hét után nincs heti beszámoló');
select is(pg_temp.err($$ select public.submit_weekly_report(4::smallint, null, null, null) $$), 'PROGRAM_ENDED', 'a 16. hét után beszámoló nem küldhető');
select ok(public.can_access_stage(1::smallint) and public.can_access_stage(2::smallint), 'a tananyag a program után is elérhető');
reset role;
update public.program_enrollments set starts_on = public.budapest_today() - 70, stage2_from = public.budapest_today() - 7 where user_id = :'p_id';

-- 5. Nyílt Est: résztvevőnek díjmentes
insert into public.events (kind, title, is_online, starts_at, ends_at, members_only, allowed_tiers, registration_opens_at, is_published, price_external_huf, capacity)
values ('nyilt_est', 'Nyílt Est', false, now() + interval '3 days', now() + interval '3 days 2 hours', false,
        array['tarsasagi','belso_kor']::public.membership_tier[], now() - interval '1 day', true, 4940, 15)
returning id as id \gset ev_
select pg_temp.as_service();
select is((public.reserve_guest_seat(:'ev_id', 'Résztvevő', 'resztvevo@example.com')).price_huf, 0, 'a résztvevő díjmentesen jön');
select is((public.reserve_guest_seat(:'ev_id', 'Külsős', 'kulsos@example.com')).price_huf, 4940, 'mindenki más 4 940 Ft');

-- 6. Adattakarékosság
update public.applications set created_at = now() - interval '200 days' where token = :'nq_t';
select pg_temp.as_service();
select ok(public.purge_old_applications() >= 1, 'a 180 napnál régebbi, programba nem került jelentkezés törlődik');
select is((select count(*)::int from public.applications where token = :'nq_t'), 0, 'a régi jelentkezés eltűnt');
update public.program_enrollments set starts_on = public.budapest_today() - 800, stage2_from = public.budapest_today() - 700 where user_id = :'p_id';
select public.purge_old_applications();
select is((select count(*)::int from public.weekly_reports), 0, 'a program vége után 1 évvel a beszámolók törlődnek');
select ok((select practice_plan from public.program_enrollments where user_id = :'p_id') is not null, 'a gyakorlási terv a résztvevőé marad');

select * from finish();
rollback;
