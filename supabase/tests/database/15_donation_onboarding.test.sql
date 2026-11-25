-- =============================================================================
-- 15_donation_onboarding.test.sql — adomány alapú esemény, bevezető-jelző
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
begin
  execute p_sql;
  return 'NO_ERROR';
exception when others then
  return sqlstate;
end $f$;
grant execute on all functions in schema pg_temp to authenticated, anon;

insert into public.events (kind, title, starts_at, registration_opens_at, capacity, members_only, price_external_huf, price_tarsasagi_huf, is_published, donation_based)
values ('nyilt_est', 'Adományest', now() + interval '3 days', now() - interval '1 day', 15, false, 0, 0, true, true)
returning id as ev \gset

select is(pg_temp.err($$insert into public.events (kind, title, starts_at, registration_opens_at, members_only, price_external_huf, price_tarsasagi_huf, donation_based)
  values ('nyilt_est', 'x', now() + interval '3 days', now(), false, 4940, 3200, true)$$), '23514', 'adomány alapú eseménynek nem lehet ára');

set local role anon;
select is((select donation_based from public.public_open_evenings() where id = :'ev'), true, 'a nyilvános lista jelzi az adomány alapú estet');
reset role;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'uj@example.test', '{}'::jsonb, now(), now());
select is((select onboarded_at from public.profiles where id = '11111111-1111-1111-1111-111111111111'), null, 'új tagnál a bevezető még nincs meg');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;
select is(pg_temp.err($$update public.profiles set onboarded_at = now() where id = '11111111-1111-1111-1111-111111111111'$$), 'NO_ERROR', 'a tag jelölheti, hogy látta a bevezetőt');
select is(pg_temp.err($$update public.profiles set tier = 'belso_kor' where id = '11111111-1111-1111-1111-111111111111'$$), '42501', 'más mezőt továbbra sem írhat');
reset role;
select isnt((select onboarded_at from public.profiles where id = '11111111-1111-1111-1111-111111111111'), null, 'a jelző mentődött');

select * from finish();
rollback;
