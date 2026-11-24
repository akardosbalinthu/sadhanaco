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
create type public.user_role as enum ('member', 'admin');
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
  -- 7.1 KATA: új jelentkezések lezárása
  registration_open                boolean not null default true,
  kata_annual_limit_huf            bigint  not null default 18000000 check (kata_annual_limit_huf > 0),
  kata_warning_ratio               numeric(4,3) not null default 0.800 check (kata_warning_ratio > 0 and kata_warning_ratio <= 1),
  -- 7.2 OSS-határ figyelése
  oss_limit_eur                    numeric(12,2) not null default 10000,
  eur_huf_rate                     numeric(10,4) not null default 400 check (eur_huf_rate > 0),
  -- Cserélhető számlázási entitás (később Kft.) — soha ne legyen kódba égetve.
  billing_entity                   jsonb not null default jsonb_build_object(
                                     'name', 'Kardos Bálint egyéni vállalkozó',
                                     'tax_mode', 'AAM',
                                     'kata', true,
                                     'b2c_only', true
                                   ),
  terms_version                    text not null default '2026-11',
  trial_days                       smallint not null default 7 check (trial_days between 0 and 30),
  -- Események
  event_member_quota_ratio         numeric(3,2) not null default 0.50 check (event_member_quota_ratio > 0 and event_member_quota_ratio <= 1),
  belso_kor_priority_hours         smallint not null default 48 check (belso_kor_priority_hours >= 0),
  payment_hold_minutes             smallint not null default 30 check (payment_hold_minutes > 0),
  -- NYITOTT (7.7): heti nyitás egyéni belépéstől vagy kohorsz-indulástól
  lesson_unlock_mode               text not null default 'individual' check (lesson_unlock_mode in ('individual', 'cohort')),
  cohort_start_date                date,
  -- NYITOTT: past_due (sikertelen megújítás, Stripe újrapróbálkozik) alatt marad-e a hozzáférés
  past_due_has_access              boolean not null default true,
  -- NYITOTT (7.7): kereten felüli Kedves Üzenet / Nyílt Est hozzájárulás = szabad összegű szolgáltatási díj AAM számlával
  voluntary_fees_are_service       boolean not null default true,
  -- NYITOTT (7.7): Belső Kör éves konzultációs keret nullázása és a maradék sorsa
  consultation_reset_mode          text not null default 'anniversary' check (consultation_reset_mode in ('anniversary', 'calendar_year')),
  consultation_carry_over          boolean not null default false,
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
  is_active        boolean not null default true,
  updated_at       timestamptz not null default now()
);

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
  cohort_start_date             date,          -- kohorsz mód esetén egyéni felülírás

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
    where p.id = (select auth.uid()) and p.role = 'admin'
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
        or (p.subscription_status = 'past_due' and s.past_due_has_access)
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
        or (p.subscription_status = 'past_due' and s.past_due_has_access)
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
-- 1. lépcső: app_settings.lesson_unlock_mode szerint (egyéni belépés / kohorsz).
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
             when 1 then case s.lesson_unlock_mode
                           when 'cohort' then coalesce(p.cohort_start_date, s.cohort_start_date)
                           else (p.membership_started_at at time zone 'Europe/Budapest')::date
                         end
             when 2 then (p.m2_unlocked_at at time zone 'Europe/Budapest')::date
             when 3 then (p.ip3_unlocked_at at time zone 'Europe/Budapest')::date
             else null
           end as start_date
    from public.profiles p
    cross join public.app_settings s
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

-- Kiállított AAM e-számlák. Sztornó negatív összeggel, az eredetire hivatkozva.
create table public.invoices (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.profiles (id) on delete set null,  -- a számla jogilag megmarad
  stripe_invoice_id         text unique,
  stripe_payment_intent_id  text,
  product_code              text references public.price_catalog (code),
  description               text not null,
  amount_huf                bigint not null,     -- bruttó = nettó (AAM); sztornónál negatív
  currency                  char(3) not null default 'HUF',
  country                   char(2) not null,    -- Stripe számlázási cím
  region                    public.revenue_region not null,
  szamlazz_invoice_number   text unique,
  billing_entity            jsonb not null,      -- a kiállító entitás pillanatképe
  issued_at                 timestamptz not null default now(),
  is_storno                 boolean not null default false,
  storno_of                 uuid unique references public.invoices (id),
  storno_reason             text,
  created_by                uuid references public.profiles (id) on delete set null,
  created_at                timestamptz not null default now(),
  constraint invoices_storno_consistency check (
    (is_storno and storno_of is not null and amount_huf < 0 and storno_reason is not null)
    or (not is_storno and storno_of is null and amount_huf > 0)
  )
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
  kind        text not null check (kind in ('chargeback', 'kata_warning', 'oss_warning', 'other')),
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
create index event_registrations_event_idx on public.event_registrations (event_id, status);

-- -----------------------------------------------------------------------------
-- 9. Egy Kedves Üzenet és konzultáció
-- -----------------------------------------------------------------------------
create table public.kind_messages (
  id               uuid primary key default gen_random_uuid(),
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  recipient_name   text not null check (char_length(recipient_name) between 1 and 120),
  recipient_phone  text not null check (char_length(recipient_phone) between 6 and 30),
  message          text not null check (char_length(message) between 1 and 2000),
  is_free          boolean not null,    -- havi díjmentes Elsőbbségi Kedves Üzenet
  amount_huf       integer not null default 0 check (amount_huf >= 0),
  invoice_id       uuid references public.invoices (id),
  status           public.kind_message_status not null default 'queued',
  created_at       timestamptz not null default now(),
  delivered_at     timestamptz,
  check ((is_free and amount_huf = 0) or (not is_free and amount_huf > 0))
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
-- 10. Triggerek
-- -----------------------------------------------------------------------------

-- Új auth felhasználó => profil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
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

-- Számla csak sztornóval javítható: kiállított számla összege/adatai nem írhatók át.
create or replace function public.guard_invoice_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.amount_huf is distinct from old.amount_huf
     or new.country is distinct from old.country
     or new.region is distinct from old.region
     or new.billing_entity is distinct from old.billing_entity
     or new.issued_at is distinct from old.issued_at
     or new.is_storno is distinct from old.is_storno
     or new.storno_of is distinct from old.storno_of then
    raise exception 'Kiállított számla nem módosítható; hibás számlát admin sztornóval javíts.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger invoices_guard before update on public.invoices
  for each row execute function public.guard_invoice_update();

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

grant all on all tables in schema public to service_role;

-- Függvények: alapból senki; amit a kliens hívhat, azt explicit engedjük.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.budapest_today() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_member_access() to authenticated;
grant execute on function public.is_paying_member() to authenticated;
grant execute on function public.can_access_stage(smallint) to authenticated;
grant execute on function public.current_week(smallint) to authenticated;
grant execute on function public.can_access_lesson(uuid, smallint) to authenticated;
grant execute on all functions in schema public to service_role;
