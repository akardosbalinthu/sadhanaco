-- =============================================================================
-- 010 — Fizetős 1-on-1 konzultáció
--
-- Folyamat: a szerver rögzíti a kérést „fizetésre vár” állapotban
-- (create_paid_consultation; az ár a tagsági szint szerint az árkatalógusból) →
-- Stripe Checkout → a webhook véglegesíti (confirm_paid_consultation; idempotens).
-- Csak fizető tag (próbaidő alatt nem). A ki nem fizetett kérések 24 óra után törlődnek.
-- Az új enum-érték ugyanebben a tranzakcióban csak függvénytörzsben szerepel (szövegként).
-- =============================================================================

alter type public.consultation_status add value if not exists 'pending_payment';

create or replace function public.create_paid_consultation(
  p_user          uuid,
  p_requested_for timestamptz default null,
  p_note          text default null
)
returns public.consultations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_grace   smallint;
  v_price   integer;
  v_row     public.consultations;
begin
  perform public._require_service_role();

  select * into v_profile from public.profiles where id = p_user;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;
  select past_due_grace_days into strict v_grace from public.app_settings where id;
  if v_profile.subscription_status = 'trialing' then
    raise exception 'Konzultációt a próbaidő után lehet foglalni.' using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if v_profile.tier = 'none'
     or not (v_profile.subscription_status = 'active'
             or (v_profile.subscription_status = 'past_due'
                 and coalesce(v_profile.past_due_since, now()) + make_interval(days => v_grace) > now())) then
    raise exception 'Konzultációt aktív tagsággal lehet foglalni.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if p_requested_for is not null and p_requested_for <= now() then
    raise exception 'Jövőbeli időpontot adj meg.' using errcode = 'P0001', hint = 'INVALID_TIME';
  end if;

  select amount_huf into v_price
    from public.price_catalog
   where code = case when v_profile.tier = 'belso_kor' then 'konzultacio_belso_kor' else 'konzultacio_tarsasagi' end
     and is_active;
  if v_price is null or v_price <= 0 then
    raise exception 'A konzultáció ára nincs beállítva.' using errcode = 'P0001', hint = 'PRICE_MISSING';
  end if;

  insert into public.consultations (user_id, requested_for, note, is_free, price_huf, status)
  values (p_user, p_requested_for, nullif(btrim(p_note), ''), false, v_price,
          'pending_payment'::text::public.consultation_status)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.confirm_paid_consultation(p_consultation uuid, p_invoice uuid default null)
returns public.consultations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.consultations;
begin
  perform public._require_service_role();
  select * into v_row from public.consultations where id = p_consultation for update;
  if not found then
    raise exception 'A konzultáció nem található.' using errcode = 'P0001', hint = 'CONSULTATION_NOT_FOUND';
  end if;
  if v_row.status::text <> 'pending_payment' then
    return v_row;  -- már véglegesítve (ismételt webhook)
  end if;
  update public.consultations
     set status = 'requested', invoice_id = coalesce(p_invoice, invoice_id)
   where id = p_consultation
   returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.purge_unpaid_consultations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.consultations
   where status::text = 'pending_payment'
     and created_at < now() - interval '24 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule('purge-unpaid-consultations', '29 3 * * *', $$select public.purge_unpaid_consultations()$$);

revoke execute on function public.create_paid_consultation(uuid, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.confirm_paid_consultation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.purge_unpaid_consultations() from public, anon, authenticated;
grant execute on function public.create_paid_consultation(uuid, timestamptz, text) to service_role;
grant execute on function public.confirm_paid_consultation(uuid, uuid) to service_role;
grant execute on function public.purge_unpaid_consultations() to service_role;
