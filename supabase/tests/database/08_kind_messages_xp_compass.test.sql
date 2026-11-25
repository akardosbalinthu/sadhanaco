-- =============================================================================
-- 08_kind_messages_xp_compass.test.sql — díjmentes és Elsőbbségi Kedves Üzenet,
-- az Idegrendszeri Iránytű (végleges rend) és a privát XP-rendszer
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(56);

-- ---- Teszt-segédek ----------------------------------------------------------
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
     set tier = p_tier, subscription_status = p_status, membership_started_at = now(),
         free_messages_remaining = case when p_tier = 'none' then 0 else 1 end
   where id = v;
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
  return 'NO_ERROR';
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  return case when h ~ '^[A-Z_]+$' then h else sqlstate end;
end $f$;
create function pg_temp.xp(p_uid uuid) returns integer language sql as $f$
  select coalesce(sum(e.xp), 0)::int from public.xp_events e
    join public.profiles p on p.id = e.user_id and e.cycle_started_at = p.membership_started_at
   where e.user_id = p_uid;
$f$;
grant execute on all functions in schema pg_temp to authenticated, service_role;
-- ---------------------------------------------------------------------------

select pg_temp.mk_user('a@example.test', 'tarsasagi', 'active')   as a \gset
select pg_temp.mk_user('b@example.test', 'belso_kor', 'active')   as b \gset
select pg_temp.mk_user('c@example.test', 'tarsasagi', 'active')   as c \gset
select pg_temp.mk_user('t@example.test', 'tarsasagi', 'trialing') as t \gset
select pg_temp.mk_user('d@example.test', 'tarsasagi', 'active')   as d \gset
select pg_temp.mk_user('x@example.test', 'none', 'canceled')      as x \gset
select pg_temp.mk_user('adm@example.test', 'belso_kor', 'active') as adm \gset
select pg_temp.mk_user('sa@example.test', 'belso_kor', 'active')  as sa \gset
update public.profiles set role = 'admin' where id = :'adm';
update public.profiles set role = 'superadmin' where id = :'sa';

-- =============================================================================
-- 1. Kedves Üzenet
-- =============================================================================
set local role authenticated;
select pg_temp.act_as(:'a');
select is(pg_temp.err($$select * from public.submit_kind_message('Anya', '+36301234567', 'Köszönöm', null, 'Vendég', 'v@example.test')$$),
          '42501', 'a kliens nem hívhatja közvetlenül a vendégbeküldést (csak a szerver)');
reset role;

set local role service_role;
select pg_temp.as_service();
select message_id as g1, confirm_token as g1tok, status as g1st
  from public.submit_kind_message('Anya', '+36301234567', 'Köszönöm, hogy mindig ott voltál.', null, 'Vendég Vera', 'Vera@Example.test') \gset
select is(:'g1st'::text, 'pending_confirmation', 'vendég üzenete megerősítésre vár');
select is(pg_temp.err($$select * from public.submit_kind_message('X', '+3630', 'szia', null, 'Nincs Email', 'nem-email')$$),
          'INVALID_GUEST', 'érvénytelen e-mail-cím elutasítva');
select is(pg_temp.err($$select public.confirm_kind_message('rossz-token')$$), 'TOKEN_INVALID', 'hibás token elutasítva');
select is((select status::text from public.confirm_kind_message(:'g1tok')), 'queued', 'megerősítés után sorba kerül');
select is((select status::text from public.confirm_kind_message(:'g1tok')), 'queued', 'a megerősítés idempotens');
select message_id as g2, confirm_token as g2tok
  from public.submit_kind_message('Barát', '+36305550000', 'Köszönöm a túrát.', null, 'Vendég Vera', 'vera@example.test') \gset
select ok((select status::text from public.confirm_kind_message(:'g2tok')) = 'queued',
          'ugyanarról az e-mail-címről több üzenet is küldhető');
select message_id as m1 from public.submit_kind_message('Tanár', '+36307770000', 'Köszönöm.', :'d') \gset
select is((select row(kind, status, sender_id)::text from public.kind_messages where id = :'m1'),
          row('standard', 'queued', :'d'::uuid)::text, 'bejelentkezett feladó díjmentes üzenete azonnal sorba kerül');
reset role;

-- Elsőbbségi üzenetek: havi keretből (díjmentes) és kereten felül, a tag által választott összegért.
set local role authenticated;
select pg_temp.act_as(:'b');
select is((select row(kind, is_free)::text from public.send_free_kind_message('Nagymama', '+36301110000', 'Köszönöm.')),
          row('priority', true)::text, 'a keretes üzenet elsőbbségi és díjmentes');
reset role;
insert into public.kind_messages (id, sender_id, kind, recipient_name, recipient_phone, message, is_free, amount_huf) values
  ('00000000-0000-0000-0000-0000000c0001', :'a', 'priority', 'Kolléga', '+36302220000', 'Köszönöm.', false, 2000),
  ('00000000-0000-0000-0000-0000000c0002', :'b', 'priority', 'Testvér', '+36303330000', 'Köszönöm.', false, 5000);
-- (egy tranzakción belül a now() állandó: a beérkezési sorrendet kézzel széthúzzuk)
update public.kind_messages set confirmed_at = now() + interval '1 minute' where id = :'g2';
update public.kind_messages set confirmed_at = now() + interval '2 minutes' where id = :'m1';
select is(pg_temp.err($$insert into public.kind_messages (sender_id, kind, recipient_name, recipient_phone, message, is_free, amount_huf)
                        values ('$$ || :'a' || $$', 'priority', 'X', '+36301', 'm', false, 500)$$),
          'AMOUNT_TOO_LOW', 'a kereten felüli díj legalább 1 000 Ft');
select is(pg_temp.err($$insert into public.kind_messages (kind, guest_name, guest_email, recipient_name, recipient_phone, message, is_free, amount_huf)
                        values ('priority', 'V', 'v@example.test', 'X', '+36301', 'm', true, 0)$$),
          '23514', 'elsőbbségi üzenetet csak tag küldhet');

set local role authenticated;
select pg_temp.act_as(:'a');
select is(pg_temp.err('select * from public.admin_kind_message_queue()'), 'FORBIDDEN', 'a sort csak admin látja');
select pg_temp.act_as(:'adm');
select is((select array_agg(row(kind, is_free, amount_huf)::text) from public.admin_kind_message_queue()),
          array[row('priority', true, 0)::text, row('priority', false, 5000)::text, row('priority', false, 2000)::text,
                row('standard', true, 0)::text, row('standard', true, 0)::text, row('standard', true, 0)::text],
          'sorrend: elsőbbségi kereten belül -> elsőbbségi fizetős összeg szerint -> díjmentes');
select is((select (array_agg(id))[4] from public.admin_kind_message_queue()), :'g1'::uuid,
          'a díjmentesek a beérkezés (megerősítés) sorrendjében');

-- Díjmentes: 3 sikertelen próbálkozás után sikertelen, nincs több próbálkozás.
select public.admin_record_kind_message_attempt(:'g1', false, 'nem vette fel');
select public.admin_record_kind_message_attempt(:'g1', false, 'foglalt');
select is((select status::text from public.admin_record_kind_message_attempt(:'g1', false, 'kicsengett')), 'failed',
          'díjmentes: a 3. sikertelen próbálkozás után sikertelen');
select is(pg_temp.err($$select public.admin_record_kind_message_attempt('$$ || :'g1' || $$', true)$$), 'NOT_IN_QUEUE',
          'díjmentes: sikertelen után nincs újabb próbálkozás');

-- Elsőbbségi: 3 sikertelen után utánkövetés (garancia), sikeres hívással kézbesítve.
select public.admin_record_kind_message_attempt('00000000-0000-0000-0000-0000000c0002', false);
select public.admin_record_kind_message_attempt('00000000-0000-0000-0000-0000000c0002', false);
select is((select status::text from public.admin_record_kind_message_attempt('00000000-0000-0000-0000-0000000c0002', false)),
          'followup', 'elsőbbségi: 3 sikertelen után utánkövetés, nem sikertelen');
select is((select status::text from public.admin_record_kind_message_attempt('00000000-0000-0000-0000-0000000c0002', true, 'átadva')),
          'delivered', 'elsőbbségi: a 4. próbálkozás is lehetséges, kézbesítve');
select is((select count(*)::int from public.kind_message_attempts where message_id = '00000000-0000-0000-0000-0000000c0002'), 4,
          'minden próbálkozás naplózva');
select is((select status::text from public.admin_close_kind_message('00000000-0000-0000-0000-0000000c0001', true, 'téves szám')),
          'failed', 'elsőbbségi üzenetet csak admin zárhat le sikertelenként, kézzel');
select pg_temp.act_as(:'a');
select is(pg_temp.err($$select public.admin_record_kind_message_attempt('$$ || :'m1' || $$', true)$$), 'FORBIDDEN',
          'tag nem rögzíthet kézbesítést');
select is((select count(*)::int from public.kind_messages where sender_id is null), 0,
          'a vendégüzenetek a tagok számára nem láthatók');
reset role;

-- Lejárt, meg nem erősített vendégüzenet törlődik.
set local role service_role;
select pg_temp.as_service();
select message_id as g3 from public.submit_kind_message('Valaki', '+36309990000', 'Köszönöm.', null, 'Lassú Laci', 'laci@example.test') \gset
reset role;
update public.kind_messages set confirm_expires_at = now() - interval '1 hour' where id = :'g3';
select public.purge_kind_message_phones();
select ok(not exists (select 1 from public.kind_messages where id = :'g3'), 'a lejárt, meg nem erősített üzenet törlődött');

-- =============================================================================
-- 2. Idegrendszeri Iránytű és a végleges rend
-- =============================================================================
select jsonb_object_agg(id::text, (select o ->> 'key' from jsonb_array_elements(options) o where o ->> 'order' = 'torpok')) as ans_torpok
  from public.compass_questions \gset
-- Holtverseny: 1. (súly 2) Tünde, 2. (súly 2) Kertőrző, 3–7. Tünde, 8–12. Kertőrző -> 7:7
select jsonb_object_agg(id::text, (select o ->> 'key' from jsonb_array_elements(options) o
                                    where o ->> 'order' = case when id = 1 or id between 3 and 7 then 'tundek' else 'kertorzok' end)) as ans_tie
  from public.compass_questions \gset

set local role authenticated;
select pg_temp.act_as(:'a');
select is(jsonb_array_length(public.compass_questionnaire()), 12, 'az Iránytű 12 kérdésből áll');
select ok(not (public.compass_questionnaire()::text like '%"order"%'), 'a kliens nem látja, melyik válasz melyik rend');
select is(pg_temp.err('select options from public.compass_questions'), '42501', 'a rend-hozzárendelés közvetlenül sem olvasható');
select is(pg_temp.err($$select public.submit_compass('{"1": "a"}')$$), 'COMPASS_INCOMPLETE', 'minden kérdésre válaszolni kell');
select is(public.submit_compass(:'ans_torpok')::text, 'torpok', 'a pontozás szerveroldalon: Törpök');
select is((select (compass_scores ->> 'torpok')::int from public.profiles where id = :'a'), 14, 'a pontszámok elmentve (12 kérdés, 2 súlyozott)');
select is(pg_temp.err($$select public.submit_compass('$$ || :'ans_torpok' || $$')$$), 'ORDER_LOCKED', 'a rend végleges, nem tölthető ki újra');

select pg_temp.act_as(:'b');
select is(pg_temp.err($$select public.submit_compass('$$ || :'ans_tie' || $$')$$), 'COMPASS_TIE', 'holtversenynél döntő kérdés kell');
select is(pg_temp.err($$select public.submit_compass('$$ || :'ans_tie' || $$', 'vandorok')$$), 'COMPASS_TIE',
          'a döntő válasz csak a holtversenyben lévő rendek közül lehet');
select is(public.submit_compass(:'ans_tie', 'kertorzok')::text, 'kertorzok', 'a döntő válasz eldönti a rendet');

select pg_temp.act_as(:'x');
select is(pg_temp.err($$select public.submit_compass('$$ || :'ans_torpok' || $$')$$), 'NOT_MEMBER', 'az Iránytű a tagság része');

select pg_temp.act_as(:'adm');
select is(pg_temp.err($$update public.profiles set order_key = 'vandorok' where id = '$$ || :'a' || $$'$$), 'ORDER_LOCKED',
          'admin sem módosíthatja a rendet');
select is(pg_temp.err($$select public.superadmin_set_order('$$ || :'a' || $$', 'vandorok')$$), 'FORBIDDEN', 'javítani csak superadmin tud');
select pg_temp.act_as(:'sa');
select is((select order_key::text from public.superadmin_set_order(:'a', 'vandorok')), 'vandorok', 'superadmin hibajavítása');
reset role;

-- =============================================================================
-- 3. XP — privát, korlátozott, csak a rendszer írhatja
-- =============================================================================
insert into public.lessons (id, module_id, week_number, kind, title, is_published, track)
select ('00000000-0000-0000-0000-0000000e00' || lpad(g::text, 2, '0'))::uuid, m.id, 1, 'audio', 'Lecke ' || g, true,
       case when g <= 3 then 'ritual_reggeli' else 'gyakorlas' end
  from public.modules m, generate_series(1, 12) g where m.stage = 1;

set local role authenticated;
select pg_temp.act_as(:'c');
insert into public.lesson_completions (lesson_id) values ('00000000-0000-0000-0000-0000000e0004');
reset role;
insert into public.lesson_completions (user_id, lesson_id, practiced_on)
values (:'c', '00000000-0000-0000-0000-0000000e0004', public.budapest_today() + 1);
select is(pg_temp.xp(:'c'), 10, 'lecke: 10 XP, ugyanaz a lecke újra pipálva nem ad többet');

insert into public.lesson_completions (user_id, lesson_id) values
  (:'c', '00000000-0000-0000-0000-0000000e0001'), (:'c', '00000000-0000-0000-0000-0000000e0002'),
  (:'c', '00000000-0000-0000-0000-0000000e0003');
select is(pg_temp.xp(:'c'), 20, 'rituálé: naponta legfeljebb 2 × 5 XP');

insert into public.lesson_completions (user_id, lesson_id)
select :'c', ('00000000-0000-0000-0000-0000000e00' || lpad(g::text, 2, '0'))::uuid from generate_series(5, 12) g;
select is((select sum(xp)::int from public.xp_events where user_id = :'c' and earned_on = public.budapest_today()), 60,
          'napi felső határ: 60 XP');

set local role authenticated;
select pg_temp.act_as(:'c');
insert into public.journal_entries (body) values ('Ma reggel könnyebben ment a kilégzés.');
select is(pg_temp.xp(:'c'), 60, 'a napi határon túl a napló sem ad XP-t (de elmentődik)');
select is((select count(*)::int from public.journal_entries), 1, 'a saját napló olvasható');
select is(pg_temp.err($$insert into public.xp_events (user_id, cycle_started_at, source, source_ref, xp)
                        values ('$$ || :'c' || $$', now(), 'lesson', 'csalas', 999)$$), '42501', 'XP-t a tag nem írhat');
select pg_temp.act_as(:'a');
select is((select count(*)::int from public.xp_events where user_id = :'c'), 0, 'más tag XP-je nem látható (nincs rangsor)');
select is(pg_temp.err($$select public.my_character_card('$$ || :'c' || $$')$$), 'FORBIDDEN', 'más tag karakterkártyája nem látható');
select pg_temp.act_as(:'adm');
select is((select count(*)::int from public.journal_entries), 0, 'a naplót az admin sem olvashatja');
reset role;

-- Közösség: első válasz egy megválaszolatlan posztra, kapott köszönet, pénteki kör.
insert into public.posts (id, author_id, body) values ('00000000-0000-0000-0000-0000000f0001', :'a', 'Esti gyakorlás nehezen ment.');
insert into public.posts (id, author_id, kind, body) values ('00000000-0000-0000-0000-0000000f0002', null, 'penteki_kor', 'Pénteki kör');
insert into public.comments (post_id, author_id, body) values ('00000000-0000-0000-0000-0000000f0001', :'b', 'Nekem a hosszabb kilégzés segített.');
insert into public.comments (post_id, author_id, body) values ('00000000-0000-0000-0000-0000000f0001', :'t', 'Nálam is.');
insert into public.comments (post_id, author_id, body) values ('00000000-0000-0000-0000-0000000f0002', :'b', 'A héten a légzés működött.');
insert into public.post_reactions (post_id, user_id, kind) values
  ('00000000-0000-0000-0000-0000000f0001', :'b', 'koszonom'),
  ('00000000-0000-0000-0000-0000000f0001', :'a', 'koszonom');
select is(pg_temp.xp(:'b'), 28, 'Kedves Üzenet 10 (havonta 1×) + első válasz egy megválaszolatlan posztra 8 + pénteki kör 10');
select is(pg_temp.xp(:'t'), 0, 'a második válasz már nem „megválaszolatlan” posztra jön');
select is(pg_temp.xp(:'a'), 17, 'Kedves Üzenet 10 + poszt 5 + kapott köszönet 2 (a saját reakció nem számít)');

-- Részvétel (admin jelöli), lépcső-bónusz a napi határ felett, megszűnt tag nem kap XP-t.
insert into public.events (id, kind, title, starts_at, registration_opens_at, is_online, is_published)
values ('00000000-0000-0000-0000-0000000ab001', 'online_meditacio', 'Heti közös meditáció', now(), now() - interval '1 day', true, true);
insert into public.event_registrations (id, event_id, user_id, is_member_seat, status)
values ('00000000-0000-0000-0000-0000000ab101', '00000000-0000-0000-0000-0000000ab001', :'t', true, 'confirmed');
update public.event_registrations set attended_at = now() where id = '00000000-0000-0000-0000-0000000ab101';
select is(pg_temp.xp(:'t'), 10, 'részvétel az online meditáción: 10 XP (próbaidőben is)');

insert into public.progression_requests (id, user_id, target_stage) values ('00000000-0000-0000-0000-0000000aa001', :'c', 2);
update public.progression_requests set status = 'approved', decided_at = now() where id = '00000000-0000-0000-0000-0000000aa001';
select is(pg_temp.xp(:'c'), 160, 'lépcső teljesítve: +100 XP, a napi határtól függetlenül');

insert into public.posts (author_id, body) values (:'x', 'Volt tag posztja');
select is((select count(*)::int from public.xp_events where user_id = :'x'), 0, 'megszűnt tagság alatt nincs XP');

-- Karakterkártya, mérföldkövek; visszatérő tag nulláról indul.
set local role authenticated;
select pg_temp.act_as(:'c');
select is((public.my_character_card() -> 'rank' ->> 'label'), 'Inas', 'rang: 160 XP = Inas');
select is((public.my_character_card() ->> 'xp_to_next')::int, 340, 'a következő rangig (Legény, 500) hátralévő XP');
select pg_temp.act_as(:'b');
select ok((public.my_character_card() -> 'milestones')::text like '%elso_valasz%', 'mérföldkő: első válasz egy társnak');
reset role;
update public.profiles set membership_started_at = now() + interval '1 second' where id = :'c';
set local role authenticated;
select pg_temp.act_as(:'c');
select is((public.my_character_card() ->> 'xp_total')::int, 0, 'új tagsági ciklus: az XP nulláról indul');
reset role;

select * from finish();
rollback;
