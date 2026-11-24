-- =============================================================================
-- 12_cancel_registration.test.sql — saját foglalás lemondása, meghívó visszavonása
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

create function pg_temp.mk_user(p_email text) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  update public.profiles set tier = 'tarsasagi', subscription_status = 'active', membership_started_at = now() where id = v;
  return v;
end $f$;
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
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

select pg_temp.mk_user('a@example.test') as a \gset
select pg_temp.mk_user('b@example.test') as b \gset

insert into public.events (kind, title, starts_at, capacity, registration_opens_at, is_published, belso_kor_priority)
values ('online_meditacio', 'Meditáció', now() + interval '2 days', 1, now() - interval '3 days', true, false)
returning id as ev \gset
insert into public.events (kind, title, starts_at, registration_opens_at, is_published)
values ('tura', 'Túra', now() + interval '5 days', now() - interval '3 days', true)
returning id as hike \gset
insert into public.events (kind, title, starts_at, registration_opens_at, is_published)
values ('online_meditacio', 'Régi', now() - interval '1 hour', now() - interval '3 days', true)
returning id as past \gset

-- A lefoglalja az egyetlen helyet; B-nek nem jut
select pg_temp.act_as(:'a');
set local role authenticated;
select (public.book_event(:'ev')).id as reg \gset
reset role;
select pg_temp.act_as(:'b');
set local role authenticated;
select is(pg_temp.err($$select public.book_event('$$ || :'ev' || $$')$$), 'EVENT_FULL', 'a hely foglalt');
select is(pg_temp.err($$select public.cancel_my_registration('$$ || :'reg' || $$')$$), 'REGISTRATION_NOT_FOUND', 'más foglalását nem mondhatja le');
reset role;

-- A lemondja → B foglalhat
select pg_temp.act_as(:'a');
set local role authenticated;
select is((public.cancel_my_registration(:'reg')).status::text, 'cancelled', 'a saját foglalás lemondható');
select is((public.cancel_my_registration(:'reg')).status::text, 'cancelled', 'ismételt lemondás: nem hiba');
reset role;
select pg_temp.act_as(:'b');
set local role authenticated;
select is((public.book_event(:'ev')).status::text, 'confirmed', 'a felszabadult helyet más lefoglalhatja');
reset role;

-- Elkezdődött alkalom nem mondható le
insert into public.event_registrations (event_id, user_id, is_member_seat, tier_at_booking, price_huf, status)
values (:'past', :'a', true, 'tarsasagi', 0, 'confirmed') returning id as oldreg \gset
select pg_temp.act_as(:'a');
set local role authenticated;
select is(pg_temp.err($$select public.cancel_my_registration('$$ || :'oldreg' || $$')$$), 'EVENT_STARTED', 'elkezdődött alkalom nem mondható le');

-- Meghívó visszavonása
select public.invite_hike_guest(:'hike', 'Vendég Vera', 'vera@example.test') as inv \gset
reset role;
select pg_temp.act_as(:'b');
set local role authenticated;
select is(pg_temp.err($$select public.cancel_hike_invitation('$$ || :'inv' || $$')$$), 'INVITATION_INVALID', 'más meghívóját nem vonhatja vissza');
reset role;

-- A vendég elfogadja, majd A visszavonja → a vendég foglalása is törlődik
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select (public.accept_hike_invitation((select token from public.event_invitations where id = :'inv'))).id as greg \gset
reset role;
select is((select status::text from public.event_registrations where id = :'greg'), 'confirmed', 'a vendég foglalása megvan');
select pg_temp.act_as(:'a');
set local role authenticated;
select lives_ok($$select public.cancel_hike_invitation('$$ || :'inv' || $$')$$, 'a saját meghívó visszavonható');
reset role;
select is((select status from public.event_invitations where id = :'inv'), 'cancelled', 'a meghívó visszavonva');
select is((select status::text from public.event_registrations where id = :'greg'), 'cancelled', 'a vendég foglalása is törlődött');

-- Visszavonás után újra meghívható
select pg_temp.act_as(:'a');
set local role authenticated;
select isnt(public.invite_hike_guest(:'hike', 'Vendég Vera', 'vera@example.test'), null, 'a visszavont vendég újra meghívható');
reset role;

select * from finish();
rollback;
