-- =============================================================================
-- 10_names_stage_label.test.sql — teljes név becenévvel, gyakorlási fázis
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.mk_user(p_email text, p_meta jsonb default '{}'::jsonb) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, p_meta, now(), now());
  update public.profiles set tier = 'tarsasagi', subscription_status = 'active', membership_started_at = now() where id = v;
  return v;
end $f$;
create function pg_temp.act_as(p_uid uuid) returns void language sql as $f$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$f$;
create function pg_temp.err(p_sql text) returns text language plpgsql as $f$
begin
  execute p_sql;
  return 'NO_ERROR';
exception when others then
  return sqlstate;
end $f$;
grant execute on all functions in schema pg_temp to authenticated;

-- Név a fiók létrehozásakor (metaadatból)
select pg_temp.mk_user('anna@example.test', '{"last_name": "Kovács", "first_name": "Anna"}') as a \gset
select pg_temp.mk_user('bence@example.test') as b \gset
select pg_temp.mk_user('volt@example.test', '{"last_name": "Volt", "first_name": "Tag"}') as x \gset

select is((select display_name from public.profiles where id = :'a'), 'Kovács Anna', 'új fiók: a név a metaadatból');
select is((select display_name from public.profiles where id = :'b'), 'bence', 'név nélkül: marad az e-mail eleje');

-- A tag a saját nevét és becenevét állítja
select pg_temp.act_as(:'a');
set local role authenticated;
update public.profiles set nickname = 'Panni' where id = :'a';
select is((select display_name from public.profiles where id = :'a'), 'Kovács Anna "Panni"', 'becenévvel: Vezetéknév Keresztnév "Becenév"');
update public.profiles set nickname = '  ' where id = :'a';
select is((select display_name from public.profiles where id = :'a'), 'Kovács Anna', 'üres becenév: nem jelenik meg semmi a helyén');
select is((select nickname from public.profiles where id = :'a'), null, 'az üres becenév null lesz');
update public.profiles set last_name = '  Szabó ', first_name = 'Anna Mária' where id = :'a';
select is((select display_name from public.profiles where id = :'a'), 'Szabó Anna Mária', 'a névrészek levágva, sorrendben');
select is(pg_temp.err($$update public.profiles set nickname = 'a"b' where id = '$$ || :'a' || $$'$$), '23514', 'idézőjel nem lehet a becenévben');
select is(pg_temp.err($$update public.profiles set tier = 'belso_kor' where id = '$$ || :'a' || $$'$$), '42501', 'más mezőt továbbra sem módosíthat');
update public.profiles set nickname = 'Bence' where id = :'b';
select is((select nickname from public.profiles where id = :'b'), null, 'más tag profilját nem írhatja (RLS)');
reset role;

-- Gyakorlási fázis
update public.profiles set membership_started_at = now() - interval '22 days' where id = :'a';
update public.profiles set membership_started_at = now() - interval '60 days' where id = :'b';
update public.profiles set m2_unlocked = true, m2_unlocked_at = now() - interval '1 day' where id = :'b';
update public.profiles set tier = 'none', subscription_status = 'canceled' where id = :'x';

select pg_temp.act_as(:'a');
set local role authenticated;
select is((select current_stage_label from public.community_authors(array[:'a'::uuid])), 'I. lépcső · 4. hét', 'fázis: I. lépcső, 4. hét (22 nap)');
select is((select current_stage_label from public.community_authors(array[:'b'::uuid])), 'II. lépcső · 1. hét', 'a legmagasabb nyitott lépcső számít');
select is((select current_stage_label from public.community_authors(array[:'x'::uuid])), null, 'volt tagnál nincs fázis');
select is((select display_name from public.community_authors(array[:'x'::uuid])), 'Volt Tag', 'volt tagnál a név megmarad');
select is(pg_temp.err($$select public._stage_label('$$ || :'a' || $$')$$), '42501', 'a belső fázisfüggvény kliensből nem hívható');
reset role;

update public.profiles set membership_started_at = now() - interval '57 days', m2_unlocked = false where id = :'a';
select is(public._stage_label(:'a'), 'I. lépcső · lezárás', 'a 9. hét a lezárás');
update public.profiles set membership_started_at = now() - interval '80 days' where id = :'a';
select is(public._stage_label(:'a'), 'I. lépcső · elvégezve', 'a 9. hét után: elvégezve');

select * from finish();
rollback;
