-- =============================================================================
-- 028 — A konzultációs időpontok alapértelmezett hossza 55 perc (2026. november 28.)
-- =============================================================================
alter table public.app_settings alter column consultation_default_minutes set default 55;
alter table public.consultation_slots alter column duration_minutes set default 55;
update public.app_settings set consultation_default_minutes = 55, updated_at = now() where id;
