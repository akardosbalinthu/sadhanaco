-- =============================================================================
-- 24_consultation_request.test.sql — rövid konzultációkérés (3. változat)
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

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

select pg_temp.as_service();
select (public.submit_consultation_request('Teszt Cili', 'Cili@Example.com', '+36 30 123 4567', 'Hajnalban felébredek.', true)).token as t \gset c_

select ok((select qualified from public.applications where token = :'c_t'), 'a rövid kérés mindig foglalhat');
select is((select questionnaire_version from public.applications where token = :'c_t'), 3::smallint, 'a 3. változat rögzítve');
select is((select email from public.applications where token = :'c_t'), 'cili@example.com', 'az e-mail kisbetűsítve');
select ok((select health_consent_at is not null and privacy_consent_at is not null from public.applications where token = :'c_t'), 'a hozzájárulás időbélyeggel');
select is(pg_temp.err($$ select public.submit_consultation_request('X Y', 'x@example.com', '+36 30 123 4567', 'Valami.', false) $$), 'CONSENT_REQUIRED', 'hozzájárulás nélkül nem megy');
select is(pg_temp.err($$ select public.submit_consultation_request('X Y', 'x@example.com', '', 'Valami.', true) $$), 'PHONE_REQUIRED', 'a telefonszám kötelező');
select is(pg_temp.err($$ select public.submit_consultation_request('X Y', 'x@example.com', '+36 30 123 4567', ' ', true) $$), 'PROBLEM_REQUIRED', 'a kérdésre válasz kell');
select ok(public.application_booking_info(:'c_t') ->> 'qualified' = 'true', 'a foglalóoldal nyitva');

select * from finish();
rollback;
