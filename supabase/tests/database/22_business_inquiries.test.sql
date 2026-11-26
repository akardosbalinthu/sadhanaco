-- =============================================================================
-- 22_business_inquiries.test.sql — céges ajánlatkérés
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
declare h text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  return h;
end $f$;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}', true);
select is(pg_temp.err($$ select public.submit_business_inquiry('Példa Kft.', 'Budapest', 40, 20, 'Teszt Elek', 'HR-vezető', 'hr@example.com', null, 'Csapatnap.', array['treningnap'], array['nalunk'], '1_3_honap', null, true) $$), 'FORBIDDEN', 'csak szerveroldalról hívható');

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(pg_temp.err($$ select public.submit_business_inquiry('Példa Kft.', 'Budapest', 40, 20, 'Teszt Elek', 'HR-vezető', 'hr@example.com', null, 'Csapatnap.', array['treningnap'], array['nalunk'], '1_3_honap', null, false) $$), 'PRIVACY_CONSENT_REQUIRED', 'hozzájárulás nélkül nem megy');
select lives_ok($$ select public.submit_business_inquiry('Példa Kft.', 'Budapest', 40, 20, 'Teszt Elek', 'HR-vezető', 'HR@example.com', null, 'Csapatnap a stresszkezelésről.', array['treningnap','eloadas'], array['nalunk','online'], '1_3_honap', '500e_1_5m', true) $$, 'az ajánlatkérés beküldhető');
select throws_ok($$ select public.submit_business_inquiry('X Kft.', 'Pécs', 5, null, 'Y Z', null, 'y@example.com', null, 'Valami.', array['ismeretlen'], array['online'], 'kesobb', null, true) $$, '23514', null, 'ismeretlen forma nem fogadható el');
select is((select email from public.business_inquiries limit 1), 'hr@example.com', 'az e-mail kisbetűsítve');
update public.business_inquiries set created_at = now() - interval '400 days';
select is(public.purge_old_business_inquiries(), 1, 'egy év után törlődik');

select * from finish();
rollback;
