-- =============================================================================
-- 16_registration_details.test.sql — telefonszám és biztonsági megjegyzés
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

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
insert into public.events (kind, title, starts_at, registration_opens_at, is_published, belso_kor_priority)
values ('online_meditacio', 'Meditáció', now() + interval '2 days', now() - interval '1 day', true, false) returning id as ev \gset

select pg_temp.act_as(:'a');
set local role authenticated;
select (public.book_event(:'ev')).id as reg \gset
select is(pg_temp.err($$select public.set_registration_details('$$ || :'reg' || $$', 'abc', 'Nincs', true)$$), 'INVALID_PHONE', 'érvénytelen telefonszám');
select is(pg_temp.err($$select public.set_registration_details('$$ || :'reg' || $$', '+36 30 123 4567', '  ', true)$$), 'NOTE_REQUIRED', 'a biztonsági kérdésre válaszolni kell');
select is(pg_temp.err($$select public.set_registration_details('$$ || :'reg' || $$', '+36 30 123 4567', 'Nincs', false)$$), 'CONSENT_REQUIRED', 'hozzájárulás nélkül nem tárolható');
select lives_ok($$select public.set_registration_details('$$ || :'reg' || $$', '+36 30 123 4567', 'Térdsérülés', true)$$, 'a saját jelentkezéshez rögzíthető');
select is((select phone from public.event_registrations where id = :'reg'), '+36 30 123 4567', 'a jelentkező látja a saját telefonszámát');
reset role;

select pg_temp.act_as(:'b');
set local role authenticated;
select is(pg_temp.err($$select public.set_registration_details('$$ || :'reg' || $$', '+36 30 999 9999', 'x', true)$$), 'REGISTRATION_NOT_FOUND', 'más jelentkezéséhez nem írhat');
select is((select count(*)::int from public.event_registrations where id = :'reg'), 0, 'más jelentkezését nem is látja');
reset role;

select isnt((select health_consent_at from public.event_registrations where id = :'reg'), null, 'a hozzájárulás időbélyege rögzült');

-- 30 nappal az esemény után törlődik
update public.events set starts_at = now() - interval '31 days' where id = :'ev';
select is(public.purge_registration_details(), 1, 'a régi esemény adatai törlődnek');
select is((select row(phone, safety_note)::text from public.event_registrations where id = :'reg'), '(,)', 'a telefonszám és a megjegyzés törölve, a jelentkezés megmaradt');

select * from finish();
rollback;
