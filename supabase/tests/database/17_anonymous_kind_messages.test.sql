-- =============================================================================
-- 17_anonymous_kind_messages.test.sql — névtelen Kedves Üzenet
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

create function pg_temp.as_service() returns void language sql as $f$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
$f$;
create function pg_temp.as_anon() returns void language sql as $f$
  select set_config('request.jwt.claims', '{"role":"anon"}', true);
$f$;

select has_column('public', 'kind_messages', 'anonymous', 'van anonymous oszlop');

select pg_temp.as_service();
create temp table t_msg on commit drop as
  select * from public.submit_kind_message('Erzsi', '+36301234567', 'Gondolok rád.', null, 'Teszt Elek', 'anon-test@example.com');
grant select on t_msg to public;

select is((select anonymous from public.kind_messages where id = (select message_id from t_msg)), false,
  'alapból nem névtelen');

select lives_ok(
  $$ select public.set_kind_message_anonymous((select message_id from t_msg), true) $$,
  'a szerver névtelennek jelölheti');
select is((select anonymous from public.kind_messages where id = (select message_id from t_msg)), true,
  'a jelölés megmarad');
select is((select guest_email from public.kind_messages where id = (select message_id from t_msg)), 'anon-test@example.com',
  'a küldő adatai továbbra is tárolódnak');

select pg_temp.as_anon();
select throws_ok(
  $$ select public.set_kind_message_anonymous(gen_random_uuid(), true) $$,
  '42501', null, 'kliens nem hívhatja');

select pg_temp.as_service();
update public.kind_messages set status = 'delivered' where id = (select message_id from t_msg);
select throws_ok(
  $$ select public.set_kind_message_anonymous((select message_id from t_msg), false) $$,
  'P0002', null, 'kézbesített üzenetnél már nem módosítható');

select * from finish();
rollback;
