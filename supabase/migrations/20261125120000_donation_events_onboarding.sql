-- =============================================================================
-- 012 — Adomány alapú esemény + az új tagok bevezetője
--
-- • events.donation_based: az esemény részvétele díjmentes, a résztvevők a helyszínen,
--   belátásuk szerint támogathatják. Online fizetés nincs, ezért minden ár 0.
--   (Kivételes lehetőség — a díjak alapból szolgáltatási díjak, AAM számlával.)
-- • profiles.onboarded_at: mikor látta a tag a rövid bevezetőt (a tag maga állítja).
-- • public_open_evenings: visszaadja a donation_based jelzőt is.
-- =============================================================================

alter table public.events
  add column donation_based boolean not null default false,
  add constraint events_donation_free check (
    not donation_based
    or (price_tarsasagi_huf = 0 and price_belso_kor_huf = 0 and coalesce(price_external_huf, 0) = 0)
  );

alter table public.profiles add column onboarded_at timestamptz;

-- A tag a saját bevezető-jelzőjét is módosíthatja.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_free constant text[] := array['display_name', 'bio', 'updated_at', 'leaderboard_hidden', 'last_name', 'first_name', 'nickname', 'onboarded_at'];
begin
  if current_user in ('authenticated', 'anon') and new.role is distinct from old.role
     and not public.is_superadmin() then
    raise exception 'Szerepkört csak superadmin módosíthat.' using errcode = '42501';
  end if;
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (to_jsonb(new) - v_free) is distinct from (to_jsonb(old) - v_free) then
      raise exception 'Ezt a mezőt nem módosíthatod.' using errcode = '42501';
    end if;
  end if;
  if old.order_key is not null and new.order_key is distinct from old.order_key
     and not public.is_superadmin() then
    raise exception 'A rend nem módosítható.' using errcode = '42501', hint = 'ORDER_LOCKED';
  end if;
  return new;
end;
$$;

-- A visszatérési típus változik, ezért újra kell létrehozni.
drop function public.public_open_evenings();
create function public.public_open_evenings()
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
  seats_left          integer,
  donation_based      boolean
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
         end,
         e.donation_based
    from public.events e
   where e.is_published and e.cancelled_at is null
     and not e.members_only and e.price_external_huf is not null
     and e.starts_at > now()
   order by e.starts_at
$$;
revoke execute on function public.public_open_evenings() from public;
grant execute on function public.public_open_evenings() to anon, authenticated, service_role;
