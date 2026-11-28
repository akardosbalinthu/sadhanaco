-- =============================================================================
-- 25_questionnaire_v4.test.sql — 14 kérdés, telefon és változtatási cél kötelező
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
create function pg_temp.answers(p_q14 int) returns jsonb language sql as $f$
  select jsonb_object_agg('q' || i, case when i = 14 then p_q14 else 6 end) from generate_series(1, 14) i;
$f$;

select pg_temp.as_service();
select (public.submit_application_v4('Teszt Dóra', 'dora@example.com', '+36 30 123 4567', pg_temp.answers(9), 'Este nem tudok kikapcsolni.', true, true)).token as t \gset a_
select (public.submit_application_v4('Teszt Ede', 'ede@example.com', '+36 30 765 4321', pg_temp.answers(5), 'Rosszul alszom.', true, true)).token as t \gset b_

select ok((select qualified from public.applications where token = :'a_t'), 'a 9-es kezdési pontszám minősít');
select ok(not (select qualified from public.applications where token = :'b_t'), 'az 5-ös nem minősít');
select is((select questionnaire_version from public.applications where token = :'a_t'), 4::smallint, 'a 4. változat rögzítve');
select is((select start_score from public.applications where token = :'a_t'), 9::smallint, 'a 14. válasz a kezdési pontszám');
select is(pg_temp.err($$ select public.submit_application_v4('X Y', 'x@example.com', '+36 30 123 4567', pg_temp.answers(9) - 'q3', 'Valami.', true, true) $$), 'INVALID_ANSWERS', 'minden kérdésre kell válasz');
select is(pg_temp.err($$ select public.submit_application_v4('X Y', 'x@example.com', '+36 30 123 4567', pg_temp.answers(0), 'Valami.', true, true) $$), 'INVALID_ANSWERS', 'csak 1–10 fogadható el');
select is(pg_temp.err($$ select public.submit_application_v4('X Y', 'x@example.com', '', pg_temp.answers(9), 'Valami.', true, true) $$), 'PHONE_REQUIRED', 'a telefonszám kötelező');
select is(pg_temp.err($$ select public.submit_application_v4('X Y', 'x@example.com', '+36 30 123 4567', pg_temp.answers(9), '', true, true) $$), 'PROBLEM_REQUIRED', 'a változtatási cél kötelező');
select is(pg_temp.err($$ select public.submit_application_v4('X Y', 'x@example.com', '+36 30 123 4567', pg_temp.answers(9), 'Valami.', false, true) $$), 'HEALTH_CONSENT_REQUIRED', 'hozzájárulás nélkül nem megy');

select * from finish();
rollback;
