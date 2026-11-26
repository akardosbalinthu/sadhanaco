-- Honnan érkezett a jelentkező: a kérdőív nem kötelező „Honnan hallottál rólam?” válasza
-- és a link forrásjelölése (pl. ?utm_source=youtube). Csak az admin látja (a tábla RLS-e változatlan).
alter table public.applications
  add column heard_from text check (heard_from is null or char_length(heard_from) <= 40),
  add column utm_source text check (utm_source is null or utm_source ~ '^[a-z0-9_.-]{1,60}$');
