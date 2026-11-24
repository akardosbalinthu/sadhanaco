-- =============================================================================
-- 002_rpc_functions.sql — atomi, SECURITY DEFINER üzleti függvények
-- Minden függvény: SET search_path = '', sorzárolás (SELECT ... FOR UPDATE),
-- a hívó azonosítása kizárólag auth.uid() alapján (soha nem paraméterből).
--
-- Hibakezelés: a felület a HINT mezőben kapott gépi kódot használja,
-- a MESSAGE emberi, magyar nyelvű szöveg.
-- Zárolási sorrend (holtpont ellen): events -> profiles. Fordítva sehol.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Segéd: ország -> bevételi régió (7.2: HU / egyéb EU / EU-n kívül)
-- -----------------------------------------------------------------------------
create or replace function public.revenue_region_for(p_country text)
returns public.revenue_region
language sql immutable
set search_path = ''
as $$
  select case
    when p_country is null or upper(p_country) = 'HU' then 'HU'::public.revenue_region
    when upper(p_country) = any (array[
      'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','EL','IE','IT',
      'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
    ]) then 'EU'::public.revenue_region
    else 'NON_EU'::public.revenue_region
  end
$$;

-- -----------------------------------------------------------------------------
-- Eseményfoglalás
--   * próbaidőben tiltott (7.3)
--   * tagi kvóta: floor(capacity * ratio); nyílt esteken 50% (app_settings),
--     zárt eseményeken 100%
--   * Belső Kör elsőbbségi ablak (alapból 48 óra a regisztráció nyitásától)
--   * elvonulás csak retreat_unlocked taggal
--   * fizetős helynél pending_payment + időkorlátos helyfoglalás
-- -----------------------------------------------------------------------------
create or replace function public.book_event(p_event_id uuid)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := auth.uid();
  v_settings      public.app_settings;
  v_event         public.events;
  v_profile       public.profiles;
  v_ratio         numeric;
  v_member_cap    integer;
  v_member_taken  integer;
  v_total_taken   integer;
  v_price         integer;
  v_reg           public.event_registrations;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;

  select * into strict v_settings from public.app_settings where id;

  -- 1) Esemény zárolása: az azonos eseményre érkező foglalások sorba állnak.
  select * into v_event from public.events where id = p_event_id for update;
  if not found or not v_event.is_published or v_event.cancelled_at is not null then
    raise exception 'Ez az esemény nem érhető el.' using errcode = 'P0001', hint = 'EVENT_NOT_FOUND';
  end if;

  -- 2) Profil zárolása.
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;

  if v_profile.subscription_status = 'trialing' then
    raise exception 'A próbaidő alatt eseményre még nem lehet jelentkezni. A próbaidő végén ez is megnyílik.'
      using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if not public.is_paying_member() then
    raise exception 'Eseményre aktív tagsággal lehet jelentkezni.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if not (v_profile.tier = any (v_event.allowed_tiers)) then
    raise exception 'Erre az alkalomra a jelenlegi tagságoddal nem lehet jelentkezni.'
      using errcode = 'P0001', hint = 'TIER_NOT_ALLOWED';
  end if;
  if v_event.requires_retreat_unlock and not v_profile.retreat_unlocked then
    raise exception 'Az elvonulás az IP 3 elvégzése és jóváhagyás után nyílik meg.'
      using errcode = 'P0001', hint = 'RETREAT_LOCKED';
  end if;

  -- 3) Időablakok.
  if now() < v_event.registration_opens_at then
    raise exception 'A jelentkezés még nem nyílt meg.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_OPEN';
  end if;
  if now() >= v_event.starts_at
     or (v_event.registration_closes_at is not null and now() >= v_event.registration_closes_at) then
    raise exception 'A jelentkezés erre az alkalomra lezárult.' using errcode = 'P0001', hint = 'REGISTRATION_CLOSED';
  end if;
  if v_event.belso_kor_priority
     and v_profile.tier <> 'belso_kor'
     and now() < v_event.registration_opens_at + make_interval(hours => v_settings.belso_kor_priority_hours) then
    raise exception 'Az első % órában a Belső Kör tagjai foglalhatnak. Utána a fennmaradó helyekre te is jelentkezhetsz.',
      v_settings.belso_kor_priority_hours
      using errcode = 'P0001', hint = 'PRIORITY_WINDOW';
  end if;

  -- 4) Lejárt fizetési helyfoglalások felszabadítása.
  update public.event_registrations
     set status = 'cancelled', cancelled_at = now()
   where event_id = v_event.id
     and status = 'pending_payment'
     and hold_expires_at <= now();

  if exists (
    select 1 from public.event_registrations r
    where r.event_id = v_event.id and r.user_id = v_uid and r.status <> 'cancelled'
  ) then
    raise exception 'Erre az alkalomra már jelentkeztél.' using errcode = 'P0001', hint = 'ALREADY_REGISTERED';
  end if;

  -- 5) Kapacitás és tagi kvóta (az esemény sora zárolva van, a számlálás pontos).
  if v_event.capacity is not null then
    v_ratio := coalesce(
      v_event.member_quota_ratio,
      case when v_event.members_only then 1.0 else v_settings.event_member_quota_ratio end
    );
    v_member_cap := floor(v_event.capacity * v_ratio)::integer;

    select count(*) filter (where r.is_member_seat), count(*)
      into v_member_taken, v_total_taken
      from public.event_registrations r
     where r.event_id = v_event.id and r.status <> 'cancelled';

    if v_member_taken >= v_member_cap or v_total_taken >= v_event.capacity then
      raise exception 'A tagoknak szánt helyek erre az alkalomra beteltek.'
        using errcode = 'P0001', hint = 'EVENT_FULL';
    end if;
  end if;

  -- 6) Ár a tagsági szint szerint.
  v_price := case v_profile.tier
               when 'belso_kor' then v_event.price_belso_kor_huf
               else v_event.price_tarsasagi_huf
             end;

  insert into public.event_registrations (
    event_id, user_id, is_member_seat, tier_at_booking, price_huf, status, hold_expires_at
  ) values (
    v_event.id, v_uid, true, v_profile.tier, v_price,
    case when v_price = 0 then 'confirmed' else 'pending_payment' end::public.registration_status,
    case when v_price = 0 then null else now() + make_interval(mins => v_settings.payment_hold_minutes) end
  )
  returning * into v_reg;

  return v_reg;
end;
$$;

-- -----------------------------------------------------------------------------
-- Külsős (bejelentkezés nélküli) helyfoglalás a Nyílt Estre — CSAK service role.
-- A weboldal szerveroldali kódja hívja a Stripe Checkout indítása előtt;
-- a helyet payment_hold_minutes (30 perc = a Stripe Checkout minimális
-- lejárata) idejére tartja, a fizetés után confirm_registration_payment() erősíti meg.
-- A tagi 50%-os kvóta nem érinti: külsős a teljes kapacitásig foglalhat.
-- -----------------------------------------------------------------------------
create or replace function public.reserve_guest_seat(
  p_event_id    uuid,
  p_guest_name  text,
  p_guest_email text
)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.app_settings;
  v_event    public.events;
  v_email    text := lower(btrim(p_guest_email));
  v_taken    integer;
  v_reg      public.event_registrations;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Csak szerveroldalról hívható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or nullif(btrim(p_guest_name), '') is null then
    raise exception 'Adj meg nevet és érvényes e-mail-címet.' using errcode = 'P0001', hint = 'INVALID_GUEST';
  end if;

  select * into strict v_settings from public.app_settings where id;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or not v_event.is_published or v_event.cancelled_at is not null then
    raise exception 'Ez az esemény nem érhető el.' using errcode = 'P0001', hint = 'EVENT_NOT_FOUND';
  end if;
  if v_event.members_only or v_event.price_external_huf is null then
    raise exception 'Erre az alkalomra csak tagok jelentkezhetnek.' using errcode = 'P0001', hint = 'NOT_PUBLIC_EVENT';
  end if;
  if now() < v_event.registration_opens_at then
    raise exception 'A jelentkezés még nem nyílt meg.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_OPEN';
  end if;
  if now() >= v_event.starts_at
     or (v_event.registration_closes_at is not null and now() >= v_event.registration_closes_at) then
    raise exception 'A jelentkezés erre az alkalomra lezárult.' using errcode = 'P0001', hint = 'REGISTRATION_CLOSED';
  end if;

  update public.event_registrations
     set status = 'cancelled', cancelled_at = now()
   where event_id = v_event.id and status = 'pending_payment' and hold_expires_at <= now();

  if exists (
    select 1 from public.event_registrations r
     where r.event_id = v_event.id and r.user_id is null
       and lower(r.guest_email) = v_email and r.status <> 'cancelled'
  ) then
    raise exception 'Ezzel az e-mail-címmel már van jelentkezés erre az alkalomra.'
      using errcode = 'P0001', hint = 'ALREADY_REGISTERED';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_taken from public.event_registrations r
     where r.event_id = v_event.id and r.status <> 'cancelled';
    if v_taken >= v_event.capacity then
      raise exception 'Erre az alkalomra minden hely betelt.' using errcode = 'P0001', hint = 'EVENT_FULL';
    end if;
  end if;

  insert into public.event_registrations (
    event_id, user_id, guest_name, guest_email, is_member_seat, price_huf, status, hold_expires_at
  ) values (
    v_event.id, null, btrim(p_guest_name), v_email, false, v_event.price_external_huf,
    case when v_event.price_external_huf = 0 then 'confirmed' else 'pending_payment' end::public.registration_status,
    case when v_event.price_external_huf = 0 then null
         else now() + make_interval(mins => v_settings.payment_hold_minutes) end
  )
  returning * into v_reg;

  return v_reg;
end;
$$;

-- Sikeres fizetés után (Stripe webhook) — CSAK service role. Idempotens.
-- Ha a tartott hely közben lejárt és felszabadult, a foglalást mégis
-- megerősítjük (a vendég fizetett), és túlfoglalás esetén admin értesítés készül.
create or replace function public.confirm_registration_payment(p_registration_id uuid)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg   public.event_registrations;
  v_event public.events;
  v_taken integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Csak szerveroldalról hívható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;

  select r.* into v_reg from public.event_registrations r where r.id = p_registration_id;
  if not found then
    raise exception 'A foglalás nem található.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_FOUND';
  end if;
  select * into v_event from public.events where id = v_reg.event_id for update;
  select * into v_reg from public.event_registrations where id = p_registration_id for update;

  if v_reg.status = 'confirmed' then
    return v_reg;
  end if;

  update public.event_registrations
     set status = 'confirmed', hold_expires_at = null, cancelled_at = null
   where id = v_reg.id
  returning * into v_reg;

  if v_event.capacity is not null then
    select count(*) into v_taken from public.event_registrations r
     where r.event_id = v_event.id and r.status <> 'cancelled';
    if v_taken > v_event.capacity then
      insert into public.admin_notifications (kind, payload)
      values ('other', jsonb_build_object(
        'type', 'overbooking', 'event_id', v_event.id, 'registration_id', v_reg.id,
        'capacity', v_event.capacity, 'taken', v_taken));
    end if;
  end if;

  return v_reg;
end;
$$;

-- Nyilvános lista a weboldalnak: közelgő, külsősök számára nyitott Nyílt Estek
-- szabad helyekkel. Személyes adatot nem ad vissza.
create or replace function public.public_open_evenings()
returns table (
  id                  uuid,
  title               text,
  description         text,
  location            text,
  is_online           boolean,
  starts_at           timestamptz,
  ends_at             timestamptz,
  price_external_huf  integer,
  registration_open   boolean,
  seats_left          integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.title, e.description, e.location, e.is_online, e.starts_at, e.ends_at,
         e.price_external_huf,
         now() >= e.registration_opens_at
           and (e.registration_closes_at is null or now() < e.registration_closes_at),
         case when e.capacity is null then null
              else greatest(e.capacity - (
                select count(*) from public.event_registrations r
                 where r.event_id = e.id
                   and (r.status = 'confirmed' or (r.status = 'pending_payment' and r.hold_expires_at > now()))
              ), 0)::integer
         end
    from public.events e
   where e.is_published and e.cancelled_at is null
     and not e.members_only and e.price_external_huf is not null
     and e.starts_at > now()
   order by e.starts_at
$$;

-- -----------------------------------------------------------------------------
-- Díjmentes Elsőbbségi Kedves Üzenet felhasználása (havi keret)
-- -----------------------------------------------------------------------------
create or replace function public.send_free_kind_message(
  p_recipient_name  text,
  p_recipient_phone text,
  p_message         text
)
returns public.kind_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_msg     public.kind_messages;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if v_profile.subscription_status = 'trialing' then
    raise exception 'A díjmentes Kedves Üzenet a próbaidő után válik elérhetővé.'
      using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if not public.is_paying_member() then
    raise exception 'A díjmentes Kedves Üzenet aktív tagsággal érhető el.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if v_profile.free_messages_remaining <= 0 then
    raise exception 'Ebben a hónapban már elküldted a díjmentes üzeneteidet.'
      using errcode = 'P0001', hint = 'QUOTA_EXHAUSTED';
  end if;

  update public.profiles
     set free_messages_remaining = free_messages_remaining - 1
   where id = v_uid;

  insert into public.kind_messages (sender_id, recipient_name, recipient_phone, message, is_free, amount_huf)
  values (v_uid, btrim(p_recipient_name), btrim(p_recipient_phone), btrim(p_message), true, 0)
  returning * into v_msg;

  return v_msg;
end;
$$;

-- -----------------------------------------------------------------------------
-- Díjmentes 1-on-1 konzultáció felhasználása (Belső Kör éves keret)
-- -----------------------------------------------------------------------------
create or replace function public.book_free_consultation(
  p_requested_for timestamptz default null,
  p_note          text default null
)
returns public.consultations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_row     public.consultations;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if v_profile.subscription_status = 'trialing' then
    raise exception 'Konzultációt a próbaidő után lehet foglalni.' using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if not public.is_paying_member() then
    raise exception 'Konzultációt aktív tagsággal lehet foglalni.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if v_profile.free_consultations_remaining <= 0 then
    raise exception 'Nincs több díjmentes konzultációs alkalmad ebben az időszakban.'
      using errcode = 'P0001', hint = 'QUOTA_EXHAUSTED';
  end if;
  if p_requested_for is not null and p_requested_for <= now() then
    raise exception 'Jövőbeli időpontot adj meg.' using errcode = 'P0001', hint = 'INVALID_TIME';
  end if;

  update public.profiles
     set free_consultations_remaining = free_consultations_remaining - 1
   where id = v_uid;

  insert into public.consultations (user_id, requested_for, note, is_free, price_huf)
  values (v_uid, p_requested_for, nullif(btrim(p_note), ''), true, 0)
  returning * into v_row;

  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- KATA bevételi összesítő (7.1) + OSS-figyelés (7.2) — csak admin / service role
--   invoiced:  az adott naptári évben (Europe/Budapest) kiállított számlák
--              összege, sztornókkal (negatív) együtt
--   projected: az év végéig várható megújulások azoknál, akik nem mondták le
--              (cancel_at_period_end = false), a tényleges ciklusdíjjal
--              (recurring_amount_huf), ennek hiányában listaárral
-- -----------------------------------------------------------------------------
create or replace function public.kata_revenue_status(p_year integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_year       integer := coalesce(p_year, extract(year from (now() at time zone 'Europe/Budapest'))::integer);
  v_start      timestamptz := make_timestamptz(v_year, 1, 1, 0, 0, 0, 'Europe/Budapest');
  v_end        timestamptz := make_timestamptz(v_year + 1, 1, 1, 0, 0, 0, 'Europe/Budapest');
  v_settings   public.app_settings;
  v_inv        jsonb;
  v_invoiced   bigint;
  v_proj       jsonb;
  v_projected  bigint;
  v_total      bigint;
  v_eu_huf     bigint;
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Ehhez admin jogosultság szükséges.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;

  select * into strict v_settings from public.app_settings where id;

  select jsonb_build_object(
           'HU',     coalesce(sum(amount_huf) filter (where region = 'HU'), 0),
           'EU',     coalesce(sum(amount_huf) filter (where region = 'EU'), 0),
           'NON_EU', coalesce(sum(amount_huf) filter (where region = 'NON_EU'), 0)
         ),
         coalesce(sum(amount_huf), 0)
    into v_inv, v_invoiced
    from public.invoices
   where issued_at >= v_start and issued_at < v_end;

  with subs as (
    select p.id,
           public.revenue_region_for(p.country) as region,
           coalesce(p.billing_interval, 'month') as interval_kind,
           coalesce(
             p.recurring_amount_huf,
             (select pc.amount_huf from public.price_catalog pc
               where pc.tier = p.tier and pc.billing_interval = coalesce(p.billing_interval, 'month')
                 and pc.is_active
               order by pc.amount_huf desc limit 1),
             0
           ) as amount,
           greatest(p.current_period_end, now()) as next_charge
      from public.profiles p
     where p.tier <> 'none'
       and p.subscription_status in ('active', 'trialing', 'past_due')
       and not p.cancel_at_period_end
       and p.current_period_end is not null
  ),
  renewals as (
    select s.region, s.amount
      from subs s
     cross join lateral generate_series(
       s.next_charge,
       v_end - interval '1 microsecond',
       case s.interval_kind when 'year' then interval '1 year' else interval '1 month' end
     ) as charge_at
     where charge_at >= v_start
  )
  select jsonb_build_object(
           'HU',     coalesce(sum(amount) filter (where region = 'HU'), 0),
           'EU',     coalesce(sum(amount) filter (where region = 'EU'), 0),
           'NON_EU', coalesce(sum(amount) filter (where region = 'NON_EU'), 0)
         ),
         coalesce(sum(amount), 0)
    into v_proj, v_projected
    from renewals;

  v_total  := v_invoiced + v_projected;
  v_eu_huf := (v_inv ->> 'EU')::bigint + (v_proj ->> 'EU')::bigint;

  return jsonb_build_object(
    'year',                    v_year,
    'kata_limit_huf',          v_settings.kata_annual_limit_huf,
    'warning_ratio',           v_settings.kata_warning_ratio,
    'invoiced_total_huf',      v_invoiced,
    'invoiced_by_region',      v_inv,
    'projected_renewals_huf',  v_projected,
    'projected_by_region',     v_proj,
    'projected_total_huf',     v_total,
    'usage_ratio',             round(v_total::numeric / v_settings.kata_annual_limit_huf, 4),
    'warning',                 v_total >= v_settings.kata_annual_limit_huf * v_settings.kata_warning_ratio,
    'limit_reached',           v_total >= v_settings.kata_annual_limit_huf,
    'registration_open',       v_settings.registration_open,
    'oss', jsonb_build_object(
      'eu_invoiced_huf',       (v_inv ->> 'EU')::bigint,
      'eu_projected_total_huf', v_eu_huf,
      'eu_projected_total_eur', round(v_eu_huf / v_settings.eur_huf_rate, 2),
      'limit_eur',             v_settings.oss_limit_eur,
      'warning',               (v_eu_huf / v_settings.eur_huf_rate) >= v_settings.oss_limit_eur * v_settings.kata_warning_ratio
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Admin sztornó rögzítése (7.2: csak hibásan kiállított számla javítására).
-- A sztornószámlát a számlázó szolgáltató (Billingo) állítja ki a 2. fázisban;
-- ez a helyi nyilvántartás.
-- -----------------------------------------------------------------------------
create or replace function public.admin_record_storno(
  p_invoice_id               uuid,
  p_reason                   text,
  p_provider_invoice_number  text
)
returns public.invoices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orig public.invoices;
  v_row  public.invoices;
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Sztornót csak admin rögzíthet.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A sztornó indoka kötelező.' using errcode = 'P0001', hint = 'REASON_REQUIRED';
  end if;

  select * into v_orig from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'A számla nem található.' using errcode = 'P0001', hint = 'INVOICE_NOT_FOUND';
  end if;
  if v_orig.is_storno then
    raise exception 'Sztornószámlát nem lehet sztornózni.' using errcode = 'P0001', hint = 'ALREADY_STORNO';
  end if;
  if exists (select 1 from public.invoices i where i.storno_of = v_orig.id) then
    raise exception 'Ez a számla már sztornózva van.' using errcode = 'P0001', hint = 'ALREADY_STORNOED';
  end if;

  insert into public.invoices (
    user_id, product_code, description, amount_huf, currency, country, region,
    invoice_provider, provider_invoice_number, billing_entity, is_storno, storno_of, storno_reason, created_by
  ) values (
    v_orig.user_id, v_orig.product_code, 'Sztornó: ' || v_orig.description, -v_orig.amount_huf,
    v_orig.currency, v_orig.country, v_orig.region, v_orig.invoice_provider, p_provider_invoice_number,
    v_orig.billing_entity, true, v_orig.id, btrim(p_reason), auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- Adatminimalizálás: a Kedves Üzenet címzettjének telefonszáma legfeljebb
-- app_settings.phone_retention_days (max. 180) napig tárolódik.
-- Napi ütemezés: 003_scheduled_jobs.sql (pg_cron). Visszaadja a törölt számok darabszámát.
-- -----------------------------------------------------------------------------
create or replace function public.purge_kind_message_phones()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days  smallint;
  v_count integer;
begin
  select phone_retention_days into strict v_days from public.app_settings where id;
  update public.kind_messages
     set recipient_phone = null, phone_purged_at = now()
   where recipient_phone is not null
     and created_at < now() - make_interval(days => v_days);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Közösségi olvasó segédek
-- -----------------------------------------------------------------------------

-- Szerzők nyilvános adatai. Volt tagnál a név megmarad, de nincs fázis és
-- is_current_member = false (a felület ilyenkor nem tesz rá linket / üzenetgombot).
create or replace function public.community_authors(p_ids uuid[])
returns table (
  id                   uuid,
  display_name         text,
  is_current_member    boolean,
  current_stage_label  text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         p.display_name,
         active.is_active,
         case when active.is_active then p.current_stage_label end
    from public.profiles p
   cross join public.app_settings s
   cross join lateral (
     select p.tier <> 'none'
            and (p.subscription_status in ('active', 'trialing')
                 or (p.subscription_status = 'past_due' and s.past_due_has_access)) as is_active
   ) active
   where p.id = any (p_ids)
     and (public.has_member_access() or public.is_admin())
$$;

-- Hírfolyam: hozzászólás- és reakciószámmal, "megválaszolatlan" jelzővel
-- (megválaszolatlan = a szerzőn kívül még senki nem szólt hozzá).
-- security_invoker: a hívó RLS-e érvényesül.
create view public.post_feed
with (security_invoker = true)
as
select p.id,
       p.author_id,
       p.kind,
       p.title,
       p.body,
       p.created_at,
       p.edited_at,
       (select count(*) from public.comments c where c.post_id = p.id)::integer as comment_count,
       (select count(*) from public.post_reactions r where r.post_id = p.id and r.kind = 'koszonom')::integer as koszonom_count,
       (select count(*) from public.post_reactions r where r.post_id = p.id and r.kind = 'hasonlot')::integer as hasonlot_count,
       not exists (
         select 1 from public.comments c
          where c.post_id = p.id and c.author_id is distinct from p.author_id
       ) as is_unanswered
  from public.posts p;

-- -----------------------------------------------------------------------------
-- Jogok
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
revoke all on public.post_feed from anon, authenticated;
grant select on public.post_feed to authenticated;

grant execute on function public.book_event(uuid) to authenticated;
grant execute on function public.send_free_kind_message(text, text, text) to authenticated;
grant execute on function public.book_free_consultation(timestamptz, text) to authenticated;
grant execute on function public.kata_revenue_status(integer) to authenticated;
grant execute on function public.admin_record_storno(uuid, text, text) to authenticated;
grant execute on function public.community_authors(uuid[]) to authenticated;
grant execute on function public.revenue_region_for(text) to authenticated;
grant execute on function public.public_open_evenings() to anon, authenticated;
-- reserve_guest_seat és confirm_registration_payment: csak service_role (lent).
grant execute on all functions in schema public to service_role;
grant select on public.post_feed to service_role;
