-- =============================================================================
-- 02_trial_quotas_events.test.sql — próbaidő-korlátok, díjmentes keretek,
-- eseményfoglalási szabályok (kvóta, 48 órás ablak, elvonulás), KATA, sztornó.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

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

-- ---- Adatok -----------------------------------------------------------------
select pg_temp.mk_user('proba@example.test', 'tarsasagi', 'trialing') as proba \gset
select pg_temp.mk_user('tag@example.test',   'tarsasagi', 'active')   as tag \gset
select pg_temp.mk_user('bk1@example.test',   'belso_kor', 'active')   as bk1 \gset
select pg_temp.mk_user('bk2@example.test',   'belso_kor', 'active')   as bk2 \gset
select pg_temp.mk_user('bk3@example.test',   'belso_kor', 'active')   as bk3 \gset
select pg_temp.mk_user('admin@example.test', 'belso_kor', 'active')   as admin \gset
update public.profiles set role = 'admin' where id = :'admin';
update public.profiles set free_messages_remaining = 1, free_consultations_remaining = 0 where id in (:'proba', :'tag');
update public.profiles set free_messages_remaining = 3, free_consultations_remaining = 1 where id in (:'bk1', :'bk2', :'bk3');

-- Nyílt Est: 4 fő, 50% tagi kvóta => 2 tagi hely. Regisztráció 1 órája nyílt (Belső Kör ablak aktív).
insert into public.events (id, kind, title, starts_at, capacity, members_only, registration_opens_at,
                           price_external_huf, price_tarsasagi_huf, price_belso_kor_huf, is_published)
values ('00000000-0000-0000-0000-00000000e001', 'nyilt_est', 'Nyílt Meditációs Est', now() + interval '10 days',
        4, false, now() - interval '1 hour', 4940, 3200, 0, true);
-- Nyílt Est, amelynek Belső Kör ablaka már lejárt.
insert into public.events (id, kind, title, starts_at, capacity, members_only, registration_opens_at,
                           price_external_huf, price_tarsasagi_huf, price_belso_kor_huf, is_published)
values ('00000000-0000-0000-0000-00000000e002', 'nyilt_est', 'Nyílt Est 2', now() + interval '10 days',
        15, false, now() - interval '3 days', 4940, 3200, 0, true);
-- Elvonulás (IP 3 utáni jóváhagyás kell)
insert into public.events (id, kind, title, starts_at, capacity, requires_retreat_unlock, registration_opens_at,
                           price_tarsasagi_huf, price_belso_kor_huf, is_published)
values ('00000000-0000-0000-0000-00000000e003', 'elvonulas', 'Szabadság Elvonulás', now() + interval '60 days',
        15, true, now() - interval '5 days', 75000, 0, true);
-- Élő Q&A — csak Belső Kör
insert into public.events (id, kind, title, starts_at, is_online, allowed_tiers, registration_opens_at, is_published)
values ('00000000-0000-0000-0000-00000000e004', 'qa_elo', 'Havi élő Q&A', now() + interval '5 days', true,
        array['belso_kor']::public.membership_tier[], now() - interval '5 days', true);
-- Még nem nyílt meg
insert into public.events (id, kind, title, starts_at, capacity, registration_opens_at, is_published)
values ('00000000-0000-0000-0000-00000000e005', 'gyakorlonap', 'Élő Gyakorlónap', now() + interval '30 days',
        15, now() + interval '1 day', true);

-- ---- Próbaidős tag ------------------------------------------------------------
set local role authenticated;
select pg_temp.act_as(:'proba');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e002')$$),
          'TRIAL_NOT_ALLOWED', 'próbaidő: eseményfoglalás tiltva');
select is(pg_temp.err($$select public.send_free_kind_message('Mama', '+36301234567', 'Köszönöm')$$),
          'TRIAL_NOT_ALLOWED', 'próbaidő: díjmentes Kedves Üzenet tiltva');
select is(pg_temp.err($$select public.book_free_consultation(now() + interval '7 days', null)$$),
          'TRIAL_NOT_ALLOWED', 'próbaidő: konzultációfoglalás tiltva');
select is((select count(*)::int from public.kind_messages), 0, 'próbaidő: nem jött létre üzenet');
select is((select count(*)::int from public.event_registrations), 0, 'próbaidő: nem jött létre foglalás');
select is(pg_temp.err($$insert into public.posts (body) values ('Első hetem tapasztalata')$$),
          'NO_ERROR', 'próbaidő: a közösségi tér írható');
reset role;
select is((select free_messages_remaining::int from public.profiles where id = :'proba'), 1,
          'próbaidő: a keret érintetlen maradt');

-- ---- Díjmentes Kedves Üzenet keret --------------------------------------------
set local role authenticated;
select pg_temp.act_as(:'tag');
select is(pg_temp.err($$select public.send_free_kind_message('Mama', '+36301234567', 'Köszönöm, hogy vagy')$$),
          'NO_ERROR', 'Társasági tag: 1. díjmentes üzenet elküldve');
select is(pg_temp.err($$select public.send_free_kind_message('Papa', '+36301234568', 'Köszönöm')$$),
          'QUOTA_EXHAUSTED', 'Társasági tag: a 2. díjmentes üzenet már nem megy');
select is((select count(*)::int from public.kind_messages where is_free), 1, 'pontosan 1 díjmentes üzenet');
select is((select free_messages_remaining::int from public.profiles), 0, 'a keret 0, nem negatív');

-- ---- Díjmentes konzultáció keret ----------------------------------------------
select is(pg_temp.err($$select public.book_free_consultation(now() + interval '7 days', null)$$),
          'QUOTA_EXHAUSTED', 'Társasági tagnak nincs díjmentes konzultációja');
select pg_temp.act_as(:'bk1');
select is(pg_temp.err($$select public.book_free_consultation(now() + interval '7 days', 'Esti gyakorlás')$$),
          'NO_ERROR', 'Belső Kör: díjmentes konzultáció lefoglalva');
select is(pg_temp.err($$select public.book_free_consultation(now() + interval '8 days', null)$$),
          'QUOTA_EXHAUSTED', 'Belső Kör: kimerült keret után nem foglalható');
select is(pg_temp.err($$select public.book_free_consultation(now() - interval '1 day', null)$$),
          'QUOTA_EXHAUSTED', 'keret ellenőrzése az időpont előtt');

-- ---- Eseményfoglalás ----------------------------------------------------------
-- Társasági tag a 48 órás Belső Kör-ablakban
select pg_temp.act_as(:'tag');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e001')$$),
          'PRIORITY_WINDOW', 'Társasági tag nem foglalhat a 48 órás Belső Kör-ablakban');
-- Belső Kör tagok: 2 tagi hely (4 fő * 50%)
select pg_temp.act_as(:'bk1');
select is((select status::text from public.book_event('00000000-0000-0000-0000-00000000e001')),
          'confirmed', 'Belső Kör: díjmentes, azonnal megerősített hely');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e001')$$),
          'ALREADY_REGISTERED', 'kétszer nem lehet ugyanarra jelentkezni');
select pg_temp.act_as(:'bk2');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e001')$$),
          'NO_ERROR', 'Belső Kör: 2. tagi hely');
select pg_temp.act_as(:'bk3');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e001')$$),
          'EVENT_FULL', 'az 50%-os tagi kvóta után nincs több tagi hely (külsősöknek marad)');

-- Ablak után a Társasági tag fizetős, ideiglenesen tartott helyet kap
select pg_temp.act_as(:'tag');
select is((select row(status, price_huf, hold_expires_at is not null)::text
             from public.book_event('00000000-0000-0000-0000-00000000e002')),
          row('pending_payment', 3200, true)::text,
          'Társasági tag: 3 200 Ft, fizetésre váró, időkorlátos helyfoglalás');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e004')$$),
          'TIER_NOT_ALLOWED', 'élő Q&A-ra csak Belső Kör jelentkezhet');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e005')$$),
          'REGISTRATION_NOT_OPEN', 'még nem nyílt regisztrációra nem lehet foglalni');

-- Elvonulás: zárt, amíg nincs retreat_unlocked
select pg_temp.act_as(:'bk1');
select is((select count(*)::int from public.events where id = '00000000-0000-0000-0000-00000000e003'), 0,
          'elvonulás nem látszik jóváhagyás nélkül');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e003')$$),
          'RETREAT_LOCKED', 'elvonulás nem foglalható jóváhagyás nélkül');
reset role;
update public.profiles set retreat_unlocked = true where id = :'bk1';
set local role authenticated;
select pg_temp.act_as(:'bk1');
select is((select row(status, price_huf)::text from public.book_event('00000000-0000-0000-0000-00000000e003')),
          row('confirmed', 0)::text, 'Belső Kör: elvonulás jóváhagyás után díjmentesen foglalható');
reset role;

-- Lejárt fizetési helyfoglalás felszabadul
update public.event_registrations set hold_expires_at = now() - interval '1 minute'
 where user_id = :'tag' and event_id = '00000000-0000-0000-0000-00000000e002';
set local role authenticated;
select pg_temp.act_as(:'tag');
select is(pg_temp.err($$select public.book_event('00000000-0000-0000-0000-00000000e002')$$),
          'NO_ERROR', 'lejárt helyfoglalás után újra lehet jelentkezni');
reset role;
select is((select count(*)::int from public.event_registrations
            where user_id = :'tag' and event_id = '00000000-0000-0000-0000-00000000e002' and status = 'cancelled'),
          1, 'a lejárt helyfoglalás törölt állapotba került');

-- ---- KATA-összesítő és sztornó (determinisztikus: a jövő évre számolunk) ---------
select (extract(year from now() at time zone 'Europe/Budapest')::int + 1) as y \gset
-- Lezárt (nem induló) előfizetések nem számítanak bele az előrejelzésbe:
update public.profiles set subscription_status = 'canceled', tier = 'none'
 where id not in (:'tag', :'bk1');
update public.profiles
   set billing_interval = 'month', recurring_amount_huf = 9940,
       current_period_end = make_timestamptz(:y, 6, 15, 12, 0, 0, 'Europe/Budapest'), country = 'HU'
 where id = :'tag';                                      -- jún.–dec.: 7 x 9 940 = 69 580
update public.profiles
   set billing_interval = 'year', recurring_amount_huf = 279400,
       current_period_end = make_timestamptz(:y, 3, 1, 12, 0, 0, 'Europe/Budapest'), country = 'DE'
 where id = :'bk1';                                      -- 1 x 279 400 (EU)
update public.app_settings set kata_annual_limit_huf = 1000000;

insert into public.invoices (id, user_id, description, amount_huf, country, region, billing_entity, issued_at)
values ('00000000-0000-0000-0000-0000000f0001', :'tag', 'Társasági Tagság', 9940, 'HU', 'HU', '{}',
        make_timestamptz(:y, 2, 1, 12, 0, 0, 'Europe/Budapest')),
       ('00000000-0000-0000-0000-0000000f0002', :'bk1', 'Belső Kör', 600000, 'DE', 'EU', '{}',
        make_timestamptz(:y, 2, 1, 12, 0, 0, 'Europe/Budapest')),
       ('00000000-0000-0000-0000-0000000f0003', :'bk1', 'Tavalyi', 50000, 'HU', 'HU', '{}',
        make_timestamptz(:y - 1, 12, 31, 23, 30, 0, 'Europe/Budapest'));

set local role authenticated;
select pg_temp.act_as(:'admin');
select is((public.kata_revenue_status(:y) ->> 'invoiced_total_huf')::bigint, 609940::bigint,
          'KATA: csak az adott naptári év (Budapest) számlái');
select is((public.kata_revenue_status(:y) ->> 'projected_renewals_huf')::bigint, (69580 + 279400)::bigint,
          'KATA: várható megújulások az év végéig');
select is((public.kata_revenue_status(:y) ->> 'warning')::boolean, true,
          'KATA: 80% felett figyelmeztet (609 940 + 348 980 >= 800 000)');
select is((public.kata_revenue_status(:y) -> 'invoiced_by_region' ->> 'EU')::bigint, 600000::bigint,
          'régiós bontás: EU');

select is(pg_temp.err($$select public.admin_record_storno('00000000-0000-0000-0000-0000000f0002', 'Hibás összeg', 'E-STORNO-1')$$),
          'NO_ERROR', 'admin sztornózhat hibás számlát');
select is((public.kata_revenue_status() ->> 'invoiced_total_huf')::bigint, (50000 - 600000)::bigint,
          'a sztornó a saját kiállítási évében negatív tételként csökkenti az összeget');
select is(pg_temp.err($$select public.admin_record_storno('00000000-0000-0000-0000-0000000f0002', 'Megint', 'E-STORNO-2')$$),
          'ALREADY_STORNOED', 'egy számla csak egyszer sztornózható');
select is(pg_temp.err($$update public.invoices set amount_huf = 1 where id = '00000000-0000-0000-0000-0000000f0001'$$),
          '42501', 'kiállított számla összege nem írható át');

select pg_temp.act_as(:'tag');
select is(pg_temp.err($$select public.admin_record_storno('00000000-0000-0000-0000-0000000f0001', 'x', 'y')$$),
          'FORBIDDEN', 'tag nem sztornózhat');
reset role;

select * from finish();
rollback;
