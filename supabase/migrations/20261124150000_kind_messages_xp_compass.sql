-- =============================================================================
-- 005 — Kedves Üzenet (bárki, díjmentes) + Elsőbbségi Kedves Üzenet,
--       XP / rang / mérföldkövek (privát gamification), A 4 Rend és az Idegrendszeri Iránytű
-- Döntések: CLAUDE.md 7.12–7.13 (2026. november 24.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Kedves Üzenet
--    * standard  = bárki küldheti, díjmentes; beérkezési sorrend; 3 sikertelen próbálkozás
--                  után 'failed', további próbálkozás nincs. Nem tagnál e-mail-megerősítés kell.
--    * priority  = Elsőbbségi (csak tag): havi keretből díjmentesen, vagy kereten felül
--                  szabadon választott összegért (min. kind_message_min_huf). Elsőként
--                  kézbesítjük, kézbesítési garanciával: 3 sikertelen próbálkozás után
--                  'followup' (admin utánkövetés), 'failed'-et csak admin állíthat be.
--    Sorrend: elsőbbségi kereten belüli (FIFO) -> elsőbbségi fizetős (összeg szerint
--    csökkenő) -> díjmentes (FIFO).
-- -----------------------------------------------------------------------------
create type public.kind_message_kind as enum ('standard', 'priority');

-- Új állapotok. (Ugyanabban a tranzakcióban az új enum-értékeket csak szövegként
-- hasonlítjuk, ezért a feltételek status::text-et használnak.)
alter type public.kind_message_status add value if not exists 'pending_confirmation';
alter type public.kind_message_status add value if not exists 'followup';
alter type public.kind_message_status add value if not exists 'failed';

alter table public.app_settings
  add column kind_message_max_attempts       smallint not null default 3 check (kind_message_max_attempts between 1 and 10),
  add column kind_message_confirm_hours      smallint not null default 48 check (kind_message_confirm_hours between 1 and 168);

alter table public.kind_messages
  add column kind                   public.kind_message_kind not null default 'priority',
  add column guest_name             text check (char_length(guest_name) between 1 and 120),
  add column guest_email            text check (char_length(guest_email) between 3 and 320),
  add column confirm_token_hash     bytea unique,
  add column confirm_expires_at     timestamptz,
  add column confirmed_at           timestamptz,
  add column attempts               smallint not null default 0 check (attempts >= 0),
  add column last_attempt_at        timestamptz,
  add column closed_at              timestamptz;

alter table public.kind_messages alter column sender_id drop not null;

-- A telefonszámmal együtt a vendég e-mail-címe is törlődik a megőrzési idő után.
alter table public.kind_messages
  add constraint kind_messages_kind_rules check (
    (kind = 'priority' and sender_id is not null)
    or (kind = 'standard' and is_free and amount_huf = 0
        and (sender_id is not null
             or (guest_name is not null and (guest_email is not null or phone_purged_at is not null))))
  ),
  add constraint kind_messages_pending_has_token check (
    status::text <> 'pending_confirmation' or (confirm_token_hash is not null and confirm_expires_at is not null)
  );

drop index if exists public.kind_messages_queue_idx;
create index kind_messages_queue_idx on public.kind_messages (kind, is_free, amount_huf desc, created_at);
create index kind_messages_guest_email_idx on public.kind_messages (lower(guest_email)) where guest_email is not null;

-- Minden próbálkozás naplója (admin auditnapló).
create table public.kind_message_attempts (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references public.kind_messages (id) on delete cascade,
  attempted_at  timestamptz not null default now(),
  success       boolean not null,
  note          text check (char_length(note) <= 2000),
  attempted_by  uuid references public.profiles (id) on delete set null
);
create index kind_message_attempts_msg_idx on public.kind_message_attempts (message_id, attempted_at);

alter table public.kind_message_attempts enable row level security;
alter table public.kind_message_attempts force row level security;
create policy kind_message_attempts_admin on public.kind_message_attempts
  for select to authenticated using (public.is_admin());
grant select on public.kind_message_attempts to authenticated;
grant all on public.kind_message_attempts to service_role;

-- A meglévő díjmentes (havi keretes) üzenet elsőbbségi.
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
    raise exception 'A díjmentes Elsőbbségi Kedves Üzenet a próbaidő után válik elérhetővé.'
      using errcode = 'P0001', hint = 'TRIAL_NOT_ALLOWED';
  end if;
  if not public.is_paying_member() then
    raise exception 'Az Elsőbbségi Kedves Üzenet aktív tagsággal érhető el.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if v_profile.free_messages_remaining <= 0 then
    raise exception 'Ebben a hónapban már elküldted a díjmentes Elsőbbségi Üzeneteidet.'
      using errcode = 'P0001', hint = 'QUOTA_EXHAUSTED';
  end if;

  update public.profiles
     set free_messages_remaining = free_messages_remaining - 1
   where id = v_uid;

  insert into public.kind_messages (sender_id, kind, recipient_name, recipient_phone, message, is_free, amount_huf)
  values (v_uid, 'priority', btrim(p_recipient_name), btrim(p_recipient_phone), btrim(p_message), true, 0)
  returning * into v_msg;

  return v_msg;
end;
$$;

-- Díjmentes Kedves Üzenet beküldése (bárki). Csak a szerver hívja (service role):
-- bejelentkezett tag esetén p_sender kitöltve, és azonnal sorba kerül; vendég esetén
-- 'pending_confirmation', a visszaadott tokent a szerver e-mailben küldi ki (a token
-- csak hash-ként tárolódik). E-mail-címenként több üzenet is küldhető.
create or replace function public.submit_kind_message(
  p_recipient_name  text,
  p_recipient_phone text,
  p_message         text,
  p_sender          uuid default null,
  p_guest_name      text default null,
  p_guest_email     text default null
)
returns table (message_id uuid, confirm_token text, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token  text;
  v_hours  smallint;
  v_id     uuid;
begin
  perform public._require_service_role();

  if p_sender is not null then
    if not exists (select 1 from public.profiles where id = p_sender) then
      raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
    end if;
    insert into public.kind_messages (sender_id, kind, recipient_name, recipient_phone, message, is_free, amount_huf, confirmed_at)
    values (p_sender, 'standard', btrim(p_recipient_name), btrim(p_recipient_phone), btrim(p_message), true, 0, now())
    returning id into v_id;
    return query select v_id, null::text, 'queued'::text;
    return;
  end if;

  if coalesce(btrim(p_guest_name), '') = '' or coalesce(btrim(p_guest_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Név és érvényes e-mail-cím szükséges.' using errcode = 'P0001', hint = 'INVALID_GUEST';
  end if;

  select kind_message_confirm_hours into strict v_hours from public.app_settings where id;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.kind_messages (
    sender_id, kind, guest_name, guest_email, recipient_name, recipient_phone, message,
    is_free, amount_huf, status, confirm_token_hash, confirm_expires_at)
  values (
    null, 'standard', btrim(p_guest_name), lower(btrim(p_guest_email)), btrim(p_recipient_name),
    btrim(p_recipient_phone), btrim(p_message), true, 0, 'pending_confirmation',
    extensions.digest(v_token, 'sha256'), now() + make_interval(hours => v_hours))
  returning id into v_id;

  return query select v_id, v_token, 'pending_confirmation'::text;
end;
$$;

-- Vendég e-mail-megerősítése (a link tokenjével). Idempotens.
create or replace function public.confirm_kind_message(p_token text)
returns public.kind_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg public.kind_messages;
begin
  perform public._require_service_role();
  select * into v_msg from public.kind_messages
   where confirm_token_hash = extensions.digest(coalesce(p_token, ''), 'sha256')
   for update;
  if not found then
    raise exception 'Érvénytelen vagy már felhasznált link.' using errcode = 'P0001', hint = 'TOKEN_INVALID';
  end if;
  if v_msg.status::text <> 'pending_confirmation' then
    return v_msg;  -- már megerősítve
  end if;
  if v_msg.confirm_expires_at < now() then
    raise exception 'A megerősítő link lejárt.' using errcode = 'P0001', hint = 'TOKEN_EXPIRED';
  end if;
  update public.kind_messages
     set status = 'queued', confirmed_at = now()
   where id = v_msg.id
   returning * into v_msg;
  return v_msg;
end;
$$;

-- Kézbesítési próbálkozás rögzítése (admin).
create or replace function public.admin_record_kind_message_attempt(
  p_message uuid,
  p_success boolean,
  p_note    text default null
)
returns public.kind_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg  public.kind_messages;
  v_max  smallint;
begin
  if not public.is_admin() then
    raise exception 'Csak admin rögzíthet kézbesítést.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_msg from public.kind_messages where id = p_message for update;
  if not found then
    raise exception 'Ismeretlen üzenet.' using errcode = 'P0001', hint = 'NOT_FOUND';
  end if;
  if v_msg.status::text not in ('queued', 'scheduled', 'followup') then
    raise exception 'Ez az üzenet nincs a kézbesítési sorban.' using errcode = 'P0001', hint = 'NOT_IN_QUEUE';
  end if;
  select kind_message_max_attempts into strict v_max from public.app_settings where id;

  insert into public.kind_message_attempts (message_id, success, note, attempted_by)
  values (p_message, p_success, p_note, auth.uid());

  update public.kind_messages set
    attempts        = attempts + 1,
    last_attempt_at = now(),
    status = case
      when p_success then 'delivered'
      when attempts + 1 >= v_max and kind = 'standard' then 'failed'
      when attempts + 1 >= v_max and kind = 'priority' then 'followup'
      else status::text end::public.kind_message_status,
    delivered_at = case when p_success then now() else delivered_at end,
    closed_at = case
      when p_success or (attempts + 1 >= v_max and kind = 'standard') then now()
      else closed_at end
  where id = p_message
  returning * into v_msg;
  return v_msg;
end;
$$;

-- Elsőbbségi üzenet lezárása sikertelenként: csak admin, kézzel (a garancia miatt
-- automatikusan sosem lesz 'failed'). Díjmentesnél ugyanez a moderációs elutasítás.
create or replace function public.admin_close_kind_message(p_message uuid, p_failed boolean, p_note text default null)
returns public.kind_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg public.kind_messages;
begin
  if not public.is_admin() then
    raise exception 'Csak admin zárhat le üzenetet.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  update public.kind_messages
     set status = (case when p_failed then 'failed' else 'rejected' end)::public.kind_message_status,
         closed_at = now()
   where id = p_message and status::text in ('queued', 'scheduled', 'followup', 'pending_confirmation')
   returning * into v_msg;
  if not found then
    raise exception 'Az üzenet nem zárható le.' using errcode = 'P0001', hint = 'NOT_IN_QUEUE';
  end if;
  if p_note is not null then
    insert into public.kind_message_attempts (message_id, success, note, attempted_by)
    values (p_message, false, p_note, auth.uid());
  end if;
  return v_msg;
end;
$$;

-- Admin kézbesítési sor a megállapodott sorrendben.
create or replace function public.admin_kind_message_queue()
returns setof public.kind_messages
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Csak admin láthatja a sort.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  return query
    select * from public.kind_messages
     where status::text in ('queued', 'scheduled', 'followup')
     order by
       case when kind = 'priority' and is_free then 0
            when kind = 'priority' then 1
            else 2 end,
       case when kind = 'priority' and not is_free then -amount_huf else 0 end,
       coalesce(confirmed_at, created_at), created_at, id;
end;
$$;

-- Napi takarítás: lejárt, meg nem erősített vendégüzenetek törlése; a megőrzési idő után
-- a telefonszám és a vendég e-mail-címe törlődik.
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
  delete from public.kind_messages
   where status::text = 'pending_confirmation' and confirm_expires_at < now();
  update public.kind_messages
     set recipient_phone = null, guest_email = null, phone_purged_at = now()
   where recipient_phone is not null
     and created_at < now() - make_interval(days => v_days);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. A 4 Rend és az Idegrendszeri Iránytű
--    A rendet a kérdőív eredménye adja, egyszer állítható be; utána csak a superadmin
--    javíthatja (hibajavítás). A visszatérő tag rendje megmarad (az identitás nem haladás).
-- -----------------------------------------------------------------------------
create type public.order_key as enum ('tundek', 'kertorzok', 'torpok', 'vandorok');

alter table public.profiles
  add column order_key             public.order_key,
  add column compass_answers       jsonb,
  add column compass_scores        jsonb,
  add column compass_completed_at  timestamptz;

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
  -- A rend végleges: beállítás után csak superadmin javíthatja (bárki is hívja).
  if old.order_key is not null and new.order_key is distinct from old.order_key
     and not public.is_superadmin() then
    raise exception 'A rend nem módosítható.' using errcode = '42501', hint = 'ORDER_LOCKED';
  end if;
  return new;
end;
$$;

create table public.compass_questions (
  id        smallint primary key,
  position  smallint not null unique,
  prompt    text not null,
  weight    smallint not null default 1 check (weight between 1 and 3),
  options   jsonb not null   -- [{ "key": "a", "text": "...", "order": "tundek" }, ...]
);
alter table public.compass_questions enable row level security;
alter table public.compass_questions force row level security;
create policy compass_questions_read on public.compass_questions
  for select to authenticated using (true);
create policy compass_questions_superadmin on public.compass_questions
  for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
-- A rend-hozzárendelés nem látszik a kliensnek (ne lehessen "célra tölteni"): a kliens a
-- compass_questionnaire() függvényen keresztül kapja a kérdéseket, rend nélkül.
grant select, insert, update, delete on public.compass_questions to authenticated;
revoke select on public.compass_questions from authenticated;
grant select (id, position, prompt) on public.compass_questions to authenticated;
grant all on public.compass_questions to service_role;

create or replace function public.compass_questionnaire()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', q.id,
           'prompt', q.prompt,
           'options', (select jsonb_agg(jsonb_build_object('key', o ->> 'key', 'text', o ->> 'text')
                                        order by o ->> 'key')
                         from jsonb_array_elements(q.options) o))
         order by q.position), '[]'::jsonb)
    from public.compass_questions q;
$$;

-- Kitöltés: a pontozás szerveroldalon történik. Holtversenynél COMPASS_TIE (a DETAIL
-- tartalmazza a holtversenyben lévő rendeket); ilyenkor a kliens egy döntő kérdést mutat,
-- és p_tiebreak-kel újra beküldi.
create or replace function public.submit_compass(p_answers jsonb, p_tiebreak public.order_key default null)
returns public.order_key
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_q       public.compass_questions;
  v_choice  text;
  v_order   text;
  v_scores  jsonb := '{"tundek": 0, "kertorzok": 0, "torpok": 0, "vandorok": 0}'::jsonb;
  v_max     integer;
  v_tied    text[];
  v_result  public.order_key;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  select * into v_profile from public.profiles where id = v_uid for update;
  if not public.has_member_access() then
    raise exception 'Az Iránytű a tagság része.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  if v_profile.order_key is not null then
    raise exception 'A rended már kiderült, és végleges.' using errcode = 'P0001', hint = 'ORDER_LOCKED';
  end if;

  for v_q in select * from public.compass_questions order by position loop
    v_choice := p_answers ->> v_q.id::text;
    select o ->> 'order' into v_order
      from jsonb_array_elements(v_q.options) o
     where o ->> 'key' = v_choice;
    if v_order is null then
      raise exception 'Minden kérdésre válaszolj.' using errcode = 'P0001', hint = 'COMPASS_INCOMPLETE';
    end if;
    v_scores := jsonb_set(v_scores, array[v_order], to_jsonb((v_scores ->> v_order)::integer + v_q.weight));
  end loop;

  select max(value::integer) into v_max from jsonb_each_text(v_scores);
  select array_agg(key order by key) into v_tied from jsonb_each_text(v_scores) where value::integer = v_max;

  if array_length(v_tied, 1) > 1 then
    if p_tiebreak is null or not (p_tiebreak::text = any (v_tied)) then
      raise exception 'Holtverseny a rendek között.' using errcode = 'P0001', hint = 'COMPASS_TIE',
        detail = array_to_string(v_tied, ',');
    end if;
    v_result := p_tiebreak;
  else
    v_result := v_tied[1]::public.order_key;
  end if;

  update public.profiles
     set order_key = v_result, compass_answers = p_answers, compass_scores = v_scores,
         compass_completed_at = now()
   where id = v_uid;
  return v_result;
end;
$$;

-- Hibajavítás: csak superadmin.
create or replace function public.superadmin_set_order(p_user uuid, p_order public.order_key)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  if not public.is_superadmin() then
    raise exception 'Csak superadmin javíthat rendet.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  update public.profiles set order_key = p_order where id = p_user returning * into v_row;
  if not found then
    raise exception 'Ismeretlen felhasználó.' using errcode = 'P0001', hint = 'USER_NOT_FOUND';
  end if;
  return v_row;
end;
$$;

-- Az Iránytű kérdései (önismereti eszköz, nem diagnózis). A modell: docs/iranytu.md.
-- A válaszlehetőségek betűjele szándékosan nem egyezik rendenként (a kliens is keveri).
insert into public.compass_questions (id, position, prompt, weight, options) values
(1, 1, 'Váratlan, feszült helyzetbe kerülsz — például valaki élesen rád szól. Mi történik benned először?', 2, '[
  {"key":"a","order":"torpok","text":"Megfeszülök, és rögtön azon jár az eszem, mi a teendő és hogyan tarthatom kézben."},
  {"key":"b","order":"tundek","text":"Elárasztanak a benyomások és az érzések; legszívesebben félrevonulnék, hogy rendezzem magamban."},
  {"key":"c","order":"vandorok","text":"Felpörgök: mozdulni, cselekedni vagy visszaszólni akarok, nehezen maradok veszteg."},
  {"key":"d","order":"kertorzok","text":"Elsőként a helyzetet csitítanám, hogy mindenki megnyugodjon — akár a saját igényeim rovására is."}]'),
(2, 2, 'Egy megterhelő nap után mi tölt vissza a leginkább?', 2, '[
  {"key":"a","order":"kertorzok","text":"Egy meleg, ismerős közeg: egy közös vacsora vagy egy hozzám közel álló ember."},
  {"key":"b","order":"vandorok","text":"Mozgás, kint lenni, valami új élmény."},
  {"key":"c","order":"tundek","text":"Csend, félhomály, kevés inger — egy kis idő egyedül."},
  {"key":"d","order":"torpok","text":"Rendet rakni, lezárni a nyitott teendőket, és egy kiszámítható este."}]'),
(3, 3, 'Hogyan érzékeled hétköznap a tested jelzéseit?', 1, '[
  {"key":"a","order":"tundek","text":"Nagyon finoman — néha túl sokat is: apró változásokat is észreveszek."},
  {"key":"b","order":"torpok","text":"Inkább feszülésként a vállamban vagy az állkapcsomban, és csak akkor, ha már erős."},
  {"key":"c","order":"kertorzok","text":"Akkor figyelek fel rájuk, ha valami kizökkent a megszokott ritmusomból."},
  {"key":"d","order":"vandorok","text":"Gyakran csak akkor, amikor megállok — menet közben szinte észre sem veszem őket."}]'),
(4, 4, 'Mi történik a légzéseddel, amikor feszült vagy?', 1, '[
  {"key":"a","order":"vandorok","text":"Felgyorsul; a mozgás vagy a cselekvés hozza helyre."},
  {"key":"b","order":"kertorzok","text":"Sóhajtozni kezdek, és keresem, kivel oszthatnám meg, ami nyom."},
  {"key":"c","order":"tundek","text":"Elakad, felszínessé válik, mintha visszatartanám."},
  {"key":"d","order":"torpok","text":"Megpróbálom kontrollálni, de a mellkasom feszes marad."}]'),
(5, 5, 'Amikor a figyelmed elkalandozik, leggyakrabban mivel foglalkozik?', 1, '[
  {"key":"a","order":"torpok","text":"Teendőkkel, tervekkel, és hogy mi maradhatott ki."},
  {"key":"b","order":"vandorok","text":"Lehetőségekkel, új ötletekkel — hogy mi lenne, ha…"},
  {"key":"c","order":"kertorzok","text":"Azokkal, akik fontosak nekem: hogy vannak, mire lenne szükségük."},
  {"key":"d","order":"tundek","text":"Hangulatokkal, egy beszélgetés árnyalataival, hogy ki mit érezhetett."}]'),
(6, 6, 'Egy közösségben te jellemzően…', 1, '[
  {"key":"a","order":"kertorzok","text":"teret és otthonosságot teremtesz, összehozod az embereket."},
  {"key":"b","order":"tundek","text":"megérzed, ha valaki nincs jól, akkor is, ha nem mondja."},
  {"key":"c","order":"vandorok","text":"lendületet adsz — te mondod, hogy „vágjunk bele”."},
  {"key":"d","order":"torpok","text":"az vagy, akire lehet számítani: szervezel, végigviszel."}]'),
(7, 7, 'Hogyan viszonyulsz az újhoz és a megszokotthoz?', 1, '[
  {"key":"a","order":"vandorok","text":"Az újdonság éltet; a túl sok ismétlés kiszárít."},
  {"key":"b","order":"torpok","text":"Az újat is szívesen fogadom, ha előtte átláthatom és megtervezhetem."},
  {"key":"c","order":"tundek","text":"Az új élmények mélyen hatnak rám, de utána sok idő kell, hogy feldolgozzam őket."},
  {"key":"d","order":"kertorzok","text":"A jól bevált ritmus ad biztonságot; az újat lassan, a saját tempómban fogadom be."}]'),
(8, 8, 'Mi merít ki a leginkább?', 1, '[
  {"key":"a","order":"tundek","text":"Zaj, tömeg, erős ingerek, és mások ki nem mondott feszültsége."},
  {"key":"b","order":"kertorzok","text":"Konfliktus, feszült légkör, vagy ha valaki haragszik rám."},
  {"key":"c","order":"torpok","text":"Káosz, kiszámíthatatlanság, félbehagyott dolgok."},
  {"key":"d","order":"vandorok","text":"Tétlenség, várakozás, korlátok."}]'),
(9, 9, 'Mit szeretnél a leginkább a gyakorlástól?', 1, '[
  {"key":"a","order":"torpok","text":"Hogy el tudjam engedni a kontrollt, és valóban pihenni tudjak."},
  {"key":"b","order":"vandorok","text":"Hogy le tudjak lassulni és meg tudjak érkezni."},
  {"key":"c","order":"tundek","text":"Hogy kevésbé árasszanak el az ingerek és az érzések."},
  {"key":"d","order":"kertorzok","text":"Hogy a nyugalmam akkor is megmaradjon, ha körülöttem vihar van."}]'),
(10, 10, 'Ha egy gyakorlás aznap nem megy, mit teszel?', 1, '[
  {"key":"a","order":"kertorzok","text":"Másnap szelídebben újra próbálom, nem erőltetem."},
  {"key":"b","order":"torpok","text":"Rendszert keresek benne: mit csinálhatnék másként, jobban."},
  {"key":"c","order":"vandorok","text":"Inkább kipróbálok valami mást."},
  {"key":"d","order":"tundek","text":"Elbizonytalanodom, és talán túl sokat is érzek bele."}]'),
(11, 11, 'Milyen az energiád egy átlagos napon?', 1, '[
  {"key":"a","order":"vandorok","text":"Lökésszerű: nagy lendületek, aztán hirtelen leeresztés."},
  {"key":"b","order":"tundek","text":"Hullámzó, és erősen függ a környezettől és a hangulatoktól."},
  {"key":"c","order":"torpok","text":"Kitartó: akkor is megyek, ha fáradt vagyok — néha túl sokáig."},
  {"key":"d","order":"kertorzok","text":"Egyenletes, ha megvan a napi ritmusom."}]'),
(12, 12, 'Mit mondanak rólad leggyakrabban a hozzád közel állók?', 1, '[
  {"key":"a","order":"torpok","text":"Hogy rád mindig lehet számítani."},
  {"key":"b","order":"kertorzok","text":"Hogy melletted megnyugszanak."},
  {"key":"c","order":"vandorok","text":"Hogy veled minden kaland."},
  {"key":"d","order":"tundek","text":"Hogy mélyen átérzed a dolgokat."}]');

-- -----------------------------------------------------------------------------
-- 3. XP, rang, mérföldkövek (privát gamification)
--    * csak a tag maga és az admin látja; nincs ranglista, nincs sorozat, nincs levonás
--    * minden XP egy naplósor (xp_events); egy forrás-hivatkozás tagsági ciklusonként
--      egyszer számít; XP-t csak a rendszer írhat (triggerek / service role)
--    * napi felső határ (xp_daily_cap); a lépcső-teljesítés bónusza ez alól kivétel
--    * visszatérő tag: új ciklus, nulláról indul (cycle_started_at = membership_started_at)
-- -----------------------------------------------------------------------------
create type public.xp_source as enum (
  'lesson',            -- lecke / napi küldetés kipipálva (leckénként 1×)
  'ritual',            -- reggeli / esti meditációs rituálé (IP 1)
  'knowledge',         -- Tudás Ösvénye: elméleti hanganyag / videó
  'journal',           -- Belső Tükör: naplóbejegyzés
  'kozlony',           -- Analóg Reggel: kinyomtatott Napi Közlöny
  'post',              -- poszt a közösségben
  'answer',            -- válasz egy addig megválaszolatlan posztra
  'helpful_received',  -- kapott „Köszönöm, hasznos volt”
  'friday_circle',     -- pénteki kör kitöltése
  'online_meditation', -- részvétel heti online közös meditáción
  'event_attendance',  -- részvétel Nyílt Esten / Gyakorlónapon / Elvonuláson
  'hike',              -- részvétel közös túrán
  'kind_message',      -- elküldött Kedves Üzenet (tagként)
  'stage'              -- egy lépcső teljesítése (továbblépés jóváhagyva)
);

alter table public.app_settings
  add column xp_rules jsonb not null default '{
    "lesson":            {"xp": 10,  "per": "day",   "max": 100},
    "ritual":            {"xp": 5,   "per": "day",   "max": 2},
    "knowledge":         {"xp": 5,   "per": "day",   "max": 100},
    "journal":           {"xp": 5,   "per": "day",   "max": 1},
    "kozlony":           {"xp": 3,   "per": "day",   "max": 1},
    "post":              {"xp": 5,   "per": "day",   "max": 1},
    "answer":            {"xp": 8,   "per": "day",   "max": 2},
    "helpful_received":  {"xp": 2,   "per": "week",  "max": 10},
    "friday_circle":     {"xp": 10,  "per": "week",  "max": 1},
    "online_meditation": {"xp": 10,  "per": "day",   "max": 1},
    "event_attendance":  {"xp": 20,  "per": "day",   "max": 1},
    "hike":              {"xp": 25,  "per": "day",   "max": 1},
    "kind_message":      {"xp": 10,  "per": "month", "max": 1},
    "stage":             {"xp": 100, "per": "cycle", "max": 3, "uncapped": true}
  }'::jsonb,
  add column xp_daily_cap integer not null default 60 check (xp_daily_cap > 0),
  add column xp_ranks jsonb not null default '[
    {"key": "kereso",       "label": "Kereső",       "xp": 0},
    {"key": "figyelo",      "label": "Figyelő",      "xp": 150},
    {"key": "horgonyzo",    "label": "Horgonyzó",    "xp": 500},
    {"key": "csendorzo",    "label": "Csendőrző",    "xp": 1200},
    {"key": "egyensulyozo", "label": "Egyensúlyozó", "xp": 2500},
    {"key": "utitars",      "label": "Útitárs",      "xp": 4500},
    {"key": "orzo",         "label": "Őrző",         "xp": 7000}
  ]'::jsonb;

-- A továbblépési küszöb XP-ben (a rangokhoz igazítva: Horgonyzó, Csendőrző).
update public.app_settings set progression_points_required = '{"2": 500, "3": 1200, "4": 0}'::jsonb where id;
alter table public.app_settings alter column progression_points_required set default '{"2": 500, "3": 1200, "4": 0}'::jsonb;

-- A lecke "ösvénye" határozza meg, milyen XP jár érte.
alter table public.lessons
  add column track text not null default 'gyakorlas'
    check (track in ('gyakorlas', 'tudas', 'ritual_reggeli', 'ritual_esti'));

-- Részvétel rögzítése (admin jelöli az esemény után).
alter table public.event_registrations add column attended_at timestamptz;

create table public.xp_events (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  cycle_started_at  timestamptz not null,
  source            public.xp_source not null,
  source_ref        text not null,
  xp                integer not null check (xp > 0),
  earned_on         date not null default public.budapest_today(),
  created_at        timestamptz not null default now(),
  unique (user_id, cycle_started_at, source, source_ref)
);
create index xp_events_user_day_idx on public.xp_events (user_id, cycle_started_at, earned_on);

alter table public.xp_events enable row level security;
alter table public.xp_events force row level security;
create policy xp_events_select on public.xp_events
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
grant select on public.xp_events to authenticated;
grant all on public.xp_events to service_role;

-- Belső Tükör: privát gyakorlónapló. Csak a tag maga látja (az admin sem).
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entry_on    date not null default public.budapest_today(),
  body        text not null check (char_length(body) between 1 and 10000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create index journal_entries_user_idx on public.journal_entries (user_id, entry_on desc);

alter table public.journal_entries enable row level security;
alter table public.journal_entries force row level security;
create policy journal_entries_own on public.journal_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_member_access());
grant select, insert, update, delete on public.journal_entries to authenticated;
grant all on public.journal_entries to service_role;

-- Pontjóváírás (belső). Sosem dob hibát: a pontozás nem akaszthatja meg a tag műveletét.
-- Visszaadja a jóváírt XP-t (0, ha nem járt).
create or replace function public._award_xp(
  p_user   uuid,
  p_source public.xp_source,
  p_ref    text,
  p_on     date default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile  public.profiles;
  v_settings public.app_settings;
  v_rule     jsonb;
  v_on       date := coalesce(p_on, public.budapest_today());
  v_from     date;
  v_count    integer;
  v_today    integer;
  v_xp       integer;
begin
  if p_user is null then
    return 0;
  end if;
  -- Felhasználónként sorba állítjuk a jóváírásokat (napi határ, ablakos korlátok).
  select * into v_profile from public.profiles where id = p_user for update;
  if not found or v_profile.tier = 'none' or v_profile.membership_started_at is null
     or v_profile.subscription_status not in ('active', 'trialing', 'past_due') then
    return 0;
  end if;

  select * into strict v_settings from public.app_settings where id;
  v_rule := v_settings.xp_rules -> p_source::text;
  if v_rule is null or coalesce((v_rule ->> 'xp')::integer, 0) <= 0 then
    return 0;
  end if;
  v_xp := (v_rule ->> 'xp')::integer;

  if exists (select 1 from public.xp_events
              where user_id = p_user and cycle_started_at = v_profile.membership_started_at
                and source = p_source and source_ref = p_ref) then
    return 0;
  end if;

  v_from := case v_rule ->> 'per'
    when 'day'   then v_on
    when 'week'  then date_trunc('week', v_on)::date
    when 'month' then date_trunc('month', v_on)::date
    else '-infinity'::date end;
  select count(*) into v_count from public.xp_events
   where user_id = p_user and cycle_started_at = v_profile.membership_started_at
     and source = p_source and earned_on >= v_from and earned_on <= v_on;
  if v_count >= coalesce((v_rule ->> 'max')::integer, 1) then
    return 0;
  end if;

  if not coalesce((v_rule ->> 'uncapped')::boolean, false) then
    select coalesce(sum(e.xp), 0) into v_today from public.xp_events e
     where e.user_id = p_user and e.cycle_started_at = v_profile.membership_started_at
       and e.earned_on = v_on
       and not coalesce((v_settings.xp_rules -> e.source::text ->> 'uncapped')::boolean, false);
    v_xp := least(v_xp, v_settings.xp_daily_cap - v_today);
    if v_xp <= 0 then
      return 0;
    end if;
  end if;

  insert into public.xp_events (user_id, cycle_started_at, source, source_ref, xp, earned_on)
  values (p_user, v_profile.membership_started_at, p_source, p_ref, v_xp, v_on)
  on conflict do nothing;
  return v_xp;
exception when others then
  return 0;
end;
$$;

-- Külső jóváírás (pl. Napi Közlöny nyomtatás) — csak service role.
create or replace function public.award_external_xp(p_user uuid, p_source public.xp_source, p_ref text, p_on date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_service_role();
  if p_source not in ('kozlony') then
    raise exception 'Ez a forrás nem írható kívülről.' using errcode = 'P0001', hint = 'INVALID_SOURCE';
  end if;
  return public._award_xp(p_user, p_source, p_ref, p_on);
end;
$$;

-- ---- Triggerek: a tag műveleteiből születő XP ---------------------------------------
create or replace function public.xp_on_lesson_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_track text;
begin
  select track into v_track from public.lessons where id = new.lesson_id;
  if v_track in ('ritual_reggeli', 'ritual_esti') then
    perform public._award_xp(new.user_id, 'ritual', new.lesson_id::text || ':' || new.practiced_on, new.practiced_on);
  elsif v_track = 'tudas' then
    perform public._award_xp(new.user_id, 'knowledge', new.lesson_id::text, new.practiced_on);
  else
    perform public._award_xp(new.user_id, 'lesson', new.lesson_id::text, new.practiced_on);
  end if;
  return new;
end;
$$;
create trigger lesson_completions_xp after insert on public.lesson_completions
  for each row execute function public.xp_on_lesson_completion();

create or replace function public.xp_on_journal_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._award_xp(new.user_id, 'journal', new.entry_on::text, new.entry_on);
  return new;
end;
$$;
create trigger journal_entries_xp after insert on public.journal_entries
  for each row execute function public.xp_on_journal_entry();

create or replace function public.xp_on_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'normal' and new.author_id is not null then
    perform public._award_xp(new.author_id, 'post', new.id::text);
  end if;
  return new;
end;
$$;
create trigger posts_xp after insert on public.posts
  for each row execute function public.xp_on_post();

-- Hozzászólás: pénteki körre adott válasz, vagy egy addig megválaszolatlan poszt első válasza.
create or replace function public.xp_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post public.posts;
begin
  if new.author_id is null then
    return new;
  end if;
  select * into v_post from public.posts where id = new.post_id;
  if v_post.kind = 'penteki_kor' then
    perform public._award_xp(new.author_id, 'friday_circle', new.post_id::text);
  elsif v_post.author_id is distinct from new.author_id
        and not exists (select 1 from public.comments c
                         where c.post_id = new.post_id and c.id <> new.id
                           and c.author_id is distinct from v_post.author_id) then
    perform public._award_xp(new.author_id, 'answer', new.post_id::text);
  end if;
  return new;
end;
$$;
create trigger comments_xp after insert on public.comments
  for each row execute function public.xp_on_comment();

create or replace function public.xp_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
begin
  if new.kind = 'koszonom' then
    select author_id into v_author from public.posts where id = new.post_id;
    if v_author is not null and v_author <> new.user_id then
      perform public._award_xp(v_author, 'helpful_received', new.post_id::text || ':' || new.user_id::text);
    end if;
  end if;
  return new;
end;
$$;
create trigger post_reactions_xp after insert on public.post_reactions
  for each row execute function public.xp_on_reaction();

create or replace function public.xp_on_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_day  date;
begin
  if new.user_id is null or new.attended_at is null or old.attended_at is not null then
    return new;
  end if;
  select kind::text, (starts_at at time zone 'Europe/Budapest')::date into v_kind, v_day
    from public.events where id = new.event_id;
  if v_kind = 'online_meditacio' then
    perform public._award_xp(new.user_id, 'online_meditation', new.id::text, v_day);
  elsif v_kind = 'tura' then
    perform public._award_xp(new.user_id, 'hike', new.id::text, v_day);
  elsif v_kind in ('nyilt_est', 'gyakorlonap', 'elvonulas') then
    perform public._award_xp(new.user_id, 'event_attendance', new.id::text, v_day);
  end if;
  return new;
end;
$$;
create trigger event_registrations_xp after update of attended_at on public.event_registrations
  for each row execute function public.xp_on_attendance();

create or replace function public.xp_on_kind_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sender_id is not null then
    perform public._award_xp(new.sender_id, 'kind_message', new.id::text);
  end if;
  return new;
end;
$$;
create trigger kind_messages_xp after insert on public.kind_messages
  for each row execute function public.xp_on_kind_message();

-- Lépcső teljesítve = a következő lépcsőre szóló továbblépés jóváhagyva.
create or replace function public.xp_on_progression()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    perform public._award_xp(new.user_id, 'stage', (new.target_stage - 1)::text);
  end if;
  return new;
end;
$$;
create trigger progression_requests_xp after update of status on public.progression_requests
  for each row execute function public.xp_on_progression();

-- ---- A részvételi pontszám mostantól az aktuális tagsági ciklus XP-je -----------------
create or replace function public.participation_score(p_user uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := coalesce(p_user, auth.uid());
  v_start timestamptz;
  v_total integer;
  v_break jsonb;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if v_uid is distinct from auth.uid() and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Más tag pontjai nem láthatók.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;

  select membership_started_at into v_start from public.profiles where id = v_uid;
  select coalesce(sum(xp), 0) into v_total from public.xp_events
   where user_id = v_uid and cycle_started_at = v_start;
  select coalesce(jsonb_object_agg(source, s), '{}'::jsonb) into v_break
    from (select source::text as source, sum(xp) as s from public.xp_events
           where user_id = v_uid and cycle_started_at = v_start group by source) t;
  return jsonb_build_object('points', v_total, 'breakdown', v_break);
end;
$$;

-- ---- Karakterkártya ------------------------------------------------------------------
create or replace function public.my_character_card(p_user uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := coalesce(p_user, auth.uid());
  v_profile  public.profiles;
  v_settings public.app_settings;
  v_total    integer;
  v_today    integer;
  v_rank     jsonb;
  v_next     jsonb;
  v_days     integer;
  v_stones   jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if v_uid is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Más tag kártyája nem látható.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  select * into strict v_settings from public.app_settings where id;

  select coalesce(sum(xp), 0) into v_total from public.xp_events
   where user_id = v_uid and cycle_started_at = v_profile.membership_started_at;
  select coalesce(sum(e.xp), 0) into v_today from public.xp_events e
   where e.user_id = v_uid and e.cycle_started_at = v_profile.membership_started_at
     and e.earned_on = public.budapest_today()
     and not coalesce((v_settings.xp_rules -> e.source::text ->> 'uncapped')::boolean, false);

  select r into v_rank from jsonb_array_elements(v_settings.xp_ranks) r
   where (r ->> 'xp')::integer <= v_total order by (r ->> 'xp')::integer desc limit 1;
  select r into v_next from jsonb_array_elements(v_settings.xp_ranks) r
   where (r ->> 'xp')::integer > v_total order by (r ->> 'xp')::integer limit 1;

  -- Mérföldkövek (csendesen, értesítés nélkül; számolva, nem tárolva).
  select count(distinct practiced_on) into v_days from public.lesson_completions
   where user_id = v_uid and created_at >= coalesce(v_profile.membership_started_at, 'infinity');
  if v_days >= 7 then
    v_stones := v_stones || jsonb_build_object('key', 'elso_het', 'label', 'Hét gyakorlónap');
  end if;
  select v_stones || coalesce(jsonb_agg(jsonb_build_object('key', m.key, 'label', m.label, 'at', m.at) order by m.at), '[]'::jsonb)
    into v_stones
    from (
      select k.key, k.label, min(e.created_at) as at
        from (values
          ('elso_valasz',   'Első válasz egy társnak', 'answer'),
          ('elso_naplo',    'Első Belső Tükör',        'journal'),
          ('elso_pentek',   'Első pénteki kör',        'friday_circle'),
          ('elso_tura',     'Első közös túra',         'hike'),
          ('elso_uzenet',   'Első Kedves Üzenet',      'kind_message'),
          ('elso_lepcso',   'Egy lépcső teljesítve',   'stage')
        ) as k(key, label, source)
        join public.xp_events e on e.source::text = k.source
       where e.user_id = v_uid and e.cycle_started_at = v_profile.membership_started_at
       group by k.key, k.label
    ) m;

  return jsonb_build_object(
    'order',          v_profile.order_key,
    'stage_label',    v_profile.current_stage_label,
    'xp_total',       v_total,
    'xp_today',       v_today,
    'xp_daily_cap',   v_settings.xp_daily_cap,
    'rank',           v_rank,
    'next_rank',      v_next,
    'xp_to_next',     case when v_next is null then null else (v_next ->> 'xp')::integer - v_total end,
    'milestones',     v_stones
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Jogok — az új függvények alapból senkinek; amit a kliens hívhat, explicit engedjük.
--    (A CREATE OR REPLACE-szel felülírt régi függvények megtartják a korábbi jogaikat.)
-- -----------------------------------------------------------------------------
revoke execute on function
  public.submit_kind_message(text, text, text, uuid, text, text),
  public.confirm_kind_message(text),
  public.admin_record_kind_message_attempt(uuid, boolean, text),
  public.admin_close_kind_message(uuid, boolean, text),
  public.admin_kind_message_queue(),
  public.compass_questionnaire(),
  public.submit_compass(jsonb, public.order_key),
  public.superadmin_set_order(uuid, public.order_key),
  public._award_xp(uuid, public.xp_source, text, date),
  public.award_external_xp(uuid, public.xp_source, text, date),
  public.xp_on_lesson_completion(),
  public.xp_on_journal_entry(),
  public.xp_on_post(),
  public.xp_on_comment(),
  public.xp_on_reaction(),
  public.xp_on_attendance(),
  public.xp_on_kind_message(),
  public.xp_on_progression(),
  public.my_character_card(uuid)
from public, anon, authenticated;

grant execute on function public.admin_record_kind_message_attempt(uuid, boolean, text) to authenticated;
grant execute on function public.admin_close_kind_message(uuid, boolean, text) to authenticated;
grant execute on function public.admin_kind_message_queue() to authenticated;
grant execute on function public.compass_questionnaire() to authenticated;
grant execute on function public.submit_compass(jsonb, public.order_key) to authenticated;
grant execute on function public.superadmin_set_order(uuid, public.order_key) to authenticated;
grant execute on function public.my_character_card(uuid) to authenticated;
grant execute on all functions in schema public to service_role;
