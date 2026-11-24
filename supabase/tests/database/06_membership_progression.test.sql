-- =============================================================================
-- 06_membership_progression.test.sql — tagsági állapotátmenetek (próba, fizetés,
-- sikertelen terhelés + 10 napos türelmi idő, megszűnés, visszatérés), privát
-- részvételi pontok, továbblépési kérelem + admin jóváhagyás, ütemezett feladatok.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(45);

-- ---- Teszt-segédek (pg_temp: csak ebben a munkamenetben léteznek) ----------
create function pg_temp.mk_user(
  p_email  text,
  p_tier   public.membership_tier     default 'tarsasagi',
  p_status public.subscription_status default 'active'
) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          p_email, '{}'::jsonb, now(), now());
  update public.profiles
     set tier = p_tier, subscription_status = p_status, membership_started_at = now()
   where id = v;
  return v;
end $f$;

-- A következő utasítások ennek a felhasználónak a nevében futnak (JWT claim).
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;

-- Lefuttat egy utasítást, és visszaadja a hiba HINT kódját (vagy SQLSTATE-jét).
create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
declare h text;
begin
  execute p_sql;
  return 'NO_ERROR';
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  -- Saját gépi kódjaink (pl. TRIAL_NOT_ALLOWED) a HINT-ben; egyébként SQLSTATE.
  return case when h ~ '^[A-Z_]+$' then h else sqlstate end;
end $f$;
grant execute on all functions in schema pg_temp to authenticated;
-- ---------------------------------------------------------------------------
create function pg_temp.as_service() returns void language sql as $f$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
$f$;
update public.app_settings set superadmin_emails = array['owner@example.test'];

select pg_temp.mk_user('uj@example.test', 'none', 'none') as u \gset
select pg_temp.mk_user('owner@example.test', 'belso_kor', 'active') as sa \gset
select pg_temp.mk_user('masik@example.test', 'tarsasagi', 'active') as other \gset

-- ---- Állapotátmenetek csak szerverről ------------------------------------------------
set local role authenticated;
select pg_temp.act_as(:'u');
select is(pg_temp.err($$select public.membership_payment_succeeded(auth.uid(), 'belso_kor', 'year', now() + interval '1 year', 279400)$$),
          '42501', 'tag nem adhat magának tagságot');
reset role;

set local role service_role;
select pg_temp.as_service();

-- Próba
select is((select row(subscription_status, free_messages_remaining, privat_kozlony_pro)::text
             from public.membership_trial_started(:'u', now() + interval '7 days')),
          row('trialing', 0, false)::text, 'próba: nincs díjmentes üzenet és Közlöny');
select is(pg_temp.err($$select public.membership_trial_started('$$ || :'u' || $$', now() + interval '7 days')$$),
          'ALREADY_MEMBER', 'aktív tagság mellett nem indulhat újabb próba');

-- Első fizetés a próba után
select is((select row(subscription_status, free_messages_remaining, privat_kozlony_pro, trial_ends_at is null)::text
             from public.membership_payment_succeeded(:'u', 'tarsasagi', 'month', now() + interval '1 month', 9940)),
          row('active', 1, true, true)::text, 'első fizetés: 1 díjmentes üzenet és Közlöny PRO azonnal');
reset role;
update public.profiles set free_messages_remaining = 0 where id = :'u';   -- elküldte
set local role service_role;
select pg_temp.as_service();
select is((select free_messages_remaining::int
             from public.membership_payment_succeeded(:'u', 'tarsasagi', 'month', now() + interval '1 month', 9940)),
          0, 'ismételt (webhook-duplikált) hívás nem ad újabb keretet');

-- Szintváltás Belső Körre (havi): +2 üzenet azonnal, konzultáció nincs
select is((select row(tier, free_messages_remaining, free_consultations_remaining)::text
             from public.membership_payment_succeeded(:'u', 'belso_kor', 'month', now() + interval '1 month', 27940)),
          row('belso_kor', 2, 0)::text, 'Társasági -> Belső Kör: a különbözet (2 üzenet) azonnal jár');

-- Belső Kör éves: 4 konzultáció, évfordulós nullázás, nem görgethető
select is((select free_consultations_remaining::int
             from public.membership_payment_succeeded(:'u', 'belso_kor', 'year', now() + interval '1 year', 279400)),
          4, 'Belső Kör éves: 4 díjmentes konzultáció');
reset role;
update public.profiles set free_consultations_remaining = 1 where id = :'u';  -- 3-at felhasznált
set local role service_role;
select pg_temp.as_service();
select is((select free_consultations_remaining::int
             from public.membership_payment_succeeded(:'u', 'belso_kor', 'year', now() + interval '2 years', 279400)),
          4, 'éves megújításkor 4-re áll vissza (nem 5: nem görgethető)');

-- Sikertelen terhelés
select is(public.membership_payment_failed(:'u'), true, 'első sikertelen terhelés: értesítés megy');
select is(public.membership_payment_failed(:'u'), false, 'további újrapróbálkozásnál nem megy újabb értesítés');
reset role;
select is((select subscription_status::text from public.profiles where id = :'u'), 'past_due', 'állapot: past_due');
select is((select count(*)::int from public.admin_notifications where kind = 'payment_failed'), 1, 'admin értesítés készült');

set local role authenticated;
select pg_temp.act_as(:'u');
select ok(public.has_member_access(), 'past_due: a türelmi időn belül megmarad a hozzáférés');
select ok(public.is_paying_member(), 'past_due a türelmi időn belül fizető tagnak számít');
reset role;
update public.profiles set past_due_since = now() - interval '11 days' where id = :'u';
set local role authenticated;
select pg_temp.act_as(:'u');
select ok(not public.has_member_access(), '10 nap után a hozzáférés szünetel');
reset role;

-- Utólag sikerült a terhelés: hozzáférés vissza, nem új ciklus (a nyitott lépcső megmarad)
update public.profiles set m2_unlocked = true, m2_unlocked_at = now() where id = :'u';
set local role service_role;
select pg_temp.as_service();
select is((select row(subscription_status, past_due_since is null, m2_unlocked)::text
             from public.membership_payment_succeeded(:'u', 'belso_kor', 'year', now() + interval '2 years', 279400)),
          row('active', true, true)::text, 'sikeres utólagos terhelés: aktív, a haladás megmarad');

-- Megszűnés és visszatérés: minden elölről
select is((select row(tier, m2_unlocked, privat_kozlony_pro, free_messages_remaining)::text
             from public.membership_ended(:'u')),
          row('none', false, false, 0)::text, 'megszűnés: hozzáférés, lépcsők, keretek nullázva');
reset role;
select ok((select membership_ended_at is not null from public.profiles where id = :'u'), 'volt tag állapot rögzítve');
update public.profiles set membership_started_at = now() - interval '1 year' where id = :'u';
set local role service_role;
select pg_temp.as_service();
select ok((select membership_started_at > now() - interval '1 minute'
             from public.membership_payment_succeeded(:'u', 'tarsasagi', 'month', now() + interval '1 month', 9940)),
          'visszatérő tag: új tagsági ciklus, a heti ütemezés elölről indul');
select is((select row(m2_unlocked, m2_purchased)::text
             from public.membership_stage_purchased(:'u', 'gyorsitott_m2_ip2')),
          row(false, true)::text, 'gyorsított vásárlás rögzítve, de a lépcső nem nyílik automatikusan');
reset role;

-- ---- Továbblépés ---------------------------------------------------------------------
-- A tag 70 napja tag (I. lépcső 9 hete letelt), 2 leckéből 2-t pipált.
update public.profiles set membership_started_at = now() - interval '70 days', m2_purchased = false where id = :'u';
insert into public.lessons (id, module_id, week_number, kind, title, is_published)
select gen_random_uuid(), m.id, w, 'audio'::public.lesson_kind, 'Lecke ' || w, true
  from public.modules m, generate_series(1, 2) w where m.stage = 1;
insert into public.lesson_completions (user_id, lesson_id)
select :'u', l.id from public.lessons l join public.modules m on m.id = l.module_id where m.stage = 1;
update public.app_settings set progression_points_required = '{"2": 5, "3": 999, "4": 0}';

set local role authenticated;
select pg_temp.act_as(:'u');
select is((public.stage_progress(1::smallint) ->> 'completed')::boolean, true, 'az I. lépcső elvégezve');
select is((public.participation_score() ->> 'points')::int, 1, 'pontok: 1 gyakorlási nap = 1 pont');
select is(public.progression_status() ->> 'eligible', 'false', 'kevés pont: még nem jogosult');
select is(pg_temp.err('select public.request_progression()'), 'NOT_ELIGIBLE', 'nem jogosult kérés elutasítva');
reset role;

-- Saját tapasztalat posztolása (3 pont) + egy másik tag "Köszönöm, hasznos volt" reakciója (1 pont)
insert into public.posts (id, author_id, body) values ('00000000-0000-0000-0000-0000000bb001', :'u', 'Esti gyakorlás tapasztalata');
insert into public.post_reactions (post_id, user_id, kind) values
  ('00000000-0000-0000-0000-0000000bb001', :'other', 'koszonom'),
  ('00000000-0000-0000-0000-0000000bb001', :'u', 'koszonom');   -- saját reakció nem számít

set local role authenticated;
select pg_temp.act_as(:'u');
select is((public.participation_score() ->> 'points')::int, 5, 'pontok: 1 nap + 3 poszt + 1 kapott köszönet (saját nem)');
select is(public.progression_status() ->> 'basis', 'participation', 'jogosultság alapja: részvétel');
select is(public.progression_status() ->> 'eligible', 'true', 'jogosult a továbblépés kérésére');
select is((select status::text from public.request_progression('Szívesen beszélnék a továbblépésről')), 'requested',
          'a kérés létrejött (díjmentes konzultációval)');
select is(pg_temp.err('select public.request_progression()'), 'ALREADY_REQUESTED', 'nyitott kérés mellett nem lehet újat');
select ok(not public.can_access_stage(2::smallint), 'a kérés önmagában nem nyitja a II. lépcsőt');
select is(pg_temp.err($$select public.admin_decide_progression(
            (select id from public.progression_requests limit 1), true)$$),
          'FORBIDDEN', 'tag nem hagyhatja jóvá saját magát');
select is(pg_temp.err($$select public.participation_score('$$ || :'other' || $$')$$),
          'FORBIDDEN', 'más tag pontjai nem láthatók (nincs rangsor)');
reset role;
select is((select count(*)::int from public.admin_notifications where kind = 'progression_request'), 1,
          'admin értesítést kapott a kérésről');

set local role authenticated;
select pg_temp.act_as(:'sa');
select is((public.participation_score(:'u') ->> 'points')::int, 5, 'az admin látja a tag pontjait');
select is((select status::text from public.admin_decide_progression(
             (select id from public.progression_requests where user_id = :'u'), true, 'Konzultáció megvolt')),
          'approved', 'admin jóváhagyta a konzultáció után');
reset role;
select is((select m2_unlocked from public.profiles where id = :'u'), true, 'a II. lépcső megnyílt');
set local role authenticated;
select pg_temp.act_as(:'u');
select is((public.progression_status() ->> 'target_stage')::int, 3, 'a következő cél az IP 3');
reset role;

-- Belső Kör: pont nélkül is jogosult (az előző lépcső elvégzése után)
update public.profiles set membership_started_at = now() - interval '70 days' where id = :'sa';
insert into public.lesson_completions (user_id, lesson_id)
select :'sa', l.id from public.lessons l join public.modules m on m.id = l.module_id where m.stage = 1;
update public.app_settings set progression_points_required = '{"2": 999, "3": 999, "4": 0}';
set local role authenticated;
select pg_temp.act_as(:'sa');
select is(public.progression_status() ->> 'basis', 'belso_kor', 'Belső Kör: pontszámtól függetlenül jogosult');
reset role;

-- ---- Ütemezett feladatok ---------------------------------------------------------------
update public.profiles set free_messages_remaining = 0 where id in (:'u', :'sa', :'other');
select is((public.run_scheduled_tasks(make_timestamptz(2027, 3, 1, 10, 0, 0, 'Europe/Budapest')) ->> 'monthly_reset_rows')::int,
          3, 'hó 1-jén a fizető tagok kerete visszaáll');
select is((select free_messages_remaining::int from public.profiles where id = :'sa'), 3, 'Belső Kör: 3 üzenet');
select is((public.run_scheduled_tasks(make_timestamptz(2027, 3, 1, 11, 0, 0, 'Europe/Budapest')) ->> 'monthly_reset_rows')::int,
          0, 'ugyanazon a napon nem fut le kétszer');
select is((public.run_scheduled_tasks(make_timestamptz(2027, 3, 5, 6, 30, 0, 'Europe/Budapest')) ->> 'friday_checkin')::boolean,
          false, 'péntek 6:30-kor még nincs pénteki kör');
select is((public.run_scheduled_tasks(make_timestamptz(2027, 3, 5, 8, 0, 0, 'Europe/Budapest')) ->> 'friday_checkin')::boolean,
          true, 'péntek 7:00 után kimegy a pénteki kör');
select is((select count(*)::int from public.posts where kind = 'penteki_kor' and author_id = :'sa'), 1,
          'a pénteki kör poszt a superadmin nevében jelent meg');
select is((select count(*)::int from cron.job where jobname = 'run-scheduled-tasks'), 1, 'óránkénti ütemezés beállítva');

select * from finish();
rollback;
