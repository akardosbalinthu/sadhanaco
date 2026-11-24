-- =============================================================================
-- 001_initial_schema.sql — Sadhana Idegrendszerfejlesztő Társaság
-- Táblák, típusok, segédfüggvények, RLS (ENABLE + FORCE minden táblán).
-- Kötelező érvényű specifikáció: CLAUDE.md (a 7. pont felülír mindent).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Alapértelmezett jogok szigorítása
--    A Supabase alapból minden új táblára ALL jogot ad az anon/authenticated
--    szerepköröknek. Ezt visszavonjuk; minden jogot alább, explicit adunk meg.
-- -----------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, public;

-- -----------------------------------------------------------------------------
-- 1. Típusok
-- -----------------------------------------------------------------------------
create type public.membership_tier as enum ('none', 'tarsasagi', 'belso_kor');
create type public.billing_interval as enum ('month', 'year');
-- A Stripe előfizetési státuszok tükre, plusz 'none' (soha nem volt / nincs előfizetés).
create type public.subscription_status as enum (
  'none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid',
  'incomplete', 'incomplete_expired', 'paused'
);
-- superadmin: mindent, amit az admin, és ő oszthat/vonhat meg admin szerepkört.
create type public.user_role as enum ('member', 'admin', 'superadmin');
create type public.revenue_region as enum ('HU', 'EU', 'NON_EU');
create type public.lesson_kind as enum ('video', 'audio', 'text');
create type public.post_kind as enum ('normal', 'penteki_kor');
create type public.reaction_kind as enum ('koszonom', 'hasonlot');
create type public.event_kind as enum (
  'nyilt_est',          -- havi Nyílt Meditációs Est (külsősök + tagok, 50% tagi kvóta)
  'gyakorlonap',        -- évi 4 zárt Élő Gyakorlónap
  'elvonulas',          -- évi 3 Szabadság Elvonulás (III. Modul)
  'online_meditacio',   -- heti online közös meditáció
  'qa_elo'              -- havi élő Q&A (csak Belső Kör)
);
create type public.registration_status as enum ('pending_payment', 'confirmed', 'cancelled');
create type public.kind_message_status as enum ('queued', 'scheduled', 'delivered', 'rejected');
create type public.consultation_status as enum ('requested', 'scheduled', 'done', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. Konfiguráció
-- -----------------------------------------------------------------------------

-- Egysoros beállítástábla. A 7.7-es nyitott kérdések kapcsolói is itt vannak.
create table public.app_settings (
  id                               boolean primary key default true check (id),
  -- 7.1 KATA: új jelentkezések lezárása. Az éves határok a revenue_limits táblában.
  registration_open                boolean not null default true,
  revenue_warning_ratio            numeric(4,3) not null default 0.800 check (revenue_warning_ratio > 0 and revenue_warning_ratio <= 1),
  -- 7.2 OSS: az EU-s (nem magyar) bevétel figyelmeztetési küszöbe forintban (≈ 10 000 EUR).
  -- Fizetés mindig HUF-ban, árfolyamot nem kezelünk.
  oss_warning_huf                  bigint not null default 4000000 check (oss_warning_huf > 0),
  -- Cserélhető számlázási entitás (később Kft.) és számlázó szolgáltató — soha ne legyen kódba égetve.
  billing_entity                   jsonb not null default jsonb_build_object(
                                     'name', 'Kardos Bálint egyéni vállalkozó',
                                     'tax_mode', 'AAM',
                                     'kata', true,
                                     'b2c_only', true
                                   ),
  -- 'manual': a számlát Bálint kézzel állítja ki (jelenleg), az admin utólag rögzíti a sorszámot.
  invoice_provider                 text not null default 'manual' check (invoice_provider in ('manual', 'billingo')),
  -- Ezek az e-mail-címek regisztrációkor automatikusan superadmin szerepkört kapnak.
  -- Személyes adat, ezért a migrációban nincs; telepítéskor egyszer kell beállítani (docs/telepites.md).
  superadmin_emails                text[] not null default '{}',
  terms_version                    text not null default '2026-11',
  trial_days                       smallint not null default 7 check (trial_days between 0 and 30),
  -- Események
  event_member_quota_ratio         numeric(3,2) not null default 0.50 check (event_member_quota_ratio > 0 and event_member_quota_ratio <= 1),
  belso_kor_priority_hours         smallint not null default 48 check (belso_kor_priority_hours >= 0),
  payment_hold_minutes             smallint not null default 35 check (payment_hold_minutes >= 31),  -- > Stripe Checkout 31 perc
  -- Sikertelen megújítás: a hozzáférés ennyi napig megmarad (a Stripe ezalatt újrapróbálkozik),
  -- utána szünetel. Megszűnés (és ezzel újrakezdés) csak a Stripe-előfizetés lezárásakor.
  past_due_grace_days              smallint not null default 10 check (past_due_grace_days between 0 and 30),
  -- Havi díjmentes Elsőbbségi Kedves Üzenet tierenként; Belső Kör éves díjmentes konzultációk
  -- (évfordulós nullázás, nem görgethető tovább).
  free_messages_per_tier           jsonb not null default '{"tarsasagi": 1, "belso_kor": 3}'::jsonb,
  belso_kor_yearly_consultations   smallint not null default 4 check (belso_kor_yearly_consultations >= 0),
  -- Közösségi részvételi pontok (PRIVÁT: csak a tag és az admin látja, nincs rangsor).
  participation_weights            jsonb not null default
                                     '{"post": 3, "comment": 2, "helpful_received": 1, "similar_received": 1, "practice_day": 1}'::jsonb,
  -- Továbblépési jogosultsághoz szükséges pontszám célszintenként (a nyitás így is kézi).
  progression_points_required      jsonb not null default '{"2": 60, "3": 120, "4": 0}'::jsonb,
  -- Az előző lépcső "elvégzett", ha letelt a hetek száma, és a leckék legalább ennyi részét pipálta.
  stage_completion_min_ratio       numeric(3,2) not null default 0.70 check (stage_completion_min_ratio between 0 and 1),
  -- Ütemezett feladatok utolsó futása (pg_cron, Budapest-idő szerinti ellenőrzéssel)
  last_monthly_reset_on            date,
  last_friday_checkin_on           date,
  -- Egy Kedves Üzenet: kereten felüli díj minimuma, címzett telefonszámának megőrzése (max. 180 nap)
  kind_message_min_huf             integer not null default 1000 check (kind_message_min_huf > 0),
  phone_retention_days             smallint not null default 180 check (phone_retention_days between 1 and 180),
  updated_at                       timestamptz not null default now()
);
insert into public.app_settings (id) values (true);

-- Árkonstansok (HUF). Az RPC-k és a megújulási előrejelzés innen olvas.
create table public.price_catalog (
  code             text primary key,
  label            text not null,
  amount_huf       integer not null check (amount_huf >= 0),
  tier             public.membership_tier,
  billing_interval public.billing_interval,
  stripe_product_id text,          -- az ár a Stripe-ban lookup_key = code alapján kereshető
  is_active        boolean not null default true,
  updated_at       timestamptz not null default now()
);

-- Éves bevételi határok (7.1). A ténylegesen kötő határ: least(KATA, alanyi adómentesség).
-- 2026: KATA 18 M Ft; 2027-től: KATA 22 M Ft, de az alanyi adómentesség határa 20 M Ft.
create table public.revenue_limits (
  year                     integer primary key check (year between 2020 and 2100),
  kata_limit_huf           bigint not null check (kata_limit_huf > 0),
  vat_exemption_limit_huf  bigint not null check (vat_exemption_limit_huf > 0),
  note                     text
);
insert into public.revenue_limits (year, kata_limit_huf, vat_exemption_limit_huf, note) values
  (2026, 18000000, 20000000, 'KATA 18 M Ft; alanyi adómentesség 20 M Ft (ellenőrizendő)'),
  (2027, 22000000, 20000000, 'KATA 22 M Ft; alanyi adómentesség 20 M Ft — a kötő határ 20 M Ft');

-- -----------------------------------------------------------------------------
-- 3. Tagok
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                            uuid primary key references auth.users (id) on delete cascade,
  email                         text not null unique,
  display_name                  text not null default '' check (char_length(display_name) <= 80),
  bio                           text check (char_length(bio) <= 1000),
  role                          public.user_role not null default 'member',

  -- Előfizetés (a Stripe webhook tartja karban)
  tier                          public.membership_tier not null default 'none',
  billing_interval              public.billing_interval,
  subscription_status           public.subscription_status not null default 'none',
  stripe_customer_id            text unique,
  stripe_subscription_id        text unique,
  recurring_amount_huf          integer check (recurring_amount_huf >= 0),  -- tényleges ciklusdíj (kuponnal együtt)
  current_period_end            timestamptz,
  cancel_at_period_end          boolean not null default false,
  trial_ends_at                 timestamptz,
  membership_started_at         timestamptz,   -- az aktuális tagsági ciklus kezdete (visszatérésnél újraindul)
  membership_ended_at           timestamptz,   -- nem NULL és tier='none' => volt tag
  past_due_since                timestamptz,   -- első sikertelen megújítás; sikeres fizetéskor NULL

  -- Lépcsők (7.4: visszatéréskor mind visszaáll false-ra)
  m2_unlocked                   boolean not null default false,
  m2_unlocked_at                timestamptz,
  ip3_unlocked                  boolean not null default false,
  ip3_unlocked_at               timestamptz,
  retreat_unlocked              boolean not null default false,
  m2_purchased                  boolean not null default false,  -- gyorsított vásárlás (54 940 Ft / csomag)
  ip3_purchased                 boolean not null default false,  -- gyorsított vásárlás (44 940 Ft / csomag)

  -- Keretek és ökoszisztéma
  privat_kozlony_pro            boolean not null default false,
  free_messages_remaining       smallint not null default 0 check (free_messages_remaining >= 0),
  free_consultations_remaining  smallint not null default 0 check (free_consultations_remaining >= 0),
  consultations_period_start    date,

  current_stage_label           text check (char_length(current_stage_label) <= 60),
  country                       char(2),       -- Stripe számlázási címből (ISO 3166-1 alpha-2)

  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create index profiles_status_idx on public.profiles (subscription_status, tier);

-- -----------------------------------------------------------------------------
-- 4. Segédfüggvények (RLS-ben használjuk; SECURITY DEFINER, hogy ne legyen
--    rekurzív RLS-kiértékelés a profiles táblán)
-- -----------------------------------------------------------------------------
create or replace function public.budapest_today()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'Europe/Budapest')::date $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')
  )
$$;

create or replace function public.is_superadmin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'superadmin'
  )
$$;

-- Aktív hozzáférés a rendszerhez (tananyag + közösség). Próbaidő is ide tartozik.
create or replace function public.has_member_access()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    cross join public.app_settings s
    where p.id = (select auth.uid())
      and p.tier <> 'none'
      and (
        p.subscription_status in ('active', 'trialing')
        or (p.subscription_status = 'past_due'
            and coalesce(p.past_due_since, now()) + make_interval(days => s.past_due_grace_days) > now())
      )
  )
$$;

-- Teljes jogú (fizető) tag: próbaidő NEM számít. Foglalás, díjmentes keretek ehhez kötöttek.
create or replace function public.is_paying_member()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    cross join public.app_settings s
    where p.id = (select auth.uid())
      and p.tier <> 'none'
      and (
        p.subscription_status = 'active'
        or (p.subscription_status = 'past_due'
            and coalesce(p.past_due_since, now()) + make_interval(days => s.past_due_grace_days) > now())
      )
  )
$$;

-- Lépcső-hozzáférés (CLAUDE.md 4. pont). Admin mindent lát.
create or replace function public.can_access_stage(p_stage smallint)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and public.has_member_access()
      and case p_stage
            when 1 then true
            when 2 then p.m2_unlocked       -- mindig admin kézi jóváhagyás
            when 3 then p.ip3_unlocked      -- mindig admin kézi jóváhagyás
            when 4 then p.retreat_unlocked  -- IP 3 után, admin jóváhagyás
            else false
          end
  )
$$;

-- A tag aktuális hete egy lépcsőn belül (1-től). NULL, ha a lépcső nincs nyitva.
-- 1. lépcső: az egyéni belépés (aktuális tagsági ciklus kezdete) napjától.
-- 2–3. lépcső: az admin általi nyitás napjától számolva.
create or replace function public.current_week(p_stage smallint)
returns integer
language sql stable security definer
set search_path = ''
as $$
  select case
           when start_date is null or start_date > public.budapest_today() then null
           else ((public.budapest_today() - start_date) / 7) + 1
         end
  from (
    select case p_stage
             when 1 then (p.membership_started_at at time zone 'Europe/Budapest')::date
             when 2 then (p.m2_unlocked_at at time zone 'Europe/Budapest')::date
             when 3 then (p.ip3_unlocked_at at time zone 'Europe/Budapest')::date
             else null
           end as start_date
    from public.profiles p
    where p.id = (select auth.uid())
  ) x
$$;

-- -----------------------------------------------------------------------------
-- 5. Számlázás és megfelelés
-- -----------------------------------------------------------------------------

-- Stripe webhook idempotencia: az event id a kulcs.
create table public.stripe_events (
  id            text primary key,         -- evt_...
  type          text not null,
  payload       jsonb not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  error         text
);

-- Számlázandó / kiállított AAM számlák (a KATA- és OSS-összesítő alapja).
-- Sztornó nincs (üzleti döntés: nincs visszatérítés, lemondás a következő ciklustól).
create table public.invoices (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.profiles (id) on delete set null,  -- a számla jogilag megmarad
  stripe_invoice_id         text unique,
  stripe_payment_intent_id  text,
  product_code              text references public.price_catalog (code),
  description               text not null,
  amount_huf                bigint not null check (amount_huf > 0),  -- bruttó = nettó (AAM)
  currency                  char(3) not null default 'HUF',
  country                   char(2) not null,    -- Stripe számlázási cím
  region                    public.revenue_region not null,
  invoice_provider          text not null default 'manual',    -- manual / billingo / szamlazz
  provider_invoice_id       text,                -- a szolgáltató belső azonosítója
  provider_invoice_number   text,                -- a számla sorszáma
  billing_entity            jsonb not null,      -- a kiállító entitás pillanatképe
  issued_at                 timestamptz not null default now(),
  created_at                timestamptz not null default now(),
  unique (invoice_provider, provider_invoice_number)
);
create index invoices_issued_idx on public.invoices (issued_at);
create index invoices_user_idx on public.invoices (user_id);

-- 7.3: egy e-mail és egy kártya csak egyszer kaphat próbát.
create table public.trial_usage (
  id                      uuid primary key default gen_random_uuid(),
  email_normalized        text not null unique check (email_normalized = lower(btrim(email_normalized))),
  card_fingerprint        text unique,
  user_id                 uuid references public.profiles (id) on delete set null,
  stripe_subscription_id  text,
  used_at                 timestamptz not null default now()
);

-- 7.2: azonnali teljesítés kérése + 14 napos elállási jogról való lemondás.
create table public.purchase_consents (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.profiles (id) on delete set null,
  email                       text not null,
  consent_kind                text not null default 'immediate_performance_withdrawal_waiver'
                                check (consent_kind in ('immediate_performance_withdrawal_waiver')),
  product_code                text references public.price_catalog (code),
  terms_version               text not null,
  stripe_checkout_session_id  text,
  consented_at                timestamptz not null default now(),
  ip_address                  inet,
  user_agent                  text
);
create index purchase_consents_user_idx on public.purchase_consents (user_id);

-- Admin értesítések (chargeback, KATA-figyelmeztetés). Nem push, csak az admin felületen.
create table public.admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in (
                'chargeback', 'revenue_warning', 'payment_failed', 'progression_request', 'overbooking', 'other')),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

-- -----------------------------------------------------------------------------
-- 6. Tananyag
-- -----------------------------------------------------------------------------
create table public.modules (
  id           uuid primary key default gen_random_uuid(),
  stage        smallint not null unique check (stage between 1 and 4),
  slug         text not null unique,
  title        text not null,
  subtitle     text,
  description  text,
  total_weeks  smallint check (total_weeks between 1 and 9),
  created_at   timestamptz not null default now()
);

create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules (id) on delete restrict,
  week_number       smallint not null check (week_number between 1 and 9),
  sort_order        smallint not null default 0,
  kind              public.lesson_kind not null,
  title             text not null,
  description       text,
  bunny_video_id    text,   -- a lejátszási URL-t szerveroldalon, időkorlátos aláírással képezzük
  duration_seconds  integer check (duration_seconds > 0),
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);
create index lessons_module_week_idx on public.lessons (module_id, week_number, sort_order);

create or replace function public.can_access_lesson(p_module_id uuid, p_week smallint)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.modules m
    where m.id = p_module_id
      and public.can_access_stage(m.stage)
      and (m.stage = 4 or coalesce(public.current_week(m.stage), 0) >= p_week)
  )
$$;

-- Napi gyakorlás-pipálás.
create table public.lesson_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  practiced_on  date not null default public.budapest_today(),
  created_at    timestamptz not null default now(),
  unique (user_id, lesson_id, practiced_on)
);

-- -----------------------------------------------------------------------------
-- 7. Közösség ("Tapasztalat, nem tanácsadás")
-- -----------------------------------------------------------------------------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid default auth.uid() references public.profiles (id) on delete set null,
  kind        public.post_kind not null default 'normal',
  title       text check (char_length(title) <= 200),
  body        text not null check (char_length(body) between 1 and 10000),
  is_hidden   boolean not null default false,   -- admin moderáció
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);
create index posts_created_idx on public.posts (created_at desc);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid default auth.uid() references public.profiles (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 5000),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.post_reactions (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind        public.reaction_kind not null,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

-- -----------------------------------------------------------------------------
-- 8. Események
-- -----------------------------------------------------------------------------
create table public.events (
  id                       uuid primary key default gen_random_uuid(),
  kind                     public.event_kind not null,
  title                    text not null,
  description              text,
  location                 text,
  is_online                boolean not null default false,
  starts_at                timestamptz not null,
  ends_at                  timestamptz,
  capacity                 integer check (capacity > 0),          -- NULL = korlátlan (pl. online)
  member_quota_ratio       numeric(3,2) check (member_quota_ratio > 0 and member_quota_ratio <= 1),
                                                                  -- NULL = members_only ? 1.0 : app_settings
  members_only             boolean not null default true,
  allowed_tiers            public.membership_tier[] not null default array['tarsasagi', 'belso_kor']::public.membership_tier[],
  requires_retreat_unlock  boolean not null default false,
  belso_kor_priority       boolean not null default true,         -- 48 órás Belső Kör előfoglalás
  registration_opens_at    timestamptz not null,
  registration_closes_at   timestamptz,
  price_external_huf       integer check (price_external_huf >= 0),
  price_tarsasagi_huf      integer not null default 0 check (price_tarsasagi_huf >= 0),
  price_belso_kor_huf      integer not null default 0 check (price_belso_kor_huf >= 0),
  is_published             boolean not null default false,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (not ('none' = any(allowed_tiers)))
);
create index events_starts_idx on public.events (starts_at);

create table public.event_registrations (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events (id) on delete cascade,
  user_id          uuid references public.profiles (id) on delete cascade,  -- NULL = külsős vendég
  guest_name       text,
  guest_email      text,
  is_member_seat   boolean not null,   -- a tagi kvótába számít-e
  tier_at_booking  public.membership_tier,
  price_huf        integer not null default 0 check (price_huf >= 0),
  status           public.registration_status not null,
  hold_expires_at  timestamptz,        -- pending_payment esetén a helyfoglalás lejárata
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz,
  check ((user_id is not null and is_member_seat) or (user_id is null and guest_email is not null and not is_member_seat)),
  check (status <> 'pending_payment' or hold_expires_at is not null)
);
create unique index event_registrations_one_active_per_user
  on public.event_registrations (event_id, user_id)
  where user_id is not null and status <> 'cancelled';
create unique index event_registrations_one_active_per_guest
  on public.event_registrations (event_id, lower(guest_email))
  where user_id is null and status <> 'cancelled';
create index event_registrations_event_idx on public.event_registrations (event_id, status);

-- -----------------------------------------------------------------------------
-- 9. Egy Kedves Üzenet és konzultáció
-- -----------------------------------------------------------------------------
create table public.kind_messages (
  id               uuid primary key default gen_random_uuid(),
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  recipient_name   text not null check (char_length(recipient_name) between 1 and 120),
  recipient_phone  text check (char_length(recipient_phone) between 6 and 30),  -- max. 180 nap után törlődik
  phone_purged_at  timestamptz,
  message          text not null check (char_length(message) between 1 and 2000),
  is_free          boolean not null,    -- havi díjmentes Elsőbbségi Kedves Üzenet
  amount_huf       integer not null default 0 check (amount_huf >= 0),
  invoice_id       uuid references public.invoices (id),
  status           public.kind_message_status not null default 'queued',
  created_at       timestamptz not null default now(),
  delivered_at     timestamptz,
  check ((is_free and amount_huf = 0) or (not is_free and amount_huf > 0)),
  check (recipient_phone is not null or phone_purged_at is not null)
);
-- Feldolgozási sorrend: díjmentes elsőbbségi üzenetek, majd összeg szerint csökkenő.
create index kind_messages_queue_idx on public.kind_messages (status, is_free desc, amount_huf desc, created_at);

create table public.consultations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  requested_for   timestamptz,
  note            text check (char_length(note) <= 2000),
  is_free         boolean not null,
  price_huf       integer not null default 0 check (price_huf >= 0),
  invoice_id      uuid references public.invoices (id),
  status          public.consultation_status not null default 'requested',
  created_at      timestamptz not null default now(),
  check ((is_free and price_huf = 0) or (not is_free and price_huf > 0))
);

-- -----------------------------------------------------------------------------
-- 9/b. Továbblépés a következő lépcsőre
-- A rendszer jelzi a jogosultságot (előző lépcső elvégezve + részvételi pontok vagy
-- gyorsított vásárlás vagy Belső Kör), a tag kéri a továbblépést, ehhez egy rövid,
-- díjmentes konzultáció tartozik Bálinttal, és a nyitás MINDIG admin kézi döntése.
-- -----------------------------------------------------------------------------
create type public.progression_status as enum ('requested', 'scheduled', 'approved', 'declined', 'cancelled');

create table public.progression_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  target_stage     smallint not null check (target_stage between 2 and 4),
  status           public.progression_status not null default 'requested',
  note             text check (char_length(note) <= 2000),
  consultation_at  timestamptz,          -- a díjmentes továbblépési konzultáció időpontja
  admin_note       text,
  decided_at       timestamptz,
  decided_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);
create unique index progression_requests_one_open
  on public.progression_requests (user_id, target_stage)
  where status in ('requested', 'scheduled');

-- -----------------------------------------------------------------------------
-- 10. Triggerek
-- -----------------------------------------------------------------------------

-- Új auth felhasználó => profil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when lower(new.email) = any (select lower(e) from public.app_settings s, unnest(s.superadmin_emails) e)
         then 'superadmin' else 'member' end::public.user_role
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();
create trigger price_catalog_touch before update on public.price_catalog
  for each row execute function public.touch_updated_at();

-- A tag a saját profiljában csak a display_name és bio mezőt módosíthatja.
-- Minden jogosultsági mezőt csak admin, a service role vagy SECURITY DEFINER RPC írhat.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and new.role is distinct from old.role
     and not public.is_superadmin() then
    raise exception 'Szerepkört csak superadmin módosíthat.' using errcode = '42501';
  end if;
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (to_jsonb(new) - array['display_name', 'bio', 'updated_at'])
       is distinct from (to_jsonb(old) - array['display_name', 'bio', 'updated_at']) then
      raise exception 'Ezt a mezőt nem módosíthatod.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Poszt/hozzászólás: a szerző csak a szöveget szerkesztheti; elrejteni csak admin tud.
create or replace function public.guard_content_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.author_id is distinct from old.author_id
       or new.is_hidden is distinct from old.is_hidden
       or new.created_at is distinct from old.created_at
       or (tg_table_name = 'posts' and (to_jsonb(new) ->> 'kind') is distinct from (to_jsonb(old) ->> 'kind'))
       or (tg_table_name = 'comments' and (to_jsonb(new) ->> 'post_id') is distinct from (to_jsonb(old) ->> 'post_id')) then
      raise exception 'Csak a szöveget szerkesztheted.' using errcode = '42501';
    end if;
  end if;
  if new.body is distinct from old.body
     or (tg_table_name = 'posts' and (to_jsonb(new) ->> 'title') is distinct from (to_jsonb(old) ->> 'title')) then
    new.edited_at := now();
  end if;
  return new;
end;
$$;
create trigger posts_guard before update on public.posts
  for each row execute function public.guard_content_update();
create trigger comments_guard before update on public.comments
  for each row execute function public.guard_content_update();

-- Rögzített számlatétel nem módosítható; utólag csak a szolgáltatói azonosító / sorszám írható
-- (kézi számlázásnál az admin itt rögzíti a kiállított számla sorszámát).
create or replace function public.guard_invoice_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - array['provider_invoice_id', 'provider_invoice_number'])
     is distinct from (to_jsonb(old) - array['provider_invoice_id', 'provider_invoice_number']) then
    raise exception 'Rögzített számlatétel nem módosítható; csak a számla sorszáma írható be.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger invoices_guard before update on public.invoices
  for each row execute function public.guard_invoice_update();

-- Kereten felüli Kedves Üzenet: legalább app_settings.kind_message_min_huf (1 000 Ft).
create or replace function public.guard_kind_message_amount()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_min integer;
begin
  if not new.is_free then
    select kind_message_min_huf into v_min from public.app_settings where id;
    if new.amount_huf < v_min then
      raise exception 'A Kedves Üzenet díja legalább % Ft.', v_min
        using errcode = 'P0001', hint = 'AMOUNT_TOO_LOW';
    end if;
  end if;
  return new;
end;
$$;
create trigger kind_messages_amount before insert or update of amount_huf, is_free on public.kind_messages
  for each row execute function public.guard_kind_message_amount();

-- -----------------------------------------------------------------------------
-- 11. Row Level Security — ENABLE + FORCE minden táblán
-- -----------------------------------------------------------------------------
alter table public.app_settings        enable row level security;
alter table public.price_catalog       enable row level security;
alter table public.profiles            enable row level security;
alter table public.stripe_events       enable row level security;
alter table public.invoices            enable row level security;
alter table public.trial_usage         enable row level security;
alter table public.purchase_consents   enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.modules             enable row level security;
alter table public.lessons             enable row level security;
alter table public.lesson_completions  enable row level security;
alter table public.posts               enable row level security;
alter table public.comments            enable row level security;
alter table public.post_reactions      enable row level security;
alter table public.events              enable row level security;
alter table public.event_registrations enable row level security;
alter table public.kind_messages       enable row level security;
alter table public.consultations       enable row level security;
alter table public.revenue_limits      enable row level security;
alter table public.progression_requests enable row level security;

alter table public.app_settings        force row level security;
alter table public.price_catalog       force row level security;
alter table public.profiles            force row level security;
alter table public.stripe_events       force row level security;
alter table public.invoices            force row level security;
alter table public.trial_usage         force row level security;
alter table public.purchase_consents   force row level security;
alter table public.admin_notifications force row level security;
alter table public.modules             force row level security;
alter table public.lessons             force row level security;
alter table public.lesson_completions  force row level security;
alter table public.posts               force row level security;
alter table public.comments            force row level security;
alter table public.post_reactions      force row level security;
alter table public.events              force row level security;
alter table public.event_registrations force row level security;
alter table public.kind_messages       force row level security;
alter table public.consultations       force row level security;
alter table public.revenue_limits      force row level security;
alter table public.progression_requests force row level security;

-- app_settings: minden bejelentkezett olvashatja, csak admin írja.
create policy app_settings_select on public.app_settings
  for select to authenticated using (true);
create policy app_settings_admin_update on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- price_catalog: nyilvános árlista (anon is), csak admin írja.
create policy price_catalog_select_anon on public.price_catalog
  for select to anon using (is_active);
create policy price_catalog_select on public.price_catalog
  for select to authenticated using (is_active or public.is_admin());
create policy price_catalog_admin_all on public.price_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles: saját sor; admin mindent. Más tagok adatai csak community_authors()-on át.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- stripe_events, trial_usage: csak admin olvashatja; írni csak a service role (BYPASSRLS).
create policy stripe_events_admin_select on public.stripe_events
  for select to authenticated using (public.is_admin());
create policy trial_usage_admin_select on public.trial_usage
  for select to authenticated using (public.is_admin());

-- invoices: saját számlák olvasása; admin mindent lát. Írás: service role / admin RPC.
create policy invoices_select on public.invoices
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
-- Kézi számlázásnál az admin utólag rögzíti a sorszámot (oszlopszintű jog lent; összeg nem írható).
create policy invoices_admin_update on public.invoices
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- purchase_consents: saját hozzájárulás olvasása; admin mindent lát.
create policy purchase_consents_select on public.purchase_consents
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- admin_notifications: csak admin.
create policy admin_notifications_select on public.admin_notifications
  for select to authenticated using (public.is_admin());
create policy admin_notifications_update on public.admin_notifications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- modules: a teljes ív látszik minden aktív tagnak (lakattal a zárt lépcsőknél).
create policy modules_select on public.modules
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy modules_admin_all on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- lessons: csak a nyitott lépcső már elérhető hetei.
create policy lessons_select on public.lessons
  for select to authenticated
  using (public.is_admin() or (is_published and public.can_access_lesson(module_id, week_number)));
create policy lessons_admin_all on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- lesson_completions: csak saját; pipálni csak elérhető leckét lehet.
create policy lesson_completions_select on public.lesson_completions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy lesson_completions_insert on public.lesson_completions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.has_member_access()
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.is_published and public.can_access_lesson(l.module_id, l.week_number)
    )
  );
create policy lesson_completions_delete on public.lesson_completions
  for delete to authenticated using (user_id = (select auth.uid()));

-- posts / comments: aktív tagok olvassák és írják (próbaidő is). Rejtett tartalmat csak admin és a szerző lát.
create policy posts_select on public.posts
  for select to authenticated
  using (public.is_admin() or (public.has_member_access() and (not is_hidden or author_id = (select auth.uid()))));
create policy posts_insert on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_member_access()
    and not is_hidden
    and (kind = 'normal' or public.is_admin())
  );
create policy posts_update on public.posts
  for update to authenticated
  using (public.is_admin() or (author_id = (select auth.uid()) and public.has_member_access()))
  with check (public.is_admin() or author_id = (select auth.uid()));
create policy posts_delete on public.posts
  for delete to authenticated
  using (public.is_admin() or (author_id = (select auth.uid()) and public.has_member_access()));

create policy comments_select on public.comments
  for select to authenticated
  using (
    public.is_admin()
    or (public.has_member_access() and (not is_hidden or author_id = (select auth.uid()))
        and exists (select 1 from public.posts p where p.id = post_id))
  );
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_member_access()
    and not is_hidden
    and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden)
  );
create policy comments_update on public.comments
  for update to authenticated
  using (public.is_admin() or (author_id = (select auth.uid()) and public.has_member_access()))
  with check (public.is_admin() or author_id = (select auth.uid()));
create policy comments_delete on public.comments
  for delete to authenticated
  using (public.is_admin() or (author_id = (select auth.uid()) and public.has_member_access()));

-- post_reactions: aktív tagok látják; csak a sajátját teheti/veheti el.
create policy post_reactions_select on public.post_reactions
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy post_reactions_insert on public.post_reactions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_member_access()
              and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden));
create policy post_reactions_delete on public.post_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- events: aktív tagok látják a publikált eseményeket; az elvonulást csak a jogosultak.
create policy events_select on public.events
  for select to authenticated
  using (
    public.is_admin()
    or (is_published and public.has_member_access()
        and (not requires_retreat_unlock or public.can_access_stage(4::smallint)))
  );
create policy events_admin_all on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- event_registrations: saját foglalás olvasása. Foglalni csak a book_event() RPC-vel lehet.
create policy event_registrations_select on public.event_registrations
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy event_registrations_admin_update on public.event_registrations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- kind_messages: saját üzenetek. Díjmentes üzenetet csak RPC-vel, fizetőset a webhook rögzít.
create policy kind_messages_select on public.kind_messages
  for select to authenticated using (sender_id = (select auth.uid()) or public.is_admin());
create policy kind_messages_admin_update on public.kind_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- consultations: saját foglalások. Díjmentes alkalmat csak RPC-vel lehet foglalni.
create policy consultations_select on public.consultations
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy consultations_admin_update on public.consultations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- revenue_limits: csak admin.
create policy revenue_limits_admin_select on public.revenue_limits
  for select to authenticated using (public.is_admin());
create policy revenue_limits_admin_write on public.revenue_limits
  for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- progression_requests: saját kérelmek olvasása; létrehozás csak request_progression() RPC-vel,
-- döntés csak admin_decide_progression() RPC-vel; az admin az időpontot/megjegyzést írhatja.
create policy progression_requests_select on public.progression_requests
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy progression_requests_admin_update on public.progression_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 12. Tábla- és oszlopszintű jogok (az RLS mellett második védelmi vonal)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.price_catalog to anon;

grant select, update on public.app_settings to authenticated;
grant select, insert, update, delete on public.price_catalog to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.stripe_events to authenticated;
grant select on public.invoices to authenticated;
grant update (provider_invoice_id, provider_invoice_number) on public.invoices to authenticated;
grant select on public.trial_usage to authenticated;
grant select on public.purchase_consents to authenticated;
grant select, update on public.admin_notifications to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, delete on public.lesson_completions to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.post_reactions to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, update on public.event_registrations to authenticated;
grant select, update on public.kind_messages to authenticated;
grant select, update on public.consultations to authenticated;
grant select, insert, update, delete on public.revenue_limits to authenticated;
grant select on public.progression_requests to authenticated;
grant update (consultation_at, admin_note, status) on public.progression_requests to authenticated;

grant all on all tables in schema public to service_role;

-- Függvények: alapból senki; amit a kliens hívhat, azt explicit engedjük.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.budapest_today() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.has_member_access() to authenticated;
grant execute on function public.is_paying_member() to authenticated;
grant execute on function public.can_access_stage(smallint) to authenticated;
grant execute on function public.current_week(smallint) to authenticated;
grant execute on function public.can_access_lesson(uuid, smallint) to authenticated;
grant execute on all functions in schema public to service_role;
