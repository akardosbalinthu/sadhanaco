-- =============================================================================
-- 13_paid_consultations.test.sql — fizetős 1-on-1 konzultáció
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

create function pg_temp.mk_user(p_email text, p_tier public.membership_tier, p_status public.subscription_status default 'active') returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  update public.profiles set tier = p_tier, subscription_status = p_status, membership_started_at = now() where id = v;
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
grant execute on all functions in schema pg_temp to authenticated, service_role;

select pg_temp.mk_user('t@example.test', 'tarsasagi') as t \gset
select pg_temp.mk_user('b@example.test', 'belso_kor') as b \gset
select pg_temp.mk_user('p@example.test', 'tarsasagi', 'trialing') as p \gset

select pg_temp.act_as(:'t');
set local role authenticated;
select is(pg_temp.err($$select public.create_paid_consultation('$$ || :'t' || $$')$$), '42501', 'kliens nem hozhat létre fizetős konzultációt');
reset role;

select pg_temp.as_service();
set local role service_role;
select is(pg_temp.err($$select public.create_paid_consultation('$$ || :'p' || $$')$$), 'TRIAL_NOT_ALLOWED', 'próbaidő alatt nem foglalható');
select is(pg_temp.err($$select public.create_paid_consultation('$$ || :'t' || $$', now() - interval '1 day')$$), 'INVALID_TIME', 'múltbeli időpont nem adható meg');
select (public.create_paid_consultation(:'t', now() + interval '5 days', 'Téma')).id as ct \gset
select (public.create_paid_consultation(:'b')).id as cb \gset
reset role;
select is((select price_huf from public.consultations where id = :'ct'), 15000, 'A Társaság Tagja: 15 000 Ft');
select is((select price_huf from public.consultations where id = :'cb'), 13000, 'A Belső Kör Tagja: 13 000 Ft');
select is((select status::text from public.consultations where id = :'ct'), 'pending_payment', 'fizetésre vár');

select pg_temp.as_service();
set local role service_role;
select is((public.confirm_paid_consultation(:'ct')).status::text, 'requested', 'a fizetés után kérésként megjelenik');
select is((public.confirm_paid_consultation(:'ct')).status::text, 'requested', 'ismételt webhook: nem változik');
select is(pg_temp.err($$select public.confirm_paid_consultation(gen_random_uuid())$$), 'CONSULTATION_NOT_FOUND', 'ismeretlen konzultáció');
reset role;

update public.consultations set created_at = now() - interval '25 hours' where id = :'cb';
select is(public.purge_unpaid_consultations(), 1, 'a 24 óránál régebbi ki nem fizetett kérés törlődik');
select is((select count(*)::int from public.consultations where id = :'ct'), 1, 'a kifizetett megmarad');

select * from finish();
rollback;
