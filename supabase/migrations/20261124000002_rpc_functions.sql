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
-- a helyet payment_hold_minutes (35 perc; a Stripe Checkout 31 perc után lejár, így
-- lejárt munkamenetből nem jöhet fizetés tartott hely nélkül) idejére tartja, a fizetés után confirm_registration_payment() erősíti meg.
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
      values ('overbooking', jsonb_build_object( 'event_id', v_event.id, 'registration_id', v_reg.id,
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
-- Bevételi összesítő (7.1) + régiós bontás / OSS-figyelés (7.2)
--   invoiced:  az adott naptári évben (Europe/Budapest) rögzített számlatételek
--   projected: az év végéig várható megújulások (nem lemondott előfizetések),
--              a tényleges ciklusdíjjal (recurring_amount_huf), ennek hiányában listaárral
--   határ:     least(KATA-határ, alanyi adómentesség határa) — revenue_limits tábla
-- A belső változatot az ütemezett ellenőrzés hívja; kívülről csak a jogosultság-
-- ellenőrző burkoló érhető el.
-- -----------------------------------------------------------------------------
create or replace function public._revenue_status_internal(p_year integer default null)
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
  v_limits     public.revenue_limits;
  v_binding    bigint;
  v_inv        jsonb;
  v_invoiced   bigint;
  v_proj       jsonb;
  v_projected  bigint;
  v_total      bigint;
  v_eu_huf     bigint;
begin
  select * into strict v_settings from public.app_settings where id;
  select * into v_limits from public.revenue_limits where year <= v_year order by year desc limit 1;
  if not found then
    select * into v_limits from public.revenue_limits order by year limit 1;
  end if;
  v_binding := least(v_limits.kata_limit_huf, v_limits.vat_exemption_limit_huf);

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
    select public.revenue_region_for(p.country) as region,
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
    'kata_limit_huf',          v_limits.kata_limit_huf,
    'vat_exemption_limit_huf', v_limits.vat_exemption_limit_huf,
    'binding_limit_huf',       v_binding,
    'binding_limit_kind',      case when v_limits.vat_exemption_limit_huf < v_limits.kata_limit_huf
                                    then 'vat_exemption' else 'kata' end,
    'warning_ratio',           v_settings.revenue_warning_ratio,
    'invoiced_total_huf',      v_invoiced,
    'invoiced_by_region',      v_inv,
    'projected_renewals_huf',  v_projected,
    'projected_by_region',     v_proj,
    'projected_total_huf',     v_total,
    'usage_ratio',             round(v_total::numeric / v_binding, 4),
    'warning',                 v_total >= v_binding * v_settings.revenue_warning_ratio,
    'limit_reached',           v_total >= v_binding,
    'kata_limit_reached',      v_total >= v_limits.kata_limit_huf,
    'vat_exemption_limit_reached', v_total >= v_limits.vat_exemption_limit_huf,
    'registration_open',       v_settings.registration_open,
    'oss', jsonb_build_object(
      'eu_invoiced_huf',        (v_inv ->> 'EU')::bigint,
      'eu_projected_total_huf', v_eu_huf,
      'warning_threshold_huf',  v_settings.oss_warning_huf,
      'warning',                v_eu_huf >= v_settings.oss_warning_huf * v_settings.revenue_warning_ratio
    )
  );
end;
$$;

create or replace function public.kata_revenue_status(p_year integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Ehhez admin jogosultság szükséges.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  return public._revenue_status_internal(p_year);
end;
$$;

-- -----------------------------------------------------------------------------
-- Közösségi részvételi pontok — PRIVÁT
-- Csak a tag maga (és admin) kérheti le; nincs lista, nincs rangsor, másoknak
-- nem jelenik meg. Az aktuális tagsági ciklus kezdete óta számol (visszatérő
-- tag elölről kezd). Súlyok: app_settings.participation_weights.
-- -----------------------------------------------------------------------------
create or replace function public.participation_score(p_user uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := coalesce(p_user, auth.uid());
  v_start   timestamptz;
  v_w       jsonb;
  v_posts   integer;
  v_comments integer;
  v_helpful integer;
  v_similar integer;
  v_days    integer;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if v_uid is distinct from auth.uid() and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Más tag pontjai nem láthatók.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;

  select membership_started_at into v_start from public.profiles where id = v_uid;
  select participation_weights into strict v_w from public.app_settings where id;
  v_start := coalesce(v_start, 'infinity'::timestamptz);

  select count(*) into v_posts from public.posts
   where author_id = v_uid and kind = 'normal' and not is_hidden and created_at >= v_start;
  select count(*) into v_comments from public.comments
   where author_id = v_uid and not is_hidden and created_at >= v_start;
  select count(*) filter (where r.kind = 'koszonom'), count(*) filter (where r.kind = 'hasonlot')
    into v_helpful, v_similar
    from public.post_reactions r
    join public.posts p on p.id = r.post_id
   where p.author_id = v_uid and r.user_id <> v_uid and r.created_at >= v_start;
  select count(distinct practiced_on) into v_days from public.lesson_completions
   where user_id = v_uid and created_at >= v_start;

  return jsonb_build_object(
    'points',
        v_posts    * coalesce((v_w ->> 'post')::integer, 0)
      + v_comments * coalesce((v_w ->> 'comment')::integer, 0)
      + v_helpful  * coalesce((v_w ->> 'helpful_received')::integer, 0)
      + v_similar  * coalesce((v_w ->> 'similar_received')::integer, 0)
      + v_days     * coalesce((v_w ->> 'practice_day')::integer, 0),
    'breakdown', jsonb_build_object(
      'posts', v_posts, 'comments', v_comments,
      'helpful_received', v_helpful, 'similar_received', v_similar,
      'practice_days', v_days
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Lépcső-haladás a bejelentkezett tagnak: letelt hetek és pipált leckék aránya.
-- "Elvégezve": a lépcső nyitva van, a hetek száma letelt, és a publikált leckék
-- legalább stage_completion_min_ratio részét legalább egyszer pipálta.
-- -----------------------------------------------------------------------------
create or replace function public.stage_progress(p_stage smallint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_start   timestamptz;
  v_module  public.modules;
  v_ratio   numeric;
  v_total   integer;
  v_done    integer;
  v_week    integer;
  v_open    boolean;
begin
  select membership_started_at into v_start from public.profiles where id = v_uid;
  select * into v_module from public.modules where stage = p_stage;
  select stage_completion_min_ratio into strict v_ratio from public.app_settings where id;
  v_open := public.can_access_stage(p_stage);
  v_week := public.current_week(p_stage);

  select count(*) into v_total from public.lessons l
   where l.module_id = v_module.id and l.is_published;
  select count(distinct c.lesson_id) into v_done
    from public.lesson_completions c
    join public.lessons l on l.id = c.lesson_id
   where c.user_id = v_uid and l.module_id = v_module.id and l.is_published
     and c.created_at >= coalesce(v_start, 'infinity'::timestamptz);

  return jsonb_build_object(
    'stage', p_stage,
    'unlocked', v_open,
    'current_week', v_week,
    'total_weeks', v_module.total_weeks,
    'lessons_total', v_total,
    'lessons_completed', v_done,
    'completed', v_open
                 and coalesce(v_week, 0) > coalesce(v_module.total_weeks, 0)
                 and (v_total = 0 or v_done::numeric / v_total >= v_ratio)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Továbblépési állapot a bejelentkezett tagnak (a felület ebből kínálja fel a
-- "Továbblépés" lehetőséget). Jogosult, ha:
--   fizető tag + az előző lépcső elvégezve + (részvételi pontok elérve
--   VAGY gyorsított vásárlás VAGY Belső Kör).
-- A jogosultság csak a kérelmet nyitja meg — a lépcsőt mindig admin nyitja.
-- -----------------------------------------------------------------------------
create or replace function public.progression_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_profile   public.profiles;
  v_settings  public.app_settings;
  v_target    smallint;
  v_prev_done boolean;
  v_points    integer;
  v_required  integer;
  v_basis     text;
  v_open      public.progression_requests;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  select * into strict v_settings from public.app_settings where id;

  v_target := case
                when not v_profile.m2_unlocked then 2
                when not v_profile.ip3_unlocked then 3
                when not v_profile.retreat_unlocked then 4
              end;
  if v_target is null then
    return jsonb_build_object('target_stage', null, 'eligible', false, 'all_unlocked', true);
  end if;

  v_prev_done := (public.stage_progress((v_target - 1)::smallint) ->> 'completed')::boolean;
  v_points    := (public.participation_score() ->> 'points')::integer;
  v_required  := coalesce((v_settings.progression_points_required ->> v_target::text)::integer, 0);
  v_basis := case
               when v_profile.tier = 'belso_kor' then 'belso_kor'
               when v_target = 2 and v_profile.m2_purchased then 'purchase'
               when v_target = 3 and v_profile.ip3_purchased then 'purchase'
               when v_points >= v_required then 'participation'
             end;

  select * into v_open from public.progression_requests
   where user_id = v_uid and target_stage = v_target and status in ('requested', 'scheduled');

  return jsonb_build_object(
    'target_stage',        v_target,
    'previous_completed',  v_prev_done,
    'points',              v_points,
    'points_required',     v_required,
    'basis',               v_basis,
    'is_paying_member',    public.is_paying_member(),
    'eligible',            public.is_paying_member() and v_prev_done and v_basis is not null,
    'open_request_id',     v_open.id,
    'open_request_status', v_open.status,
    'all_unlocked',        false
  );
end;
$$;

-- A tag kéri a továbblépést (díjmentes konzultációval). Admin értesítés készül.
create or replace function public.request_progression(p_note text default null)
returns public.progression_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_status  jsonb;
  v_row     public.progression_requests;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_profile from public.profiles where id = v_uid for update;
  if v_profile.subscription_status = 'trialing' then
    raise exception 'A továbblépés a próbaidő után kérhető.' using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;

  v_status := public.progression_status();
  if (v_status ->> 'all_unlocked')::boolean then
    raise exception 'Minden lépcső nyitva van.' using errcode = 'P0001', hint = 'ALL_UNLOCKED';
  end if;
  if v_status ->> 'open_request_id' is not null then
    raise exception 'Már van folyamatban lévő kérésed, hamarosan jelentkezünk.'
      using errcode = 'P0001', hint = 'ALREADY_REQUESTED';
  end if;
  if not (v_status ->> 'eligible')::boolean then
    raise exception 'A továbblépés akkor nyílik meg, ha az előző szakaszt végigvitted.'
      using errcode = 'P0001', hint = 'NOT_ELIGIBLE';
  end if;

  insert into public.progression_requests (user_id, target_stage, note)
  values (v_uid, (v_status ->> 'target_stage')::smallint, nullif(btrim(p_note), ''))
  returning * into v_row;

  insert into public.admin_notifications (kind, payload)
  values ('progression_request', jsonb_build_object(
    'request_id', v_row.id, 'user_id', v_uid, 'target_stage', v_row.target_stage,
    'basis', v_status ->> 'basis'));

  return v_row;
end;
$$;

-- Admin döntés a konzultáció után: jóváhagyáskor nyílik a lépcső.
create or replace function public.admin_decide_progression(
  p_request_id uuid,
  p_approve    boolean,
  p_admin_note text default null
)
returns public.progression_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.progression_requests;
begin
  if not public.is_admin() then
    raise exception 'Ehhez admin jogosultság szükséges.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_row from public.progression_requests where id = p_request_id for update;
  if not found or v_row.status not in ('requested', 'scheduled') then
    raise exception 'Ez a kérés már nem nyitott.' using errcode = 'P0001', hint = 'REQUEST_NOT_OPEN';
  end if;

  if p_approve then
    update public.profiles set
      m2_unlocked      = m2_unlocked      or v_row.target_stage = 2,
      m2_unlocked_at   = case when v_row.target_stage = 2 then now() else m2_unlocked_at end,
      ip3_unlocked     = ip3_unlocked     or v_row.target_stage = 3,
      ip3_unlocked_at  = case when v_row.target_stage = 3 then now() else ip3_unlocked_at end,
      retreat_unlocked = retreat_unlocked or v_row.target_stage = 4
    where id = v_row.user_id;
  end if;

  update public.progression_requests
     set status = case when p_approve then 'approved' else 'declined' end::public.progression_status,
         admin_note = coalesce(nullif(btrim(p_admin_note), ''), admin_note),
         decided_at = now(),
         decided_by = auth.uid()
   where id = v_row.id
  returning * into v_row;
  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tagsági állapotátmenetek — CSAK service role (Stripe webhook hívja).
-- Egy helyen, atomikusan tartja karban a jogosultságokat és kereteket.
-- -----------------------------------------------------------------------------
create or replace function public._require_service_role()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Csak szerveroldalról hívható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
end;
$$;

-- 7 napos próba indul (csak havi Társasági). Próba alatt nincs díjmentes üzenet és Közlöny.
create or replace function public.membership_trial_started(p_user uuid, p_trial_end timestamptz)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  perform public._require_service_role();
  select * into v_row from public.profiles where id = p_user for update;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;
  if v_row.tier <> 'none' and v_row.subscription_status in ('active', 'trialing', 'past_due') then
    raise exception 'Már van aktív tagság.' using errcode = 'P0001', hint = 'ALREADY_MEMBER';
  end if;

  update public.profiles set
    tier = 'tarsasagi', billing_interval = 'month', subscription_status = 'trialing',
    trial_ends_at = p_trial_end, current_period_end = p_trial_end,
    membership_started_at = now(), membership_ended_at = null, past_due_since = null,
    cancel_at_period_end = false, privat_kozlony_pro = false,
    free_messages_remaining = 0, free_consultations_remaining = 0,
    m2_unlocked = false, m2_unlocked_at = null, ip3_unlocked = false, ip3_unlocked_at = null,
    retreat_unlocked = false, m2_purchased = false, ip3_purchased = false
  where id = p_user
  returning * into v_row;
  return v_row;
end;
$$;

-- Sikeres előfizetési fizetés (első fizetés, próba utáni első terhelés, megújítás, szintváltás).
--   * első fizetett időszak: díjmentes üzenetek a tier szerint + Privát Közlöny PRO azonnal
--   * Társasági -> Belső Kör: a különbözet azonnal jóváíródik
--   * Belső Kör éves: évi díjmentes konzultációk, évfordulós nullázással (nem görgethető)
--   * új tagsági ciklus (visszatérő tag): minden elölről indul
-- Idempotens: ismételt hívás nem ad újabb keretet.
create or replace function public.membership_payment_succeeded(
  p_user        uuid,
  p_tier        public.membership_tier,
  p_interval    public.billing_interval,
  p_period_end  timestamptz,
  p_amount_huf  integer
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old        public.profiles;
  v_row        public.profiles;
  v_settings   public.app_settings;
  v_new_cycle  boolean;
  v_first_paid boolean;
  v_upgrade    boolean;
  v_quota      integer;
  v_old_quota  integer;
begin
  perform public._require_service_role();
  if p_tier = 'none' then
    raise exception 'Érvénytelen tier.' using errcode = 'P0001', hint = 'INVALID_TIER';
  end if;
  select * into strict v_settings from public.app_settings where id;
  select * into v_old from public.profiles where id = p_user for update;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;

  v_new_cycle  := v_old.tier = 'none' or v_old.subscription_status not in ('active', 'past_due', 'trialing');
  v_first_paid := v_new_cycle or v_old.subscription_status = 'trialing';
  v_upgrade    := not v_first_paid and v_old.tier = 'tarsasagi' and p_tier = 'belso_kor';
  v_quota      := coalesce((v_settings.free_messages_per_tier ->> p_tier::text)::integer, 0);
  v_old_quota  := coalesce((v_settings.free_messages_per_tier ->> v_old.tier::text)::integer, 0);

  update public.profiles set
    tier                 = p_tier,
    billing_interval     = p_interval,
    subscription_status  = 'active',
    current_period_end   = p_period_end,
    recurring_amount_huf = p_amount_huf,
    past_due_since       = null,
    trial_ends_at        = case when v_first_paid then null else trial_ends_at end,
    privat_kozlony_pro   = true,
    membership_started_at = case when v_new_cycle then now() else membership_started_at end,
    membership_ended_at  = null,
    free_messages_remaining = case
      when v_first_paid then v_quota
      when v_upgrade then free_messages_remaining + greatest(v_quota - v_old_quota, 0)
      else free_messages_remaining end,
    free_consultations_remaining = case
      when p_tier = 'belso_kor' and p_interval = 'year'
           and (v_first_paid or v_upgrade or v_old.billing_interval is distinct from 'year'
                or v_old.current_period_end is distinct from p_period_end)
        then v_settings.belso_kor_yearly_consultations
      when v_new_cycle then 0
      else free_consultations_remaining end,
    consultations_period_start = case
      when p_tier = 'belso_kor' and p_interval = 'year'
           and (v_first_paid or v_upgrade or v_old.billing_interval is distinct from 'year'
                or v_old.current_period_end is distinct from p_period_end)
        then public.budapest_today()
      else consultations_period_start end,
    m2_unlocked      = case when v_new_cycle then false else m2_unlocked end,
    m2_unlocked_at   = case when v_new_cycle then null else m2_unlocked_at end,
    ip3_unlocked     = case when v_new_cycle then false else ip3_unlocked end,
    ip3_unlocked_at  = case when v_new_cycle then null else ip3_unlocked_at end,
    retreat_unlocked = case when v_new_cycle then false else retreat_unlocked end,
    m2_purchased     = case when v_new_cycle then false else m2_purchased end,
    ip3_purchased    = case when v_new_cycle then false else ip3_purchased end
  where id = p_user
  returning * into v_row;
  return v_row;
end;
$$;

-- Sikertelen megújítás: past_due, a hozzáférés past_due_grace_days napig megmarad.
-- true-t ad vissza az első sikertelen terhelésnél (ekkor megy az e-mail értesítés).
create or replace function public.membership_payment_failed(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  perform public._require_service_role();
  select * into v_row from public.profiles where id = p_user for update;
  if not found or v_row.subscription_status not in ('active', 'past_due') then
    return false;
  end if;
  update public.profiles
     set subscription_status = 'past_due', past_due_since = coalesce(past_due_since, now())
   where id = p_user;
  if v_row.past_due_since is null then
    insert into public.admin_notifications (kind, payload)
    values ('payment_failed', jsonb_build_object('user_id', p_user, 'email', v_row.email));
    return true;
  end if;
  return false;
end;
$$;

-- Tagság megszűnése (Stripe: subscription deleted / a kifizetett időszak vége):
-- a teljes rendszerhez megszűnik a hozzáférés, és visszatéréskor minden elölről indul (7.4).
-- A posztok és hozzászólások a névvel megmaradnak.
create or replace function public.membership_ended(p_user uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  perform public._require_service_role();
  update public.profiles set
    tier = 'none', subscription_status = 'canceled', membership_ended_at = now(),
    billing_interval = null, current_period_end = null, cancel_at_period_end = false,
    trial_ends_at = null, past_due_since = null, recurring_amount_huf = null,
    m2_unlocked = false, m2_unlocked_at = null, ip3_unlocked = false, ip3_unlocked_at = null,
    retreat_unlocked = false, m2_purchased = false, ip3_purchased = false,
    privat_kozlony_pro = false, free_messages_remaining = 0, free_consultations_remaining = 0,
    consultations_period_start = null, current_stage_label = null
  where id = p_user
  returning * into v_row;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;

  update public.progression_requests
     set status = 'cancelled', decided_at = now()
   where user_id = p_user and status in ('requested', 'scheduled');
  return v_row;
end;
$$;

-- Gyorsított lépcső-vásárlás rögzítése (a nyitás ettől még admin döntés).
create or replace function public.membership_stage_purchased(p_user uuid, p_code text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  perform public._require_service_role();
  if p_code not in ('gyorsitott_m2_ip2', 'gyorsitott_ip3', 'gyorsitott_m2_ip3_csomag') then
    raise exception 'Ismeretlen termékkód.' using errcode = 'P0001', hint = 'INVALID_CODE';
  end if;
  update public.profiles set
    m2_purchased  = m2_purchased  or p_code in ('gyorsitott_m2_ip2', 'gyorsitott_m2_ip3_csomag'),
    ip3_purchased = ip3_purchased or p_code in ('gyorsitott_ip3', 'gyorsitott_m2_ip3_csomag')
  where id = p_user
  returning * into v_row;
  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ütemezett feladatok (pg_cron óránként hívja; a Budapest-idő szerinti
-- ellenőrzés miatt a nyári/téli időszámítás-váltás nem okoz gondot, és a
-- futás idempotens):
--   * hó 1-jén: díjmentes Kedves Üzenet keret visszaállítása a fizető tagoknak
--   * pénteken 7:00 után: Pénteki kör poszt (a superadmin nevében)
--   * bevételi figyelmeztetés admin értesítésként (évente egyszer)
-- -----------------------------------------------------------------------------
create or replace function public.run_scheduled_tasks(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_local     timestamp := p_now at time zone 'Europe/Budapest';
  v_today     date := v_local::date;
  v_settings  public.app_settings;
  v_reset     integer := 0;
  v_friday    boolean := false;
  v_author    uuid;
  v_revenue   jsonb;
  v_warned    boolean := false;
begin
  select * into strict v_settings from public.app_settings where id for update;

  -- 1) Havi keret-visszaállítás
  if extract(day from v_local) = 1 and v_settings.last_monthly_reset_on is distinct from v_today then
    update public.profiles p
       set free_messages_remaining = coalesce((v_settings.free_messages_per_tier ->> p.tier::text)::integer, 0)
     where p.tier <> 'none'
       and (p.subscription_status = 'active'
            or (p.subscription_status = 'past_due'
                and coalesce(p.past_due_since, p_now) + make_interval(days => v_settings.past_due_grace_days) > p_now));
    get diagnostics v_reset = row_count;
    update public.app_settings set last_monthly_reset_on = v_today where id;
  end if;

  -- 2) Pénteki kör
  if extract(isodow from v_local) = 5 and extract(hour from v_local) >= 7
     and v_settings.last_friday_checkin_on is distinct from v_today then
    select id into v_author from public.profiles where role = 'superadmin' order by created_at limit 1;
    if v_author is not null then
      insert into public.posts (author_id, kind, title, body)
      values (v_author, 'penteki_kor', 'Pénteki kör · ' || to_char(v_today, 'YYYY. MM. DD.'),
              E'Néhány perc visszatekintés a hétre. Röviden is elég.\n\n'
              || E'1. Mi volt a legnehezebb idegrendszeri helyzet a héten?\n'
              || E'2. Melyik gyakorlat működött élesben?\n'
              || E'3. Miben segíthet most a társaság?');
      update public.app_settings set last_friday_checkin_on = v_today where id;
      v_friday := true;
    end if;
  end if;

  -- 3) Bevételi figyelmeztetés (évente egyszer)
  v_revenue := public._revenue_status_internal(extract(year from v_local)::integer);
  if (v_revenue ->> 'warning')::boolean and not exists (
    select 1 from public.admin_notifications n
     where n.kind = 'revenue_warning' and n.payload ->> 'year' = v_revenue ->> 'year'
  ) then
    insert into public.admin_notifications (kind, payload) values ('revenue_warning', v_revenue);
    v_warned := true;
  end if;

  return jsonb_build_object('monthly_reset_rows', v_reset, 'friday_checkin', v_friday, 'revenue_warning', v_warned);
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
                 or (p.subscription_status = 'past_due'
                     and coalesce(p.past_due_since, now()) + make_interval(days => s.past_due_grace_days) > now())) as is_active
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
grant execute on function public.participation_score(uuid) to authenticated;
grant execute on function public.stage_progress(smallint) to authenticated;
grant execute on function public.progression_status() to authenticated;
grant execute on function public.request_progression(text) to authenticated;
grant execute on function public.admin_decide_progression(uuid, boolean, text) to authenticated;
-- membership_*, run_scheduled_tasks, _revenue_status_internal: csak service_role (lent).
grant execute on function public.community_authors(uuid[]) to authenticated;
grant execute on function public.revenue_region_for(text) to authenticated;
grant execute on function public.public_open_evenings() to anon, authenticated;
-- reserve_guest_seat és confirm_registration_payment: csak service_role (lent).
grant execute on all functions in schema public to service_role;
grant select on public.post_feed to service_role;
