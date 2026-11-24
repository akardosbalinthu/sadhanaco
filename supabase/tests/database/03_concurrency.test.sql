-- =============================================================================
-- 03_concurrency.test.sql — a keretek és kvóták párhuzamos hívások mellett
-- sem léphetők túl.
--
-- Módszer: dblink-kel N külön adatbázis-kapcsolatot nyitunk (N külön tag vagy
-- ugyanaz a tag N-szer). Egy "setup" kapcsolat zárolja a versenyzett sort,
-- a dolgozók aszinkron elküldik a hívást és mind a zárra várnak; a zár
-- feloldásakor egyszerre indulnak. Ellenőrizzük, hogy tényleg vártak, és hogy
-- pontosan a megengedett számú hívás sikerült.
--
-- Mivel a dolgozók külön tranzakcióban futnak, a tesztadatokat véglegesíteni
-- kell; ezeket a teszt elején és végén is töröljük (fix UUID-k, conc-* címek).
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
set local client_min_messages = warning;   -- a várt távoli hibák NOTICE-ait elnyeljük
select plan(9);

select set_config('test.cs',
  format('host=%s port=%s dbname=postgres user=postgres password=postgres',
         host(inet_server_addr()), inet_server_port()), true);
select extensions.dblink_connect('setup', current_setting('test.cs'));

-- ---- Takarítás (egy korábbi, félbeszakadt futás után is) + véglegesített adatok --
create function pg_temp.cleanup() returns void language sql as $f$
  select extensions.dblink_exec('setup', $q$
    delete from public.events where id = '00000000-0000-0000-0000-0000000ce001';
    delete from auth.users where email like 'conc-%@example.test';
  $q$);
$f$;
select pg_temp.cleanup();

select extensions.dblink_exec('setup', $q$
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select ('00000000-0000-0000-0000-0000000c' || lpad(i::text, 4, '0'))::uuid,
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'conc-' || i || '@example.test', '{}'::jsonb, now(), now()
    from generate_series(1, 12) as i;

  -- 1..10: Belső Kör tagok az eseményhez
  update public.profiles set tier = 'belso_kor', subscription_status = 'active', membership_started_at = now()
   where email like 'conc-%@example.test';
  -- 11: Társasági tag, havi 3 díjmentes üzenettel (szándékosan több, mint a valós 1, hogy a verseny látszódjon)
  update public.profiles set tier = 'tarsasagi', free_messages_remaining = 3
   where email = 'conc-11@example.test';
  -- 12: Belső Kör tag, 2 díjmentes konzultációval
  update public.profiles set free_consultations_remaining = 2
   where email = 'conc-12@example.test';

  -- Nyílt Est 10 fős teremmel => 5 tagi hely; a Belső Kör-ablakon kívül
  insert into public.events (id, kind, title, starts_at, capacity, members_only, registration_opens_at,
                             price_tarsasagi_huf, price_belso_kor_huf, is_published)
  values ('00000000-0000-0000-0000-0000000ce001', 'nyilt_est', 'Párhuzamossági teszt', now() + interval '7 days',
          10, false, now() - interval '3 days', 3200, 0, true);
$q$);

-- ---- Versenyeztető segéd ----------------------------------------------------
create function pg_temp.race(p_uids uuid[], p_sql text, p_lock_sql text,
                             out successes int, out waited int)
language plpgsql as $f$
declare
  n int := array_length(p_uids, 1);
  c int;
begin
  successes := 0;
  -- 1) A setup kapcsolat zárolja a versenyzett sort.
  perform extensions.dblink_exec('setup', 'begin');
  perform * from extensions.dblink('setup', p_lock_sql) as t(x int);

  -- 2) Dolgozók: saját kapcsolat, authenticated szerepkör, saját JWT, aszinkron hívás.
  for i in 1..n loop
    perform extensions.dblink_connect('w' || i, current_setting('test.cs') || ' application_name=race_worker');
    perform extensions.dblink_exec('w' || i, 'set role authenticated');
    perform extensions.dblink_exec('w' || i, format('set request.jwt.claims = %L',
              json_build_object('sub', p_uids[i], 'role', 'authenticated')::text));
    perform extensions.dblink_send_query('w' || i, p_sql);
  end loop;

  -- 3) Megvárjuk, hogy mind a zárra várjon, és ezt meg is számoljuk.
  for attempt in 1..50 loop
    perform pg_stat_clear_snapshot();   -- a pg_stat_activity tranzakción belül gyorsítótárazott
    select count(*) into waited from pg_stat_activity
     where wait_event_type = 'Lock' and application_name = 'race_worker';
    exit when waited >= n;
    perform pg_sleep(0.1);
  end loop;

  -- 4) Zár elengedése: mindenki egyszerre indul.
  perform extensions.dblink_exec('setup', 'commit');

  -- 5) Eredmények begyűjtése (hiba esetén a sor üres).
  for i in 1..n loop
    select count(*) into c from extensions.dblink_get_result('w' || i, false) as t(r text);
    successes := successes + c;
    perform * from extensions.dblink_get_result('w' || i, false) as t(r text);
    perform extensions.dblink_disconnect('w' || i);
  end loop;
end $f$;

-- ---- 1) Eseményfoglalás: 10 tag egyszerre, 5 tagi hely -----------------------
create temp table r_event as
select * from pg_temp.race(
  array(select ('00000000-0000-0000-0000-0000000c' || lpad(i::text, 4, '0'))::uuid from generate_series(1, 10) i),
  $q$select (public.book_event('00000000-0000-0000-0000-0000000ce001')).id::text$q$,
  $q$select 1 from public.events where id = '00000000-0000-0000-0000-0000000ce001' for update$q$
);
select is((select waited from r_event), 10, 'esemény: mind a 10 hívás valóban egyszerre várt');
select is((select successes from r_event), 5, 'esemény: pontosan 5 sikeres foglalás (50% kvóta)');
select is((select count(*)::int from public.event_registrations
            where event_id = '00000000-0000-0000-0000-0000000ce001' and status <> 'cancelled'),
          5, 'esemény: az adatbázisban is pontosan 5 aktív tagi hely');

-- ---- 2) Díjmentes Kedves Üzenet: ugyanaz a tag 8-szor egyszerre, keret 3 -----
create temp table r_msg as
select * from pg_temp.race(
  array_fill('00000000-0000-0000-0000-0000000c0011'::uuid, array[8]),
  $q$select (public.send_free_kind_message('Mama', '+36301234567', 'Köszönöm')).id::text$q$,
  $q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000c0011' for update$q$
);
select is((select waited from r_msg), 8, 'üzenet: mind a 8 hívás valóban egyszerre várt');
select is((select successes from r_msg), 3, 'üzenet: pontosan 3 sikeres díjmentes üzenet');
select is((select free_messages_remaining::int from public.profiles where id = '00000000-0000-0000-0000-0000000c0011'),
          0, 'üzenet: a keret 0, nem negatív');

-- ---- 3) Díjmentes konzultáció: ugyanaz a tag 6-szor egyszerre, keret 2 -------
create temp table r_cons as
select * from pg_temp.race(
  array_fill('00000000-0000-0000-0000-0000000c0012'::uuid, array[6]),
  $q$select (public.book_free_consultation(now() + interval '7 days', null)).id::text$q$,
  $q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000c0012' for update$q$
);
select is((select waited from r_cons), 6, 'konzultáció: mind a 6 hívás valóban egyszerre várt');
select is((select successes from r_cons), 2, 'konzultáció: pontosan 2 sikeres foglalás');
select is((select count(*)::int from public.consultations where user_id = '00000000-0000-0000-0000-0000000c0012'),
          2, 'konzultáció: az adatbázisban is pontosan 2');

-- ---- Takarítás ----------------------------------------------------------------
select pg_temp.cleanup();
select extensions.dblink_disconnect('setup');

select * from finish();
rollback;
