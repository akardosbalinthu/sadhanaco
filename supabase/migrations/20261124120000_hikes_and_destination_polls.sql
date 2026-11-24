-- =============================================================================
-- 004 — Havi közös túra + úti cél szavazás + vendégmeghívó
-- Havonta egy közös túra a Társaság tagjaival, Magyarországon. A következő úti
-- célt mindig a Társaság szavazza meg: hónaponként egy szavazás, Bálint 5–10
-- úti célt ír ki. A szavazás állása a lezárásig nem látszik (nincs „verseny”,
-- nincs nyomás) — csak a saját szavazatodat látod.
-- A túra a tagoknak ingyenes; Társaságon kívüliek csak meghívóval jöhetnek,
-- és számukra is ingyenes.
-- =============================================================================

alter type public.event_kind add value if not exists 'tura';

create table public.destination_polls (
  id                 uuid primary key default gen_random_uuid(),
  month              date not null unique check (month = date_trunc('month', month)::date),  -- hónaponként egy
  title              text not null check (char_length(title) between 1 and 200),
  description        text check (char_length(description) <= 2000),
  opens_at           timestamptz not null default now(),
  closes_at          timestamptz not null,
  winning_option_id  uuid,
  event_id           uuid references public.events (id) on delete set null,  -- a kiírt túra
  created_at         timestamptz not null default now(),
  check (closes_at >= opens_at)
);

create table public.destination_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.destination_polls (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (char_length(description) <= 1000),
  created_at   timestamptz not null default now(),
  unique (id, poll_id)
);

alter table public.destination_polls
  add constraint destination_polls_winning_option_fkey
  foreign key (winning_option_id) references public.destination_options (id) on delete set null;

create table public.destination_votes (
  poll_id     uuid not null references public.destination_polls (id) on delete cascade,
  option_id   uuid not null,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (poll_id, user_id),
  -- a választott lehetőség ugyanahhoz a szavazáshoz tartozzon
  foreign key (option_id, poll_id) references public.destination_options (id, poll_id) on delete cascade
);

-- Egy szavazáson legfeljebb 10 úti cél lehet.
create or replace function public.guard_destination_option_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.destination_polls where id = new.poll_id for update;
  if (select count(*) from public.destination_options o where o.poll_id = new.poll_id) >= 10 then
    raise exception 'Egy szavazáson legfeljebb 10 úti cél lehet.' using errcode = 'P0001', hint = 'TOO_MANY_OPTIONS';
  end if;
  return new;
end;
$$;
create trigger destination_options_limit before insert on public.destination_options
  for each row execute function public.guard_destination_option_limit();

-- RLS — ENABLE + FORCE
alter table public.destination_polls   enable row level security;
alter table public.destination_options enable row level security;
alter table public.destination_votes   enable row level security;
alter table public.destination_polls   force row level security;
alter table public.destination_options force row level security;
alter table public.destination_votes   force row level security;

create policy destination_polls_select on public.destination_polls
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy destination_polls_admin_all on public.destination_polls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy destination_options_select on public.destination_options
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy destination_options_admin_all on public.destination_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Szavazat: csak a sajátodat látod; leadni/módosítani csak RPC-vel lehet.
create policy destination_votes_select_own on public.destination_votes
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Szavazás (a lezárásig módosítható). Minden aktív tag szavazhat, a próbaidős is.
create or replace function public.cast_destination_vote(p_poll_id uuid, p_option_id uuid)
returns public.destination_votes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_poll public.destination_polls;
  v_row  public.destination_votes;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if not public.has_member_access() then
    raise exception 'Szavazni a Társaság tagjai tudnak.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id for update;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;
  if now() < v_poll.opens_at or now() >= v_poll.closes_at or v_poll.winning_option_id is not null then
    raise exception 'Ez a szavazás most nem nyitott.' using errcode = 'P0001', hint = 'POLL_CLOSED';
  end if;
  if (select count(*) from public.destination_options o where o.poll_id = p_poll_id) not between 5 and 10 then
    raise exception 'A szavazás akkor indul, ha legalább 5 úti cél fel van véve.' using errcode = 'P0001', hint = 'POLL_NOT_READY';
  end if;
  if not exists (select 1 from public.destination_options o where o.id = p_option_id and o.poll_id = p_poll_id) then
    raise exception 'Ez a lehetőség nem ehhez a szavazáshoz tartozik.' using errcode = 'P0001', hint = 'INVALID_OPTION';
  end if;

  insert into public.destination_votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, v_uid)
  on conflict (poll_id, user_id) do update set option_id = excluded.option_id, updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

-- Eredmény: csak lezárt szavazásnál (vagy adminnak) — közben nincs állás.
create or replace function public.destination_poll_results(p_poll_id uuid)
returns table (option_id uuid, name text, votes integer, is_winner boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_poll public.destination_polls;
begin
  if not (public.has_member_access() or public.is_admin()) then
    raise exception 'Csak a Társaság tagjai láthatják.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;
  if not public.is_admin() and now() < v_poll.closes_at and v_poll.winning_option_id is null then
    raise exception 'Az eredmény a szavazás lezárása után látható.' using errcode = 'P0001', hint = 'RESULTS_HIDDEN';
  end if;

  return query
    select o.id, o.name,
           (select count(*) from public.destination_votes v where v.option_id = o.id)::integer,
           o.id = v_poll.winning_option_id
      from public.destination_options o
     where o.poll_id = p_poll_id
     order by 3 desc, o.name;
end;
$$;

-- Lezárás (admin): a győztes a legtöbb szavazatot kapott lehetőség; holtversenynél
-- vagy ha az admin úgy dönt, a győztest paraméterben kell megadni.
create or replace function public.admin_close_destination_poll(p_poll_id uuid, p_option_id uuid default null)
returns public.destination_polls
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll   public.destination_polls;
  v_winner uuid := p_option_id;
  v_top    integer;
  v_ties   integer;
begin
  if not public.is_admin() then
    raise exception 'Ehhez admin jogosultság szükséges.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id for update;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;

  if v_winner is null then
    select max(c), count(*) filter (where c = (select max(c2) from (
             select count(*) as c2 from public.destination_votes v where v.poll_id = p_poll_id group by v.option_id) x))
      into v_top, v_ties
      from (select count(*) as c from public.destination_votes v where v.poll_id = p_poll_id group by v.option_id) t;
    if v_top is null then
      raise exception 'Még nincs szavazat.' using errcode = 'P0001', hint = 'NO_VOTES';
    end if;
    if v_ties > 1 then
      raise exception 'Holtverseny — add meg a győztes lehetőséget.' using errcode = 'P0001', hint = 'TIE';
    end if;
    select v.option_id into v_winner from public.destination_votes v
     where v.poll_id = p_poll_id group by v.option_id order by count(*) desc limit 1;
  elsif not exists (select 1 from public.destination_options o where o.id = v_winner and o.poll_id = p_poll_id) then
    raise exception 'Ez a lehetőség nem ehhez a szavazáshoz tartozik.' using errcode = 'P0001', hint = 'INVALID_OPTION';
  end if;

  update public.destination_polls
     set winning_option_id = v_winner, closes_at = least(closes_at, now())
   where id = p_poll_id
  returning * into v_poll;
  return v_poll;
end;
$$;

-- -----------------------------------------------------------------------------
-- A túra ingyenes (tagoknak és meghívott vendégeknek is), és nyilvánosan nem
-- foglalható. (A kind::text összehasonlítás azért kell, mert az új enum-érték
-- ugyanebben a tranzakcióban még nem használható literálként.)
-- -----------------------------------------------------------------------------
alter table public.events add constraint events_tura_free check (
  kind::text <> 'tura'
  or (price_tarsasagi_huf = 0 and price_belso_kor_huf = 0 and price_external_huf is null and members_only)
);

alter table public.app_settings
  add column hike_guest_invites_per_member smallint not null default 2
    check (hike_guest_invites_per_member between 0 and 20);

-- Vendégmeghívó a túrára: egy tag meghív egy Társaságon kívüli embert; a vendég a
-- (Resenddel kiküldött) egyszer használható linkkel fogadja el. Ingyenes.
create table public.event_invitations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  invited_by   uuid references public.profiles (id) on delete set null,
  guest_name   text not null check (char_length(guest_name) between 1 and 120),
  guest_email  text not null check (guest_email = lower(btrim(guest_email))),
  token        text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  status       text not null default 'invited' check (status in ('invited', 'accepted', 'cancelled')),
  registration_id uuid references public.event_registrations (id) on delete set null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);
create unique index event_invitations_one_active_per_guest
  on public.event_invitations (event_id, guest_email) where status <> 'cancelled';
create index event_invitations_inviter_idx on public.event_invitations (invited_by, event_id);

alter table public.event_invitations enable row level security;
alter table public.event_invitations force row level security;
-- A meghívó a saját meghívásait látja (a tokent nem — azt csak a vendég kapja meg e-mailben).
create policy event_invitations_select_own on public.event_invitations
  for select to authenticated using (invited_by = (select auth.uid()) or public.is_admin());
create policy event_invitations_admin_update on public.event_invitations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Meghívás (aktív tag). A tokent csak a szerver (service role) kapja vissza, hogy e-mailben kiküldje.
create or replace function public.invite_hike_guest(p_event_id uuid, p_guest_name text, p_guest_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_event  public.events;
  v_limit  smallint;
  v_email  text := lower(btrim(p_guest_email));
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if not public.has_member_access() then
    raise exception 'Vendéget a Társaság tagjai hívhatnak.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or nullif(btrim(p_guest_name), '') is null then
    raise exception 'Adj meg nevet és érvényes e-mail-címet.' using errcode = 'P0001', hint = 'INVALID_GUEST';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.kind::text <> 'tura' or not v_event.is_published or v_event.cancelled_at is not null then
    raise exception 'Erre az alkalomra nem lehet vendéget hívni.' using errcode = 'P0001', hint = 'NOT_A_HIKE';
  end if;
  if now() >= v_event.starts_at then
    raise exception 'A túra már elkezdődött.' using errcode = 'P0001', hint = 'REGISTRATION_CLOSED';
  end if;
  select hike_guest_invites_per_member into strict v_limit from public.app_settings where id;
  if (select count(*) from public.event_invitations i
       where i.event_id = p_event_id and i.invited_by = v_uid and i.status <> 'cancelled') >= v_limit then
    raise exception 'Erre a túrára legfeljebb % vendéget hívhatsz.', v_limit using errcode = 'P0001', hint = 'INVITE_LIMIT';
  end if;
  if exists (select 1 from public.profiles p
              where lower(p.email) = v_email and p.tier <> 'none'
                and p.subscription_status in ('active', 'trialing', 'past_due')) then
    raise exception 'Ő már a Társaság tagja — külön meghívó nélkül is jöhet.' using errcode = 'P0001', hint = 'ALREADY_MEMBER';
  end if;
  if exists (select 1 from public.event_invitations i
              where i.event_id = p_event_id and i.guest_email = v_email and i.status <> 'cancelled') then
    raise exception 'Őt már meghívták erre a túrára.' using errcode = 'P0001', hint = 'ALREADY_INVITED';
  end if;

  insert into public.event_invitations (event_id, invited_by, guest_name, guest_email)
  values (p_event_id, v_uid, btrim(p_guest_name), v_email)
  returning id into v_id;
  return v_id;
end;
$$;

-- Meghívó elfogadása a vendég linkjéről — CSAK service role (a weboldal szervere hívja).
-- Ingyenes, megerősített hely; a túra létszámkorlátjába beleszámít.
create or replace function public.accept_hike_invitation(p_token text)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv   public.event_invitations;
  v_event public.events;
  v_taken integer;
  v_reg   public.event_registrations;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Csak szerveroldalról hívható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_inv from public.event_invitations where token = p_token;
  if not found or v_inv.status = 'cancelled' then
    raise exception 'Ez a meghívó nem érvényes.' using errcode = 'P0001', hint = 'INVITATION_INVALID';
  end if;
  select * into v_event from public.events where id = v_inv.event_id for update;
  select * into v_inv from public.event_invitations where id = v_inv.id for update;
  if v_inv.status = 'accepted' then
    select * into v_reg from public.event_registrations where id = v_inv.registration_id;
    return v_reg;  -- idempotens
  end if;
  if v_event.cancelled_at is not null or now() >= v_event.starts_at then
    raise exception 'Erre a túrára már nem lehet jelentkezni.' using errcode = 'P0001', hint = 'REGISTRATION_CLOSED';
  end if;
  if v_event.capacity is not null then
    select count(*) into v_taken from public.event_registrations r
     where r.event_id = v_event.id and r.status <> 'cancelled';
    if v_taken >= v_event.capacity then
      raise exception 'Erre a túrára minden hely betelt.' using errcode = 'P0001', hint = 'EVENT_FULL';
    end if;
  end if;

  insert into public.event_registrations (event_id, user_id, guest_name, guest_email, is_member_seat, price_huf, status)
  values (v_event.id, null, v_inv.guest_name, v_inv.guest_email, false, 0, 'confirmed')
  returning * into v_reg;
  update public.event_invitations
     set status = 'accepted', accepted_at = now(), registration_id = v_reg.id
   where id = v_inv.id;
  return v_reg;
end;
$$;

-- Jogok
revoke all on public.event_invitations from anon, authenticated;
-- Oszlopszintű olvasási jog: a token kimarad (azt csak a vendég kapja meg e-mailben).
grant select (id, event_id, invited_by, guest_name, guest_email, status, registration_id, created_at, accepted_at)
  on public.event_invitations to authenticated;
grant update (status) on public.event_invitations to authenticated;
grant all on public.event_invitations to service_role;
revoke execute on function public.invite_hike_guest(uuid, text, text) from public, anon;
revoke execute on function public.accept_hike_invitation(text) from public, anon, authenticated;
revoke execute on function public.guard_destination_option_limit() from public, anon, authenticated;
grant execute on function public.invite_hike_guest(uuid, text, text) to authenticated, service_role;
grant execute on function public.accept_hike_invitation(text) to service_role;

revoke all on public.destination_polls, public.destination_options, public.destination_votes from anon, authenticated;
grant select, insert, update, delete on public.destination_polls to authenticated;
grant select, insert, update, delete on public.destination_options to authenticated;
grant select on public.destination_votes to authenticated;
grant all on public.destination_polls, public.destination_options, public.destination_votes to service_role;

revoke execute on function public.cast_destination_vote(uuid, uuid) from public, anon;
revoke execute on function public.destination_poll_results(uuid) from public, anon;
revoke execute on function public.admin_close_destination_poll(uuid, uuid) from public, anon;
grant execute on function public.cast_destination_vote(uuid, uuid) to authenticated, service_role;
grant execute on function public.destination_poll_results(uuid) to authenticated, service_role;
grant execute on function public.admin_close_destination_poll(uuid, uuid) to authenticated, service_role;
