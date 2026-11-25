-- =============================================================================
-- 021 — Kérdőív 2. változat (2026. november 26.)
--   * 15 kérdés, mindegyik 1–10-es skálán (answers: {"q1": 7, …, "q15": 9}).
--   * Minősítés: a 15. kérdés („most van itt az ideje?”) 8–10 pont — vagy a régi „azonnal”.
--   * A régi (1. változatú) válaszok megmaradnak; a régi oszlopok nem kötelezők többé.
-- =============================================================================

alter table public.applications
  add column questionnaire_version smallint not null default 1 check (questionnaire_version in (1, 2)),
  add column answers jsonb,
  add column start_score smallint check (start_score between 1 and 10);

alter table public.applications
  alter column pillars drop not null,
  alter column problem drop not null,
  alter column severity drop not null,
  alter column urgency drop not null,
  alter column invest_money drop not null,
  alter column invest_time drop not null,
  alter column invest_energy drop not null,
  alter column start_when drop not null;

-- A minősítés új szabálya (a generált oszlopot újra kell létrehozni).
alter table public.applications drop column qualified;
alter table public.applications
  add column qualified boolean generated always as (coalesce(start_when = 'azonnal', false) or coalesce(start_score, 0) >= 8) stored;

-- Egy változat legyen kitöltve teljesen.
alter table public.applications add constraint applications_version_complete check (
  (questionnaire_version = 1 and pillars is not null and problem is not null and start_when is not null)
  or (questionnaire_version = 2 and answers is not null and start_score is not null)
);

-- A 2. változat beküldése (csak service role: a weboldal szerveroldali kódja).
create or replace function public.submit_application_v2(
  p_full_name text,
  p_email text,
  p_phone text,
  p_answers jsonb,
  p_problem text,
  p_health_consent boolean,
  p_privacy_consent boolean
)
returns public.applications
language plpgsql security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_version text;
  v_i integer;
  v_v jsonb;
begin
  perform public._require_service_role();
  if not coalesce(p_health_consent, false) then
    raise exception 'Az egészségügyi adatok kezeléséhez kifejezett hozzájárulás kell.' using errcode = 'P0001', hint = 'HEALTH_CONSENT_REQUIRED';
  end if;
  if not coalesce(p_privacy_consent, false) then
    raise exception 'Az adatkezelési tájékoztató elfogadása kötelező.' using errcode = 'P0001', hint = 'PRIVACY_CONSENT_REQUIRED';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Hiányos kérdőív.' using errcode = 'P0001', hint = 'INVALID_ANSWERS';
  end if;
  for v_i in 1..15 loop
    v_v := p_answers -> ('q' || v_i);
    if v_v is null or jsonb_typeof(v_v) <> 'number' or (v_v::text)::numeric not between 1 and 10
       or (v_v::text)::numeric <> trunc((v_v::text)::numeric) then
      raise exception 'Hiányos kérdőív.' using errcode = 'P0001', hint = 'INVALID_ANSWERS';
    end if;
  end loop;
  if (select count(*) from jsonb_object_keys(p_answers)) <> 15 then
    raise exception 'Hiányos kérdőív.' using errcode = 'P0001', hint = 'INVALID_ANSWERS';
  end if;
  select health_consent_version into v_version from public.app_settings where id;

  insert into public.applications (
    questionnaire_version, full_name, email, phone, answers, start_score, problem,
    health_consent_at, health_consent_version, privacy_consent_at
  ) values (
    2, btrim(p_full_name), lower(btrim(p_email)), nullif(btrim(p_phone), ''), p_answers,
    (p_answers ->> 'q15')::smallint, nullif(btrim(p_problem), ''),
    now(), v_version, now()
  )
  returning * into v_a;

  insert into public.admin_notifications (kind, payload)
  values ('application', jsonb_build_object('application_id', v_a.id, 'qualified', v_a.qualified));
  return v_a;
end;
$$;

revoke execute on function public.submit_application_v2(text, text, text, jsonb, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.submit_application_v2(text, text, text, jsonb, text, boolean, boolean) to service_role;
