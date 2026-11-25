-- =============================================================================
-- 19_meet_links.test.sql — Google Meet belépő linkek
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create function pg_temp.mk_user(
  p_email  text,
  p_tier   public.membership_tier     default 'tarsasagi',
  p_status public.subscription_status default 'active'
) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  update public.profiles set tier = p_tier, subscription_status = p_status, membership_started_at = now() where id = v;
  return v;
end $f$;
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;
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
create function pg_temp.mk_event(p_kind public.event_kind, p_start timestamptz, p_online boolean default true,
                                 p_tiers public.membership_tier[] default array['tarsasagi','belso_kor']::public.membership_tier[])
returns uuid language plpgsql as $f$
declare v uuid;
begin
  insert into public.events (kind, title, is_online, starts_at, ends_at, members_only, allowed_tiers, registration_opens_at, is_published)
  values (p_kind, 'Teszt alkalom', p_online, p_start, p_start + interval '1 hour', true, p_tiers, now() - interval '1 day', true)
  returning id into v;
  return v;
end $f$;

-- Szereplők
select pg_temp.mk_user('m1@example.com', 'tarsasagi') as id \gset tars_
select pg_temp.mk_user('m2@example.com', 'tarsasagi', 'trialing') as id \gset trial_
select pg_temp.mk_user('madm@example.com', 'none', 'canceled') as id \gset adm_
update public.profiles set role = 'admin' where id = :'adm_id';
select pg_temp.mk_event('online_meditacio', now() + interval '5 minutes') as id \gset med_
select pg_temp.mk_event('online_meditacio', now() + interval '2 days') as id \gset later_

select pg_temp.act_as(:'adm_id');
set local role authenticated;
select lives_ok(format($$ insert into public.event_live_links (event_id, join_url) values (%L, 'https://meet.google.com/abc-defg-hij') $$, :'med_id'),
  'admin megadhatja a Meet-linket');
select throws_ok(format($$ insert into public.event_live_links (event_id, join_url) values (%L, 'javascript:alert(1)') $$, :'later_id'),
  '23514', null, 'csak https link adható meg');
reset role;

select pg_temp.act_as(:'tars_id');
set local role authenticated;
select is((select count(*)::int from public.event_live_links), 0, 'a tag nem látja előre a linket');
select throws_ok(format($$ insert into public.event_live_links (event_id, join_url) values (%L, 'https://x.example') $$, :'later_id'),
  '42501', null, 'a tag nem adhat meg linket');
reset role;

select pg_temp.act_as(:'tars_id');
select is((select join_url from public.join_live_event(:'med_id')), 'https://meet.google.com/abc-defg-hij', 'az időablakban a tag megkapja a linket');
select is(pg_temp.err(format('select public.join_live_event(%L)', :'later_id')), 'TOO_EARLY', 'túl korán nem kapja meg');
select pg_temp.act_as(:'trial_id');
select is(pg_temp.err(format('select public.join_live_event(%L)', :'med_id')), 'NOT_PAYING', 'próbaidős nem kapja meg');
select pg_temp.act_as(:'adm_id');
select is((select join_url from public.join_live_event(:'med_id')), 'https://meet.google.com/abc-defg-hij', 'admin bármikor megkapja');

select * from finish();
rollback;
