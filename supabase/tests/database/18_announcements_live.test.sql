-- =============================================================================
-- 18_announcements_live.test.sql — értesítő levelek és élő alkalmak
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

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
select pg_temp.mk_user('t1@example.com', 'tarsasagi') as id \gset tars_
select pg_temp.mk_user('b1@example.com', 'belso_kor') as id \gset belso_
select pg_temp.mk_user('trial@example.com', 'tarsasagi', 'trialing') as id \gset trial_
select pg_temp.mk_user('off@example.com', 'tarsasagi') as id \gset off_
select pg_temp.mk_user('none@example.com', 'none', 'canceled') as id \gset none_
select pg_temp.mk_user('adm@example.com', 'none', 'canceled') as id \gset adm_
update public.profiles set role = 'admin' where id = :'adm_id';

-- ---- Értesítés ----
select pg_temp.act_as(:'off_id');
set local role authenticated;
update public.profiles set notify_admin_updates = false where id = auth.uid();
select throws_ok($$ update public.profiles set email_token = gen_random_uuid() where id = auth.uid() $$, '42501', null,
  'a leiratkozó tokent nem módosíthatja');
reset role;
select is((select notify_admin_updates from public.profiles where id = :'off_id'), false, 'a tag kikapcsolhatja az értesítést');

select pg_temp.as_service();
select ok((select count(*) from public.announcement_recipients() r where r.email = 't1@example.com') = 1, 'aktív tag kapja');
select ok((select count(*) from public.announcement_recipients() r where r.email = 'trial@example.com') = 1, 'próbaidős tag is kapja');
select ok((select count(*) from public.announcement_recipients() r where r.email = 'off@example.com') = 0, 'leiratkozott nem kapja');
select ok((select count(*) from public.announcement_recipients() r where r.email = 'none@example.com') = 0, 'volt tag nem kapja');

select is(public.unsubscribe_by_token((select email_token from public.profiles where id = :'tars_id')), true, 'leiratkozás tokennel');
select is((select notify_admin_updates from public.profiles where id = :'tars_id'), false, 'a leiratkozás rögzül');
select is(public.unsubscribe_by_token(gen_random_uuid()), false, 'ismeretlen token: nincs hatás');

select pg_temp.mk_event('online_meditacio', now() + interval '2 days') as id \gset ev_
update public.events set announced_at = null where id = :'ev_id';
select is(public.claim_announcement('event', :'ev_id'), true, 'az első lefoglalás sikeres');
select is(public.claim_announcement('event', :'ev_id'), false, 'a második nem — csak egyszer megy ki');
update public.events set is_published = false, announced_at = null where id = :'ev_id';
select is(public.claim_announcement('event', :'ev_id'), false, 'nem közzétett eseményről nem megy levél');

select pg_temp.act_as(:'belso_id');
select is(pg_temp.err($$ select public.announcement_recipients() $$), 'FORBIDDEN', 'kliens nem kérheti le a címzetteket');

-- ---- Élő alkalom ----
select pg_temp.as_service();
select pg_temp.mk_event('online_meditacio', now() + interval '5 minutes') as id \gset med_
select pg_temp.mk_event('online_meditacio', now() + interval '2 hours') as id \gset early_
select pg_temp.mk_event('qa_elo', now() - interval '10 minutes') as id \gset qa_
select pg_temp.mk_event('gyakorlonap', now(), false) as id \gset offline_

select pg_temp.act_as(:'tars_id');
select is((select role from public.join_live_event(:'med_id')), 'speaker', 'tag belép az online meditációba');
select isnt((select attended_at from public.event_registrations where event_id = :'med_id' and user_id = :'tars_id'), null,
  'a belépés jelenlétnek számít');
select is((select count(*)::int from public.xp_events where user_id = :'tars_id' and source = 'online_meditation'), 1, 'XP jár érte');
select lives_ok($$ select public.join_live_event('$$ || :'med_id' || $$') $$, 'újra belépés nem hiba');
select is((select count(*)::int from public.xp_events where user_id = :'tars_id' and source = 'online_meditation'), 1, 'XP csak egyszer jár');

select is((select role from public.join_live_event(:'qa_id')), 'viewer', 'Társaság Tagja a Q&A-n csak néz');
select pg_temp.act_as(:'belso_id');
select is((select role from public.join_live_event(:'qa_id')), 'speaker', 'Belső Kör a Q&A-n kérdezhet');

select pg_temp.act_as(:'tars_id');
select is(pg_temp.err(format('select public.join_live_event(%L)', :'early_id')), 'TOO_EARLY', 'túl korán nem nyílik');
select is(pg_temp.err(format('select public.join_live_event(%L)', :'offline_id')), 'NOT_LIVE', 'személyes alkalom nem élő');
select pg_temp.act_as(:'trial_id');
select is(pg_temp.err(format('select public.join_live_event(%L)', :'med_id')), 'NOT_PAYING', 'próbaidőben nem nyílik');
select pg_temp.act_as(:'adm_id');
select is((select role from public.join_live_event(:'early_id')), 'host', 'admin bármikor beléphet házigazdaként');

-- ---- Admin tagság nélkül is ír a közösségbe ----
select pg_temp.act_as(:'adm_id');
set local role authenticated;
select lives_ok($$ insert into public.posts (author_id, body) values (auth.uid(), 'Admin hír') $$, 'admin tagság nélkül is posztolhat');
select lives_ok($$ insert into public.comments (author_id, post_id, body)
                   select auth.uid(), id, 'Admin válasz' from public.posts where body = 'Admin hír' $$, 'admin hozzászólhat');
reset role;
select pg_temp.act_as(:'none_id');
set local role authenticated;
select throws_ok($$ insert into public.posts (author_id, body) values (auth.uid(), 'Volt tag írna') $$, '42501', null,
  'volt tag továbbra sem posztolhat');
reset role;

select * from finish();
rollback;
