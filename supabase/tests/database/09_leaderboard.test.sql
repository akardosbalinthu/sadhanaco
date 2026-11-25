-- =============================================================================
-- 09_leaderboard.test.sql — tagi ranglista (heti / havi / negyedéves)
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

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
     set tier = p_tier, subscription_status = p_status, membership_started_at = now(),
         display_name = split_part(p_email, '@', 1)
   where id = v;
  return v;
end $f$;
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;
create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
declare h text;
begin
  execute p_sql;
  return 'NO_ERROR';
exception when others then
  get stacked diagnostics h = pg_exception_hint;
  return case when h ~ '^[A-Z_]+$' then h else sqlstate end;
end $f$;
-- XP közvetlen jóváírása a teszthez (a jelenlegi tagsági ciklusba).
create function pg_temp.give(p_uid uuid, p_xp int, p_on date, p_ref text) returns void language sql as $f$
  insert into public.xp_events (user_id, cycle_started_at, source, source_ref, xp, earned_on)
  select p_uid, membership_started_at, 'lesson', p_ref, p_xp, p_on from public.profiles where id = p_uid;
$f$;
grant execute on all functions in schema pg_temp to authenticated;

select pg_temp.mk_user('anna@example.test')                       as a \gset
select pg_temp.mk_user('bence@example.test', 'belso_kor')         as b \gset
select pg_temp.mk_user('csilla@example.test')                     as c \gset
select pg_temp.mk_user('hedvig@example.test')                     as h \gset
select pg_temp.mk_user('tamas@example.test', 'tarsasagi', 'trialing') as t \gset
select pg_temp.mk_user('xenia@example.test', 'none', 'canceled')  as x \gset
select pg_temp.mk_user('admin@example.test', 'belso_kor')         as adm \gset
update public.profiles set role = 'admin' where id = :'adm';
update public.profiles set leaderboard_hidden = true where id = :'h';

select pg_temp.give(:'a', 50, public.budapest_today(), 'a1');
select pg_temp.give(:'h', 40, public.budapest_today(), 'h1');
select pg_temp.give(:'b', 30, public.budapest_today(), 'b1');
select pg_temp.give(:'t', 20, public.budapest_today(), 't1');
select pg_temp.give(:'c', 100, public.budapest_today() - 200, 'c-old');   -- régi időszak
insert into public.xp_events (user_id, cycle_started_at, source, source_ref, xp, earned_on)
values (:'x', now(), 'lesson', 'x1', 60, public.budapest_today());        -- megszűnt tag

set local role authenticated;
select pg_temp.act_as(:'x');
select is(pg_temp.err($$select public.leaderboard('week')$$), 'NOT_MEMBER', 'a ranglista csak tagoknak látható');
select pg_temp.act_as(:'a');
select is(pg_temp.err($$select public.leaderboard('year')$$), 'INVALID_PERIOD', 'csak heti, havi, negyedéves időszak van');

select is((select array_agg(e ->> 'name' order by (e ->> 'position')::int)
             from jsonb_array_elements(public.leaderboard('week') -> 'top') e),
          array['anna', 'bence', 'tamas'],
          'heti lista: XP szerint, az elrejtett és a megszűnt tag nélkül, próbaidős taggal');
select is((select array_agg((e ->> 'position')::int order by (e ->> 'position')::int)
             from jsonb_array_elements(public.leaderboard('week') -> 'top') e),
          array[1, 2, 3], 'a helyezések az elrejtett tag nélkül számolódnak');
select ok(not (public.leaderboard('quarter')::text like '%@%'), 'e-mail-cím nem kerül a listára');
select ok((public.leaderboard('week') -> 'top' -> 0 ->> 'is_me')::boolean, 'a saját sor jelölve');
select is(public.leaderboard('month') -> 'top' -> 0 ->> 'rank', 'Tanonc', 'a rang is megjelenik');
select ok(not (public.leaderboard('quarter')::text like '%csilla%'), 'régebbi időszak XP-je nem számít');

select pg_temp.act_as(:'h');
select is((public.leaderboard('week') -> 'me' ->> 'position')::int, 2, 'az elrejtett tag látja a saját helyét');
select is((public.leaderboard('week') -> 'me' ->> 'hidden')::boolean, true, 'és azt, hogy el van rejtve');
update public.profiles set leaderboard_hidden = false where id = :'h';
select is((select leaderboard_hidden from public.profiles where id = :'h'), false, 'a láthatóságot a tag maga állíthatja');
select is(pg_temp.err($$update public.profiles set tier = 'belso_kor' where id = '$$ || :'h' || $$'$$), '42501',
          'más mezőt továbbra sem módosíthat');
update public.profiles set leaderboard_hidden = true where id = :'h';

select pg_temp.act_as(:'a');
select is((select count(*)::int from public.xp_events where user_id <> :'a'), 0, 'más tag XP-naplója továbbra sem olvasható');
select is(pg_temp.err('select * from public.admin_quarter_top10()'), 'FORBIDDEN', 'a vacsoralistát csak admin látja');
reset role;

-- 12 további tag: a lista legfeljebb 10 sort mutat
select pg_temp.give(pg_temp.mk_user('tag' || g || '@example.test'), g, public.budapest_today(), 'g' || g)
  from generate_series(1, 12) g;
set local role authenticated;
select pg_temp.act_as(:'a');
select is(jsonb_array_length(public.leaderboard('week') -> 'top'), 10, 'az első 10 látszik');

select pg_temp.act_as(:'adm');
select ok(exists (select 1 from public.admin_quarter_top10() where user_id = :'h'),
          'a vacsoralistán az elrejtett tag is szerepel');
select is((select count(*)::int from public.admin_quarter_top10()), 10, 'a negyedév első tíz helyezettje');
reset role;

select * from finish();
rollback;
