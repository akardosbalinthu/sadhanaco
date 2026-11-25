-- =============================================================================
-- 017 — Új rangnevek: céhes út (CLAUDE.md 7.20)
-- Tanonc → Inas → Legény → Vándorlegény → Mester → Nagymester → Bölcs.
-- A küszöbök (XP) és a továbblépési feltételek nem változnak.
-- =============================================================================

alter table public.app_settings alter column xp_ranks set default '[
  {"key": "tanonc",       "label": "Tanonc",       "xp": 0},
  {"key": "inas",         "label": "Inas",         "xp": 150},
  {"key": "legeny",       "label": "Legény",       "xp": 500},
  {"key": "vandorlegeny", "label": "Vándorlegény", "xp": 1200},
  {"key": "mester",       "label": "Mester",       "xp": 2500},
  {"key": "nagymester",   "label": "Nagymester",   "xp": 4500},
  {"key": "bolcs",        "label": "Bölcs",        "xp": 7000}
]'::jsonb;

update public.app_settings set xp_ranks = '[
  {"key": "tanonc",       "label": "Tanonc",       "xp": 0},
  {"key": "inas",         "label": "Inas",         "xp": 150},
  {"key": "legeny",       "label": "Legény",       "xp": 500},
  {"key": "vandorlegeny", "label": "Vándorlegény", "xp": 1200},
  {"key": "mester",       "label": "Mester",       "xp": 2500},
  {"key": "nagymester",   "label": "Nagymester",   "xp": 4500},
  {"key": "bolcs",        "label": "Bölcs",        "xp": 7000}
]'::jsonb
where id;
