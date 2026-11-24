-- =============================================================================
-- 05_guests.test.sql — külsős (bejelentkezés nélküli) Nyílt Est-foglalás,
-- fizetés-megerősítés, nyilvános eseménylista, kézi számlaszám-rögzítés.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- ---- Teszt-segédek (pg_temp: csak ebben a munkamenetben léteznek) ----------
create function pg_temp.mk_user(
  p_email  text,
  p_tier   public.membership_tier     default 'tarsasagi',
  p_status public.subscription_status default 'active'
) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          p_email, '{}'::jsonb, now(), now());
  update public.profiles
     set tier = p_tier, subscription_status = p_status, membership_started_at = now()
   where id = v;
  return v;
end $f$;

-- A következő utasítások ennek a felhasználónak a nevében futnak (JWT claim).
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;

-- Lefuttat egy utasítást, és visszaadja a hiba HINT kódját (vagy SQLSTATE-jét).
create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
declare h text;
begin
  execute p_sql;
  return 'NO_ERROR';
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  -- Saját gépi kódjaink (pl. TRIAL_NOT_ALLOWED) a HINT-ben; egyébként SQLSTATE.
  return case when h ~ '^[A-Z_]+$' then h else sqlstate end;
end $f$;
grant execute on all functions in schema pg_temp to authenticated;
-- ---------------------------------------------------------------------------
create function pg_temp.as_service() returns void language sql as $f$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
$f$;

-- 3 fős Nyílt Est (tagi kvóta: 1), egy zárt Gyakorlónap
insert into public.events (id, kind, title, starts_at, capacity, members_only, registration_opens_at,
                           price_external_huf, price_tarsasagi_huf, price_belso_kor_huf, is_published)
values ('00000000-0000-0000-0000-0000000ee001', 'nyilt_est', 'Nyílt Est', now() + interval '10 days',
        3, false, now() - interval '3 days', 4940, 3200, 0, true),
       ('00000000-0000-0000-0000-0000000ee002', 'gyakorlonap', 'Gyakorlónap', now() + interval '20 days',
        15, true, now() - interval '3 days', null, 6460, 0, true);
select pg_temp.mk_user('bk@example.test', 'belso_kor', 'active') as bk \gset
select pg_temp.mk_user('adm@example.test', 'tarsasagi', 'active') as adm \gset
update public.profiles set role = 'admin' where id = :'adm';

-- ---- Nyilvános lista -----------------------------------------------------------
set local role anon;
select is((select count(*)::int from public.public_open_evenings()), 1, 'anon: csak a nyilvános Nyílt Est látszik');
select is((select seats_left from public.public_open_evenings()), 3, 'anon: 3 szabad hely');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Vendég', 'v@example.test')$$),
          '42501', 'anon nem foglalhat közvetlenül (csak a szerver)');
reset role;

set local role authenticated;
select pg_temp.act_as(:'bk');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Vendég', 'v@example.test')$$),
          '42501', 'bejelentkezett felhasználó sem hívhatja');
select is((select status::text from public.book_event('00000000-0000-0000-0000-0000000ee001')), 'confirmed',
          'Belső Kör tag elfoglalja az egyetlen tagi helyet');
reset role;

-- ---- Szerver (service role) -------------------------------------------------------
set local role service_role;
select pg_temp.as_service();
select is((select row(status, price_huf, is_member_seat, hold_expires_at is not null)::text
             from public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Kiss Anna', 'Anna@Example.test')),
          row('pending_payment', 4940, false, true)::text,
          'külsős: 4 940 Ft, fizetésre váró, tartott hely');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Kiss Anna', 'anna@example.test')$$),
          'ALREADY_REGISTERED', 'ugyanazzal az e-mail-címmel (kisbetűsítve) nem lehet kétszer');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Nagy Béla', 'bela@example.test')$$),
          'NO_ERROR', 'külsős a tagi kvótán túl is foglalhat (3. hely)');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', 'Tóth Cili', 'cili@example.test')$$),
          'EVENT_FULL', 'teljes kapacitás után nincs hely');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee002', 'Vendég', 'x@example.test')$$),
          'NOT_PUBLIC_EVENT', 'zárt eseményre külsős nem jelentkezhet');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee001', '', 'nem-email')$$),
          'INVALID_GUEST', 'név és érvényes e-mail kötelező');

select id as reg from public.event_registrations where guest_email = 'anna@example.test' \gset
select is((select status::text from public.confirm_registration_payment(:'reg')), 'confirmed',
          'fizetés után megerősítve');
select is((select status::text from public.confirm_registration_payment(:'reg')), 'confirmed',
          'a megerősítés idempotens (webhook-ismétlés)');
reset role;

set local role anon;
select is((select seats_left from public.public_open_evenings()), 0, 'anon: a lista szerint betelt');
reset role;

-- ---- Kézi számlázás: az admin utólag rögzíti a sorszámot -------------------------
insert into public.invoices (id, description, amount_huf, country, region, billing_entity)
values ('00000000-0000-0000-0000-0000000ff001', 'Nyílt Est — külsős', 4940, 'HU', 'HU', '{}');
set local role authenticated;
select pg_temp.act_as(:'adm');
select is(pg_temp.err($$update public.invoices set provider_invoice_number = 'KB-2026-001'
                        where id = '00000000-0000-0000-0000-0000000ff001'$$),
          'NO_ERROR', 'admin rögzítheti a kézzel kiállított számla sorszámát');
select is(pg_temp.err($$update public.invoices set description = 'más' where id = '00000000-0000-0000-0000-0000000ff001'$$),
          '42501', 'a számla többi mezője nem írható');
select pg_temp.act_as(:'bk');
select is(pg_temp.err($$update public.invoices set provider_invoice_number = 'X'
                        where id = '00000000-0000-0000-0000-0000000ff001'$$),
          'NO_ERROR', 'tag frissítési kísérlete nem dob hibát, de…');
reset role;
select is((select provider_invoice_number from public.invoices where id = '00000000-0000-0000-0000-0000000ff001'),
          'KB-2026-001', '…a tag nem írta át a sorszámot (RLS)');

select * from finish();
rollback;
