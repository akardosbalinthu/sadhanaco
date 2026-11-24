-- =============================================================================
-- 07_hikes_polls.test.sql — havi közös túra: úti cél szavazás
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

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

select pg_temp.mk_user('a@example.test', 'tarsasagi', 'active')   as a \gset
select pg_temp.mk_user('b@example.test', 'belso_kor', 'active')   as b \gset
select pg_temp.mk_user('p@example.test', 'tarsasagi', 'trialing') as p \gset
select pg_temp.mk_user('x@example.test', 'none', 'canceled')      as x \gset
select pg_temp.mk_user('adm@example.test', 'belso_kor', 'active') as adm \gset
update public.profiles set role = 'admin' where id = :'adm';

insert into public.destination_polls (id, month, title, closes_at) values
  ('00000000-0000-0000-0000-00000000d001', '2026-12-01', 'Decemberi túra', now() + interval '5 days'),
  ('00000000-0000-0000-0000-00000000d002', '2027-01-01', 'Januári túra', now() + interval '5 days');
insert into public.destination_options (id, poll_id, name) values
  ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000d001', 'Pilis'),
  ('00000000-0000-0000-0000-0000000d0002', '00000000-0000-0000-0000-00000000d001', 'Bükk'),
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-00000000d002', 'Mátra');
-- d001: 5 úti cél (a szavazás így indulhat); d002 egyelőre csak 1
insert into public.destination_options (poll_id, name)
select '00000000-0000-0000-0000-00000000d001', n from unnest(array['Zemplén', 'Őrség', 'Börzsöny']) n;

set local role authenticated;
select pg_temp.act_as(:'a');
select is((select count(*)::int from public.destination_options where poll_id = '00000000-0000-0000-0000-00000000d001'), 5,
          'tag látja a lehetőségeket');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-0000000d0003')$$),
          'POLL_NOT_READY', '5 úti cél alatt még nem lehet szavazni');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          'NO_ERROR', 'tag szavaz');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0002')$$),
          'NO_ERROR', 'a szavazat a lezárásig módosítható');
select is((select option_id::text from public.destination_votes), '00000000-0000-0000-0000-0000000d0002',
          'egy tag egy szavazat: a módosított érvényes');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0003')$$),
          'INVALID_OPTION', 'más szavazás lehetőségére nem lehet szavazni');
select is(pg_temp.err($$select * from public.destination_poll_results('00000000-0000-0000-0000-00000000d001')$$),
          'RESULTS_HIDDEN', 'a lezárásig nincs állás');
select is(pg_temp.err($$insert into public.destination_votes (poll_id, option_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          '42501', 'közvetlen INSERT tiltott (csak RPC)');

select pg_temp.act_as(:'b');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          'NO_ERROR', 'másik tag szavaz');
select is((select count(*)::int from public.destination_votes), 1, 'más szavazatát nem látja');

select pg_temp.act_as(:'p');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          'NO_ERROR', 'próbaidős tag is szavazhat');

select pg_temp.act_as(:'x');
select is((select count(*)::int from public.destination_polls), 0, 'volt tag nem látja a szavazást');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          'NOT_MEMBER', 'volt tag nem szavazhat');

select pg_temp.act_as(:'a');
select is(pg_temp.err($$select public.admin_close_destination_poll('00000000-0000-0000-0000-00000000d001')$$),
          'FORBIDDEN', 'tag nem zárhatja le');

-- Admin lezárja: Pilis 2 (b, p), Bükk 1 (a) -> Pilis
select pg_temp.act_as(:'adm');
select is((select winning_option_id::text from public.admin_close_destination_poll('00000000-0000-0000-0000-00000000d001')),
          '00000000-0000-0000-0000-0000000d0001', 'a legtöbb szavazatot kapott úti cél nyer');

select pg_temp.act_as(:'a');
select is((select string_agg(name || ':' || votes || ':' || is_winner, ',' order by votes desc)
             from public.destination_poll_results('00000000-0000-0000-0000-00000000d001')),
          'Pilis:2:true,Bükk:1:false,Börzsöny:0:false,Őrség:0:false,Zemplén:0:false',
          'lezárás után az eredmény mindenkinek látható');
select is(pg_temp.err($$select public.cast_destination_vote('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-0000000d0001')$$),
          'POLL_CLOSED', 'lezárt szavazásra nem lehet szavazni');

-- Holtverseny: admin dönt
reset role;
insert into public.destination_options (id, poll_id, name)
values ('00000000-0000-0000-0000-0000000d0004', '00000000-0000-0000-0000-00000000d002', 'Őrség');
insert into public.destination_options (poll_id, name)
select '00000000-0000-0000-0000-00000000d002', n from unnest(array['Velencei-hegység', 'Mecsek', 'Bakony']) n;
set local role authenticated;
select pg_temp.act_as(:'a');
select public.cast_destination_vote('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-0000000d0003');
select pg_temp.act_as(:'b');
select public.cast_destination_vote('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-0000000d0004');
select pg_temp.act_as(:'adm');
select is(pg_temp.err($$select public.admin_close_destination_poll('00000000-0000-0000-0000-00000000d002')$$),
          'TIE', 'holtversenynél az admin dönt');
reset role;

-- ---- Szabályok: hónaponként egy szavazás, max. 10 úti cél ------------------------
select is(pg_temp.err($$insert into public.destination_polls (month, title, closes_at) values ('2026-12-01', 'Dupla', now() + interval '1 day')$$),
          '23505', 'egy hónapra csak egy szavazás lehet');
insert into public.destination_options (poll_id, name)
select '00000000-0000-0000-0000-00000000d002', 'Cél ' || i from generate_series(1, 5) i;   -- 5 + 5 = 10
select is(pg_temp.err($$insert into public.destination_options (poll_id, name) values ('00000000-0000-0000-0000-00000000d002', 'Tizenegyedik')$$),
          'TOO_MANY_OPTIONS', 'legfeljebb 10 úti cél');

-- ---- Túra: ingyenes, vendég csak meghívóval -----------------------------------------
select is(pg_temp.err($$insert into public.events (kind, title, starts_at, registration_opens_at, price_tarsasagi_huf, is_published)
                        values ('tura', 'Fizetős túra', now() + interval '10 days', now() - interval '1 day', 1000, true)$$),
          '23514', 'a túrára nem lehet díjat beállítani');
insert into public.events (id, kind, title, starts_at, capacity, registration_opens_at, belso_kor_priority, is_published)
values ('00000000-0000-0000-0000-0000000ee0a1', 'tura', 'Pilisi túra', now() + interval '10 days', 3, now() - interval '1 day', false, true);
set local role authenticated;
select pg_temp.act_as(:'a');
select is((select row(status, price_huf)::text from public.book_event('00000000-0000-0000-0000-0000000ee0a1')),
          row('confirmed', 0)::text, 'tag ingyen jelentkezik a túrára');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Vendég Vera', 'vera@example.test')$$),
          'NO_ERROR', 'tag meghívhat egy vendéget');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Vendég Vera', 'VERA@example.test')$$),
          'ALREADY_INVITED', 'ugyanazt a vendéget nem lehet kétszer meghívni');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Béla', 'b@example.test')$$),
          'ALREADY_MEMBER', 'tagot nem kell meghívni');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Vendég Vince', 'vince@example.test')$$),
          'NO_ERROR', 'második vendég');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Vendég Viki', 'viki@example.test')$$),
          'INVITE_LIMIT', 'túránként legfeljebb 2 vendég tagonként');
select is(pg_temp.err($$select token from public.event_invitations$$), '42501', 'a meghívó tokenjét a tag sem látja');
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee0a1', 'Idegen', 'idegen@example.test')$$),
          '42501', 'meghívó nélkül nyilvánosan nem foglalható');
select pg_temp.act_as(:'x');
select is(pg_temp.err($$select public.invite_hike_guest('00000000-0000-0000-0000-0000000ee0a1', 'Valaki', 'valaki@example.test')$$),
          'NOT_MEMBER', 'volt tag nem hívhat meg senkit');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(pg_temp.err($$select public.reserve_guest_seat('00000000-0000-0000-0000-0000000ee0a1', 'Idegen', 'idegen@example.test')$$),
          'NOT_PUBLIC_EVENT', 'a túra a szerveren keresztül sem foglalható meghívó nélkül');
select token as vera_token from public.event_invitations where guest_email = 'vera@example.test' \gset
select is((select row(status, price_huf, is_member_seat)::text from public.accept_hike_invitation(:'vera_token')),
          row('confirmed', 0, false)::text, 'a vendég ingyen, megerősített hellyel fogadja el');
select is((select status::text from public.accept_hike_invitation(:'vera_token')), 'confirmed', 'az elfogadás idempotens');
select token as vince_token from public.event_invitations where guest_email = 'vince@example.test' \gset
select is((select status::text from public.accept_hike_invitation(:'vince_token')), 'confirmed', '3. hely (kapacitás 3)');
reset role;

select * from finish();
rollback;
