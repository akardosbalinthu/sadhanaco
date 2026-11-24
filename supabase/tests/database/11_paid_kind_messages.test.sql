-- =============================================================================
-- 11_paid_kind_messages.test.sql — kereten felüli, fizetős Elsőbbségi Kedves Üzenet
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

create function pg_temp.mk_user(p_email text, p_status public.subscription_status default 'active') returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  update public.profiles set tier = 'tarsasagi', subscription_status = p_status, membership_started_at = now() where id = v;
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
create function pg_temp.kxp(p_uid uuid) returns integer language sql as $f$
  select coalesce(sum(xp), 0)::int from public.xp_events where user_id = p_uid and source = 'kind_message';
$f$;
grant execute on all functions in schema pg_temp to authenticated, service_role;

select pg_temp.mk_user('a@example.test') as a \gset
select pg_temp.mk_user('t@example.test', 'trialing') as t \gset
select pg_temp.mk_user('adm@example.test') as adm \gset
update public.profiles set role = 'admin' where id = :'adm';

-- Kliens nem hívhatja
select pg_temp.act_as(:'a');
set local role authenticated;
select is(pg_temp.err($$select public.create_paid_kind_message('$$ || :'a' || $$', 'X', '+36301234567', 'm', 3000)$$), '42501', 'kliens nem hozhat létre fizetős piszkozatot');
reset role;

select pg_temp.as_service();
set local role service_role;
select is(pg_temp.err($$select public.create_paid_kind_message('$$ || :'t' || $$', 'X', '+36301234567', 'm', 3000)$$), 'TRIAL_NOT_ALLOWED', 'próbaidő alatt nem küldhető');
select is(pg_temp.err($$select public.create_paid_kind_message('$$ || :'a' || $$', 'X', '+36301234567', 'm', 999)$$), 'AMOUNT_TOO_LOW', 'a minimum alatt nem küldhető');
select public.create_paid_kind_message(:'a', 'Anyu', '+36301234567', 'Köszönöm.', 5000) as m \gset
select is((select status::text from public.kind_messages where id = :'m'), 'pending_payment', 'a piszkozat fizetésre vár');
select is((select is_free from public.kind_messages where id = :'m'), false, 'nem keretből megy');
reset role;

select is(pg_temp.kxp(:'a'), 0, 'fizetés előtt nincs XP');
select pg_temp.act_as(:'adm');
set local role authenticated;
select is((select count(*)::int from public.admin_kind_message_queue() q where q.id = :'m'), 0, 'fizetés előtt nincs a kézbesítési sorban');
reset role;

select pg_temp.as_service();
set local role service_role;
select is((public.confirm_paid_kind_message(:'m')).status::text, 'queued', 'a fizetés után sorba áll');
select is((public.confirm_paid_kind_message(:'m')).status::text, 'queued', 'ismételt webhook: nem változik');
select is(pg_temp.err($$select public.confirm_paid_kind_message(gen_random_uuid())$$), 'MESSAGE_NOT_FOUND', 'ismeretlen üzenet');
reset role;
select ok(pg_temp.kxp(:'a') > 0, 'a fizetéskor XP jár');
select is((select count(*)::int from public.xp_events where user_id = :'a' and source = 'kind_message'), 1, 'az XP egyszer jár');

-- Takarítás
select pg_temp.as_service();
set local role service_role;
select public.create_paid_kind_message(:'a', 'Régi', '+36301234567', 'm', 2000) as old \gset
reset role;
update public.kind_messages set created_at = now() - interval '25 hours' where id = :'old';
select is(public.purge_unpaid_kind_messages(), 1, 'a 24 óránál régebbi ki nem fizetett piszkozat törlődik');
select is((select count(*)::int from public.kind_messages where id = :'m'), 1, 'a kifizetett üzenet megmarad');

select * from finish();
rollback;
