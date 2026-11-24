-- =============================================================================
-- 01_rls.test.sql — RLS: felhasználók nem látják / nem írják egymás adatait,
-- jogosultsági mezők nem eszkalálhatók, volt tag állapota helyes.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

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

-- ---- Szerkezet: minden public tábla ENABLE + FORCE RLS, és van policyja -----
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not (c.relrowsecurity and c.relforcerowsecurity)),
  0, 'minden public táblán ENABLE + FORCE RLS');
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)),
  0, 'nincs policy nélküli tábla');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('run_scheduled_tasks', '_revenue_status_internal', 'purge_kind_message_phones',
                        'membership_trial_started', 'membership_payment_succeeded', 'membership_payment_failed',
                        'membership_ended', 'membership_stage_purchased', 'reserve_guest_seat',
                        'confirm_registration_payment', 'handle_new_user',
                        'accept_hike_invitation', 'guard_destination_option_limit',
                        'submit_kind_message', 'confirm_kind_message', '_award_xp', 'award_external_xp',
                        'xp_on_lesson_completion', 'xp_on_journal_entry', 'xp_on_post', 'xp_on_comment',
                        'xp_on_reaction', 'xp_on_attendance', 'xp_on_kind_message', 'xp_on_progression')
      and (has_function_privilege('authenticated', p.oid, 'execute')
           or has_function_privilege('anon', p.oid, 'execute'))),
  0, 'belső / szerveroldali függvényekhez a kliens szerepköröknek nincs joga');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')),
  0, 'minden SECURITY DEFINER függvényen explicit search_path');

-- ---- Adatok -----------------------------------------------------------------
select pg_temp.mk_user('anna@example.test', 'tarsasagi', 'active') as anna \gset
select pg_temp.mk_user('bela@example.test', 'belso_kor', 'active') as bela \gset
select pg_temp.mk_user('volt@example.test', 'tarsasagi', 'active') as volt \gset
select pg_temp.mk_user('admin@example.test', 'belso_kor', 'active') as admin \gset
update public.profiles set role = 'admin' where id = :'admin';
update public.profiles set current_stage_label = 'I. Modul · 4. hét' where id in (:'anna', :'volt');

insert into public.invoices (user_id, description, amount_huf, country, region, billing_entity)
values (:'anna', 'Társasági Tagság', 9940, 'HU', 'HU', '{}'),
       (:'bela', 'Belső Kör', 27940, 'HU', 'HU', '{}');
insert into public.kind_messages (sender_id, recipient_name, recipient_phone, message, is_free)
values (:'bela', 'Mama', '+36301234567', 'Köszönöm.', true);
insert into public.purchase_consents (user_id, email, terms_version) values (:'bela', 'bela@example.test', '2026-11');
insert into public.trial_usage (email_normalized, card_fingerprint) values ('bela@example.test', 'fp_1');
insert into public.stripe_events (id, type, payload) values ('evt_1', 'test', '{}');

insert into public.posts (id, author_id, body) values
  ('00000000-0000-0000-0000-0000000000a1', :'volt', 'Egy volt tag tapasztalata.');
-- "volt" tag lemond és lejár a tagsága
update public.profiles
   set tier = 'none', subscription_status = 'canceled', membership_ended_at = now()
 where id = :'volt';

insert into public.lessons (id, module_id, week_number, kind, title, is_published)
select '00000000-0000-0000-0000-0000000000b1'::uuid, id, 1, 'audio'::public.lesson_kind, 'Légzésmechanika', true from public.modules where stage = 1
union all
select '00000000-0000-0000-0000-0000000000b2'::uuid, id, 2, 'audio'::public.lesson_kind, '2. hét', true from public.modules where stage = 1
union all
select '00000000-0000-0000-0000-0000000000b3'::uuid, id, 1, 'video'::public.lesson_kind, 'II. Modul bevezető', true from public.modules where stage = 2;

-- ---- anon ---------------------------------------------------------------------
set local role anon;
select is(pg_temp.err('select * from public.profiles'), '42501', 'anon: profiles nem olvasható');
select is(pg_temp.err('select * from public.posts'), '42501', 'anon: posts nem olvasható');
select ok((select count(*) from public.price_catalog) > 0, 'anon: az árlista nyilvános');
reset role;

-- ---- Anna (Társasági, aktív) -------------------------------------------------
set local role authenticated;
select pg_temp.act_as(:'anna');

select is((select count(*)::int from public.profiles), 1, 'Anna csak a saját profilját látja');
select is((select count(*)::int from public.profiles where id = :'bela'), 0, 'Anna nem látja Béla profilját');
select is((select count(*)::int from public.invoices), 1, 'Anna csak a saját számláját látja');
select is((select count(*)::int from public.kind_messages), 0, 'Anna nem látja Béla Kedves Üzenetét');
select is((select count(*)::int from public.purchase_consents), 0, 'Anna nem látja Béla hozzájárulását');
select is((select count(*)::int from public.trial_usage), 0, 'trial_usage: tag nem olvashatja');
select is((select count(*)::int from public.stripe_events), 0, 'stripe_events: tag nem olvashatja');

with u as (update public.profiles set display_name = 'Hack' where id = :'bela' returning 1)
select is((select count(*)::int from u), 0, 'Anna nem módosíthatja Béla profilját');
select is(pg_temp.err($$update public.profiles set tier = 'belso_kor' where id = '$$ || :'anna' || $$'$$),
          '42501', 'Anna nem emelheti a saját tierjét');
select is(pg_temp.err($$update public.profiles set free_messages_remaining = 99 where id = '$$ || :'anna' || $$'$$),
          '42501', 'Anna nem írhatja át a saját keretét');
select is(pg_temp.err($$update public.profiles set m2_unlocked = true where id = '$$ || :'anna' || $$'$$),
          '42501', 'Anna nem nyithatja meg magának a II. lépcsőt');
select is(pg_temp.err($$update public.profiles set display_name = 'Anna K.' where id = '$$ || :'anna' || $$'$$),
          'NO_ERROR', 'Anna módosíthatja a megjelenített nevét');

select is(pg_temp.err($$insert into public.invoices (user_id, description, amount_huf, country, region, billing_entity)
                        values (auth.uid(), 'x', 1, 'HU', 'HU', '{}')$$),
          '42501', 'tag nem hozhat létre számlát');
select is(pg_temp.err($$insert into public.event_registrations (event_id, user_id, is_member_seat, status)
                        values (gen_random_uuid(), auth.uid(), true, 'confirmed')$$),
          '42501', 'tag nem foglalhat közvetlen INSERT-tel (csak book_event RPC)');
select is(pg_temp.err($$insert into public.posts (author_id, body) values ('$$ || :'bela' || $$', 'Béla nevében')$$),
          '42501', 'Anna nem posztolhat Béla nevében');

with u as (update public.app_settings set registration_open = false returning 1)
select is((select count(*)::int from u), 0, 'tag nem zárhatja le a jelentkezést');
select is(pg_temp.err('select public.kata_revenue_status()'), 'FORBIDDEN', 'tag nem kérheti le a KATA-összesítőt');

-- Tananyag: 1. hét látszik, 2. hét még nem (ma lépett be), II. Modul zárva
select is((select count(*)::int from public.lessons where id = '00000000-0000-0000-0000-0000000000b1'), 1,
          'az I. Modul 1. hete elérhető');
select is((select count(*)::int from public.lessons where id = '00000000-0000-0000-0000-0000000000b2'), 0,
          'a 2. hét még nem nyílt meg');
select is((select count(*)::int from public.lessons where id = '00000000-0000-0000-0000-0000000000b3'), 0,
          'a II. Modul admin jóváhagyás nélkül zárva');
select is((select count(*)::int from public.modules), 4, 'a teljes ív (4 lépcső) látszik a menühöz');

-- Volt tag posztja megmarad, a név látszik, fázis nem
select is((select count(*)::int from public.posts where id = '00000000-0000-0000-0000-0000000000a1'), 1,
          'volt tag posztja megmarad');
select is((select row(display_name, is_current_member, current_stage_label)::text
             from public.community_authors(array[:'volt'::uuid])),
          row('volt', false, null::text)::text,
          'volt tag: név megmarad, nem aktív, nincs gyakorlási fázis');
reset role;

-- ---- Volt tag: semmihez nem fér hozzá -----------------------------------------
set local role authenticated;
select pg_temp.act_as(:'volt');
select is((select count(*)::int from public.posts), 0, 'volt tag nem olvassa a közösségi teret');
select is((select count(*)::int from public.lessons), 0, 'volt tag nem éri el a tananyagot');
reset role;

select * from finish();
rollback;
