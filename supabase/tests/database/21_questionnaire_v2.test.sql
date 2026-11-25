-- =============================================================================
-- 21_questionnaire_v2.test.sql — 15 kérdés, 1–10-es skála, minősítés 8–10
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

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
create function pg_temp.answers(p_q15 int) returns jsonb language sql as $f$
  select jsonb_object_agg('q' || i, case when i = 15 then p_q15 else 5 end) from generate_series(1, 15) i;
$f$;

select pg_temp.as_service();
select (public.submit_application_v2('Teszt Anna', 'anna@example.com', null, pg_temp.answers(8), null, true, true)).token as t \gset a_
select (public.submit_application_v2('Teszt Béla', 'bela@example.com', null, pg_temp.answers(7), 'Rosszul alszom.', true, true)).token as t \gset b_

select ok((select qualified from public.applications where token = :'a_t'), 'a 8-as kezdési pontszám minősít');
select ok(not (select qualified from public.applications where token = :'b_t'), 'a 7-es nem minősít');
select is((select questionnaire_version from public.applications where token = :'a_t'), 2::smallint, 'a változat rögzítve');
select is((select start_score from public.applications where token = :'b_t'), 7::smallint, 'a 15. válasz külön oszlopban');
select is((select problem from public.applications where token = :'a_t'), null, 'a „Mi hozott ide?” nem kötelező');
select is(pg_temp.err($$ select public.submit_application_v2('X Y', 'x@example.com', null, pg_temp.answers(11), null, true, true) $$), 'INVALID_ANSWERS', 'csak 1–10 fogadható el');
select is(pg_temp.err($$ select public.submit_application_v2('X Y', 'x@example.com', null, pg_temp.answers(9) - 'q3', null, true, true) $$), 'INVALID_ANSWERS', 'minden kérdésre kell válasz');
select is(pg_temp.err($$ select public.submit_application_v2('X Y', 'x@example.com', null, pg_temp.answers(9), null, false, true) $$), 'HEALTH_CONSENT_REQUIRED', 'hozzájárulás nélkül nem megy');
select ok(public.application_booking_info(:'a_t') ->> 'qualified' = 'true', 'a foglalóoldal a minősítettnek nyitva');

select * from finish();
rollback;
