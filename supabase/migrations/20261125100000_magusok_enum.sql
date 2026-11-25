-- =============================================================================
-- 011a — Új rend: Mágusok (az adminok rendje)
-- Külön migráció: az új enum-érték csak a hozzáadó tranzakció lezárulta után használható.
-- =============================================================================
alter type public.order_key add value if not exists 'magusok';
