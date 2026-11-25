-- =============================================================================
-- 14_magusok.test.sql — a Mágusok rendje (adminok)
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.mk_user(p_email text) returns uuid language plpgsql as $f$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}'::jsonb, now(), now());
  update public.profiles set tier = 'tarsasagi', subscription_status = 'active', membership_started_at = now() where id = v;
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
grant execute on all functions in schema pg_temp to authenticated;

-- A superadmin-listán szereplő cím regisztrációkor Mágus lesz
update public.app_settings set superadmin_emails = array['boss@example.test'];
select pg_temp.mk_user('boss@example.test') as boss \gset
select is((select order_key::text from public.profiles where id = :'boss'), 'magusok', 'a superadmin regisztrációkor a Mágusok rendjébe kerül');

select pg_temp.mk_user('tag@example.test') as tag \gset
update public.profiles set order_key = 'vandorok' where id = :'tag';

-- A superadmin adminná teszi: Mágus lesz
select pg_temp.act_as(:'boss');
set local role authenticated;
update public.profiles set role = 'admin' where id = :'tag';
select is((select order_key::text from public.profiles where id = :'tag'), 'magusok', 'admin szerepkörrel a rend Mágus');
select is(pg_temp.err($$select public.superadmin_set_order('$$ || :'tag' || $$', 'tundek')$$), 'ORDER_NOT_ALLOWED', 'admin nem kaphat tagi rendet');

-- Visszaminősítés tagra: a Mágus rend törlődik
update public.profiles set role = 'member' where id = :'tag';
select is((select order_key from public.profiles where id = :'tag'), null, 'tagként a Mágus rend törlődik');
select is(pg_temp.err($$select public.superadmin_set_order('$$ || :'tag' || $$', 'magusok')$$), 'ORDER_NOT_ALLOWED', 'tag nem lehet Mágus');
select is((public.superadmin_set_order(:'tag', 'kertorzok')).order_key::text, 'kertorzok', 'tagnak tagi rend adható');
reset role;

-- Tag maga nem válthat Mágusra, és a Ceremónia sem adhat Mágus rendet
select pg_temp.mk_user('masik@example.test') as m \gset
select pg_temp.act_as(:'m');
set local role authenticated;
select is(pg_temp.err($$update public.profiles set order_key = 'magusok' where id = '$$ || :'m' || $$'$$), '42501', 'tag nem állíthat magának rendet');
select is(pg_temp.err($$update public.profiles set role = 'admin' where id = '$$ || :'m' || $$'$$), '42501', 'tag nem tehet magát adminná');
reset role;
-- Holtverseny (Tünde–Kertőrző): a kliens által küldött „magusok” döntő választ a Ceremónia elutasítja
select jsonb_object_agg(id::text, (select o ->> 'key' from jsonb_array_elements(options) o
                                    where o ->> 'order' = case when id = 1 or id between 3 and 7 then 'tundek' else 'kertorzok' end)) as ans_tie
  from public.compass_questions \gset
select pg_temp.act_as(:'m');
set local role authenticated;
select is(pg_temp.err($$select public.submit_compass('$$ || :'ans_tie' || $$', 'magusok')$$), 'COMPASS_TIE', 'a Ceremónia döntő válaszként sem ad Mágus rendet');
reset role;
select is((select order_key from public.profiles where id = :'m'), null, 'a tag rendje üres maradt');

select * from finish();
rollback;
