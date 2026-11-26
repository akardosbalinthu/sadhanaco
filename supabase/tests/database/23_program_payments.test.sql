-- =============================================================================
-- 23_program_payments.test.sql — fizetési ajánlat, automatikus felvétel, részletek, türelmi idő
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

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

select is((select amount_huf from public.price_catalog where code = 'egyeni_program_4_reszlet'), 180000, 'a négy részlet ára a katalógusban');

insert into public.program_payment_offers (full_name, email, starts_on)
values ('Fizető Ágnes', 'agnes@example.com', public.budapest_today()) returning id as id, token as token \gset o_
insert into public.program_payment_offers (full_name, email, starts_on)
values ('Havi Béla', 'bela@example.com', public.budapest_today()) returning id as id, token as token \gset h_
select pg_temp.mk_user('agnes@example.com') as id \gset a_
select pg_temp.mk_user('bela@example.com') as id \gset b_

select pg_temp.act_as(:'a_id');
set local role authenticated;
select throws_ok(format($$ select public.payment_offer_info(%L) $$, :'o_token'), '42501', null, 'a fizetési adatok csak szerveroldalról');
select is((select count(*)::int from public.program_payment_offers), 0, 'az ajánlatokat csak az admin látja');
reset role;

-- Egyösszegű fizetés → automatikus felvétel
select pg_temp.as_service();
select is((public.payment_offer_info(:'o_token'))->>'status', 'kikuldve', 'az ajánlat kiküldött állapotú');
select public.program_payment_completed(:'o_id', :'a_id', 'egyeni_program_egyben', 'cus_a', '') as id \gset ea_
select is((select installments_paid from public.program_enrollments where id = :'ea_id'), 1::smallint, 'az egyösszegű fizetés teljes');
select is(public.program_payment_completed(:'o_id', :'a_id', 'egyeni_program_egyben', 'cus_a', ''), :'ea_id'::uuid, 'ismételt esemény nem hoz létre második programot');
select is((select status::text from public.program_payment_offers where id = :'o_id'), 'fizetve', 'az ajánlat fizetett');

-- Havi részletek
select public.program_payment_completed(:'h_id', :'b_id', 'egyeni_program_havi', 'cus_b', 'sub_b') as id \gset eb_
select is((select installments_total from public.program_enrollments where id = :'eb_id'), 8::smallint, 'havi fizetésnél 8 részlet');
select public.program_installment_paid('sub_b');
select is((select installments_paid from public.program_enrollments where id = :'eb_id'), 1::smallint, 'az első részlet rögzítve');
select ok(public.program_installment_failed('sub_b'), 'a sikertelen részlet elindítja a türelmi időt');
select ok(not public.program_installment_failed('sub_b'), 'a második sikertelen próbálkozás nem indít újat');

select pg_temp.act_as(:'b_id');
set local role authenticated;
select ok(public.is_program_participant(), 'a türelmi idő alatt a hozzáférés megmarad');
reset role;

update public.program_enrollments set past_due_since = now() - interval '11 days' where id = :'eb_id';
select pg_temp.act_as(:'b_id');
set local role authenticated;
select ok(not public.is_program_participant() and (public.my_program())->>'payment_paused' = 'true', '10 nap után a felület szünetel');
reset role;

select pg_temp.as_service();
select public.program_installment_paid('sub_b');
select pg_temp.act_as(:'b_id');
set local role authenticated;
select ok(public.is_program_participant(), 'a sikeres fizetés után a hozzáférés visszaáll');
reset role;

select * from finish();
rollback;
