-- =============================================================================
-- 014 — Névtelen Kedves Üzenet
-- A küldő kérheti, hogy a címzett ne tudja meg, ki küldte. A küldő adatai
-- (megerősítés, számla) továbbra is tárolódnak; csak a hívásban maradnak rejtve.
-- =============================================================================

alter table public.kind_messages
  add column if not exists anonymous boolean not null default false;

comment on column public.kind_messages.anonymous is
  'A küldő névtelenséget kért: a hívásban a nevét nem mondjuk ki.';

-- A névtelenség jelölése a beküldés után — csak szerveroldalról (service_role).
create or replace function public.set_kind_message_anonymous(p_message_id uuid, p_anonymous boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_service_role();
  update public.kind_messages
     set anonymous = coalesce(p_anonymous, false)
   where id = p_message_id
     and status in ('pending_confirmation', 'pending_payment', 'queued');
  if not found then
    raise exception 'Az üzenet nem található vagy már feldolgozás alatt van.' using errcode = 'P0002', hint = 'NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.set_kind_message_anonymous(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_kind_message_anonymous(uuid, boolean) to service_role;
