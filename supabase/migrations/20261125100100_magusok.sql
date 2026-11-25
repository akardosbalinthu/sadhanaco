-- =============================================================================
-- 011b — A Mágusok rendjének szabályai
--
-- • Aki admin vagy superadmin szerepkört kap, automatikusan a Mágusok rendjébe kerül;
--   ha a szerepköre tagra változik, a Mágus rend törlődik (tagként a Ceremónián kap újat).
-- • A Ceremónia továbbra is csak a 4 tagi rend közül választ (a pontozás csak azokat ismeri).
-- • A rendet javító superadmin-funkció Mágus rendet csak adminnak adhat, adminnak pedig csak azt.
-- • A meglévő adminok besorolása.
-- =============================================================================

create or replace function public.order_for_staff()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role in ('admin', 'superadmin') then
    new.order_key := 'magusok';
  elsif tg_op = 'UPDATE' and old.role in ('admin', 'superadmin') and new.order_key::text = 'magusok' then
    new.order_key := null;
  end if;
  return new;
end;
$$;

-- A guard után fut (ábécérend), így a szerepkör-váltással járó rendváltás nem ütközik a rendzárral.
create trigger profiles_order_for_staff before insert or update of role on public.profiles
  for each row execute function public.order_for_staff();

create or replace function public.superadmin_set_order(p_user uuid, p_order public.order_key)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row  public.profiles;
  v_role public.user_role;
begin
  if not public.is_superadmin() then
    raise exception 'Csak superadmin javíthat rendet.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select role into v_role from public.profiles where id = p_user;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;
  if (v_role in ('admin', 'superadmin')) <> (p_order::text = 'magusok') then
    raise exception 'A Mágusok rendje az adminoké; tag nem lehet Mágus, admin pedig csak az.'
      using errcode = 'P0001', hint = 'ORDER_NOT_ALLOWED';
  end if;
  update public.profiles set order_key = p_order where id = p_user returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.order_for_staff() from public, anon, authenticated;

-- Meglévő adminok besorolása.
update public.profiles set order_key = 'magusok' where role in ('admin', 'superadmin') and order_key is distinct from 'magusok';
