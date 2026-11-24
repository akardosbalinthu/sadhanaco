-- =============================================================================
-- 009 — Saját foglalás lemondása, túravendég meghívójának visszavonása
--
-- cancel_my_registration: a tag a kezdés előtt lemondhatja a saját (megerősített vagy
--   fizetésre váró) foglalását; a hely felszabadul. Fizetős alkalomnál az ÁSZF szerint
--   visszatérítés nincs — ezt a felület jelzi, az adatbázis nem térít vissza semmit.
-- cancel_hike_invitation: a meghívó tag a túra előtt visszavonhatja a vendége meghívóját;
--   ha a vendég már elfogadta, a vendég foglalása is törlődik.
-- =============================================================================

create or replace function public.cancel_my_registration(p_registration_id uuid)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_reg   public.event_registrations;
  v_event public.events;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_reg from public.event_registrations where id = p_registration_id for update;
  if not found or v_reg.user_id is distinct from v_uid then
    raise exception 'A foglalás nem található.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_FOUND';
  end if;
  if v_reg.status = 'cancelled' then
    return v_reg;
  end if;
  select * into v_event from public.events where id = v_reg.event_id;
  if now() >= v_event.starts_at then
    raise exception 'Az alkalom már elkezdődött, a foglalás nem mondható le.' using errcode = 'P0001', hint = 'EVENT_STARTED';
  end if;
  update public.event_registrations
     set status = 'cancelled', cancelled_at = now(), hold_expires_at = null
   where id = v_reg.id
   returning * into v_reg;
  return v_reg;
end;
$$;

create or replace function public.cancel_hike_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_inv   public.event_invitations;
  v_start timestamptz;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_inv from public.event_invitations where id = p_invitation_id for update;
  if not found or v_inv.invited_by is distinct from v_uid then
    raise exception 'A meghívó nem található.' using errcode = 'P0001', hint = 'INVITATION_INVALID';
  end if;
  if v_inv.status = 'cancelled' then
    return;
  end if;
  select starts_at into v_start from public.events where id = v_inv.event_id;
  if now() >= v_start then
    raise exception 'A túra már elkezdődött.' using errcode = 'P0001', hint = 'EVENT_STARTED';
  end if;
  update public.event_invitations set status = 'cancelled' where id = v_inv.id;
  if v_inv.registration_id is not null then
    update public.event_registrations
       set status = 'cancelled', cancelled_at = now()
     where id = v_inv.registration_id and status <> 'cancelled';
  end if;
end;
$$;

revoke execute on function public.cancel_my_registration(uuid) from public, anon;
revoke execute on function public.cancel_hike_invitation(uuid) from public, anon;
grant execute on function public.cancel_my_registration(uuid) to authenticated, service_role;
grant execute on function public.cancel_hike_invitation(uuid) to authenticated, service_role;
