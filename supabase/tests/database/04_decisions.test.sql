-- =============================================================================
-- 04_decisions.test.sql — 2026. novemberi döntések:
-- superadmin, Kedves Üzenet minimum 1 000 Ft, telefonszám max. 180 nap, Billingo.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

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

-- ---- Superadmin ---------------------------------------------------------------
select pg_temp.mk_user('akardosbalint.hu@gmail.com', 'belso_kor', 'active') as sa \gset
select pg_temp.mk_user('admin2@example.test', 'tarsasagi', 'active') as adm \gset
select pg_temp.mk_user('tag2@example.test', 'tarsasagi', 'active') as tag \gset
update public.profiles set role = 'admin' where id = :'adm';

select is((select role::text from public.profiles where id = :'sa'), 'superadmin',
          'a megadott e-mail-cím regisztrációkor superadmin lesz');
select is((select role::text from public.profiles where id = :'tag'), 'member',
          'mindenki más tagként indul');

set local role authenticated;
select pg_temp.act_as(:'adm');
select is(pg_temp.err($$update public.profiles set role = 'admin' where email = 'tag2@example.test'$$),
          '42501', 'admin nem oszthat szerepkört');
select is(pg_temp.err($$update public.profiles set m2_unlocked = true, m2_unlocked_at = now() where email = 'tag2@example.test'$$),
          'NO_ERROR', 'admin megnyithatja egy tag II. lépcsőjét');
select pg_temp.act_as(:'tag');
select is(pg_temp.err($$update public.profiles set role = 'superadmin' where id = auth.uid()$$),
          '42501', 'tag nem emelheti a saját szerepkörét');
select pg_temp.act_as(:'sa');
select is(pg_temp.err($$update public.profiles set role = 'admin' where email = 'tag2@example.test'$$),
          'NO_ERROR', 'superadmin adminná tehet egy tagot');
select ok(public.is_admin(), 'a superadmin admin jogokkal is rendelkezik');
reset role;
select is((select role::text from public.profiles where id = :'tag'), 'admin', 'a szerepkör valóban módosult');

-- ---- Kedves Üzenet minimum 1 000 Ft -----------------------------------------
select is(pg_temp.err($$insert into public.kind_messages (sender_id, recipient_name, recipient_phone, message, is_free, amount_huf)
                        values ('$$ || :'tag' || $$', 'Mama', '+36301234567', 'Köszönöm', false, 999)$$),
          'AMOUNT_TOO_LOW', 'kereten felüli üzenet 1 000 Ft alatt nem rögzíthető');
select is(pg_temp.err($$insert into public.kind_messages (sender_id, recipient_name, recipient_phone, message, is_free, amount_huf)
                        values ('$$ || :'tag' || $$', 'Mama', '+36301234567', 'Köszönöm', false, 1000)$$),
          'NO_ERROR', '1 000 Ft-tól rögzíthető');

-- ---- Telefonszám max. 180 nap ---------------------------------------------------
insert into public.kind_messages (id, sender_id, recipient_name, recipient_phone, message, is_free, created_at) values
  ('00000000-0000-0000-0000-0000000aa181', :'tag', 'Régi', '+36301111111', 'x', true, now() - interval '181 days'),
  ('00000000-0000-0000-0000-0000000aa179', :'tag', 'Friss', '+36302222222', 'y', true, now() - interval '179 days');
select is(public.purge_kind_message_phones(), 1, 'egy 180 napnál régebbi szám törlődött');
select is((select row(recipient_phone is null, phone_purged_at is not null)::text
             from public.kind_messages where id = '00000000-0000-0000-0000-0000000aa181'),
          row(true, true)::text, 'a régi szám törölve, időbélyeggel');
select is((select recipient_phone from public.kind_messages where id = '00000000-0000-0000-0000-0000000aa179'),
          '+36302222222', 'a 180 napon belüli szám megmarad');
select is((select count(*)::int from cron.job where jobname = 'purge-kind-message-phones'), 1,
          'a napi törlés ütemezve van (pg_cron)');

set local role authenticated;
select pg_temp.act_as(:'tag');
select is(pg_temp.err('select public.purge_kind_message_phones()'), '42501', 'tag nem hívhatja a törlést');
reset role;

-- ---- Számlázó szolgáltató -------------------------------------------------------
select is((select invoice_provider from public.app_settings), 'manual', 'jelenleg kézi számlázás (Billingo később)');

select * from finish();
rollback;
