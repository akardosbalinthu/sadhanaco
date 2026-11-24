-- =============================================================================
-- 008 — Kereten felüli, fizetős Elsőbbségi Kedves Üzenet
--
-- Folyamat: a szerver rögzíti az üzenetet „fizetésre vár” állapotban
-- (create_paid_kind_message) → Stripe Checkout → a webhook sorba állítja
-- (confirm_paid_kind_message). A ki nem fizetett piszkozatok 24 óra után törlődnek.
-- Csak fizető tag küldhet (próbaidő alatt nem), legalább app_settings.kind_message_min_huf összegért.
-- XP fizetős üzenetnél csak a sikeres fizetéskor jár.
--
-- Megjegyzés: az új enum-érték ugyanebben a tranzakcióban csak függvénytörzsben
-- (futásidőben) szerepelhet, ezért mindenhol szövegként hasonlítunk.
-- =============================================================================

alter type public.kind_message_status add value if not exists 'pending_payment';

-- 1. Piszkozat a fizetés előtt (csak a szerver hívja) -------------------------
create or replace function public.create_paid_kind_message(
  p_sender          uuid,
  p_recipient_name  text,
  p_recipient_phone text,
  p_message         text,
  p_amount_huf      integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_grace   smallint;
  v_min     integer;
  v_id      uuid;
begin
  perform public._require_service_role();

  select * into v_profile from public.profiles where id = p_sender;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;
  select past_due_grace_days, kind_message_min_huf into strict v_grace, v_min from public.app_settings where id;

  if v_profile.subscription_status = 'trialing' then
    raise exception 'A kereten felüli Elsőbbségi Kedves Üzenet a próbaidő után válik elérhetővé.'
      using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if v_profile.tier = 'none'
     or not (v_profile.subscription_status = 'active'
             or (v_profile.subscription_status = 'past_due'
                 and coalesce(v_profile.past_due_since, now()) + make_interval(days => v_grace) > now())) then
    raise exception 'Az Elsőbbségi Kedves Üzenet aktív tagsággal érhető el.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if p_amount_huf is null or p_amount_huf < v_min then
    raise exception 'Az összeg legalább % Ft.', v_min using errcode = 'P0001', hint = 'AMOUNT_TOO_LOW';
  end if;

  insert into public.kind_messages (sender_id, kind, recipient_name, recipient_phone, message, is_free, amount_huf, status)
  values (p_sender, 'priority', btrim(p_recipient_name), btrim(p_recipient_phone), btrim(p_message), false, p_amount_huf,
          'pending_payment'::text::public.kind_message_status)
  returning id into v_id;
  return v_id;
end;
$$;

-- 2. Sorba állítás a sikeres fizetés után (webhook; idempotens) ---------------
create or replace function public.confirm_paid_kind_message(p_message uuid, p_invoice uuid default null)
returns public.kind_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg public.kind_messages;
begin
  perform public._require_service_role();
  select * into v_msg from public.kind_messages where id = p_message for update;
  if not found then
    raise exception 'Az üzenet nem található.' using errcode = 'P0001', hint = 'MESSAGE_NOT_FOUND';
  end if;
  if v_msg.status::text <> 'pending_payment' then
    return v_msg;  -- már sorba állítva (ismételt webhook)
  end if;
  update public.kind_messages
     set status = 'queued', confirmed_at = now(), invoice_id = coalesce(p_invoice, invoice_id)
   where id = p_message
   returning * into v_msg;
  return v_msg;
end;
$$;

-- 3. XP: fizetős üzenetnél csak a fizetéskor ----------------------------------
create or replace function public.xp_on_kind_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sender_id is null or new.status::text = 'pending_payment' then
    return new;
  end if;
  if tg_op = 'INSERT' or old.status::text = 'pending_payment' then
    perform public._award_xp(new.sender_id, 'kind_message', new.id::text);
  end if;
  return new;
end;
$$;

create trigger kind_messages_xp_paid after update of status on public.kind_messages
  for each row execute function public.xp_on_kind_message();

-- 4. A ki nem fizetett piszkozatok törlése (24 óra után) ----------------------
create or replace function public.purge_unpaid_kind_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.kind_messages
   where status::text = 'pending_payment'
     and created_at < now() - interval '24 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule('purge-unpaid-kind-messages', '23 3 * * *', $$select public.purge_unpaid_kind_messages()$$);

-- Jogok: mindhármat csak a szerver (service role) hívhatja.
revoke execute on function public.create_paid_kind_message(uuid, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.confirm_paid_kind_message(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.purge_unpaid_kind_messages() from public, anon, authenticated;
grant execute on function public.create_paid_kind_message(uuid, text, text, text, integer) to service_role;
grant execute on function public.confirm_paid_kind_message(uuid, uuid) to service_role;
grant execute on function public.purge_unpaid_kind_messages() to service_role;
