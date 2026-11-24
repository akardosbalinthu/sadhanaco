-- =============================================================================
-- seed.sql — tananyag-ív (4 lépcső) és árkonstansok (HUF)
-- Idempotens: többször is futtatható (ON CONFLICT ... DO UPDATE).
-- Forrás: CLAUDE.md 4. és 5. pont.
-- =============================================================================

insert into public.modules (stage, slug, title, subtitle, description, total_weeks) values
  (1, 'jelenlet',
   'I. Modul — Jelenlét',
   'I. Integrációs Program (IP 1) · 8+1 hét',
   'A légzés mechanikájától a test érzékeléséig. Rövid elméleti videók és napi 10–15 perces vezetett gyakorlatok: Anapanaszati, Sama Vritti, Nadi Shodhana, Kájánupassaná.',
   9),
  (2, 'tudatossag',
   'II. Modul — Tudatosság',
   'II. Integrációs Program (IP 2) · 8+1 hét',
   'A figyelem finomabb szabályozása az első lépcső stabil gyakorlására építve. Admin jóváhagyással nyílik meg.',
   9),
  (3, 'ip3',
   'III. Integrációs Program (IP 3)',
   'Felkészülés a Szabadság Elvonulásra · 8+1 hét',
   'A Szabadság Elvonulás előfeltétele. Admin jóváhagyással nyílik meg.',
   9),
  (4, 'szabadsag-elvonulas',
   'III. Modul — Szabadság Elvonulás',
   'Évente 3 alkalom · 3–4 napos zárt elvonulás',
   'Az IP 3 elvégzése és jóváhagyás után válik láthatóvá és foglalhatóvá.',
   null)
on conflict (stage) do update set
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  total_weeks = excluded.total_weeks;

-- stripe_product_id: éles Stripe-termék (akardosbalint.hu fiók). Az árat a Stripe-ban
-- lookup_key = code alapján keressük, így árváltozáskor csak a Stripe-ot kell frissíteni.
-- Stripe-ban a HUF kéttizedes: 9 940 Ft = unit_amount 994000.
insert into public.price_catalog (code, label, amount_huf, tier, billing_interval, stripe_product_id) values
  -- Tagságok (alapítói kupon nincs — 2026. nov. döntés)
  ('tarsasagi_havi',           'Társasági Tagság — havi',                    9940,   'tarsasagi', 'month', 'prod_VgbrLOKdZgQqyM'),
  ('tarsasagi_eves',           'Társasági Tagság — éves (2 hónap ajándék)',  99400,  'tarsasagi', 'year',  'prod_VgbrLOKdZgQqyM'),
  ('belso_kor_havi',           'Belső Kör — havi',                           27940,  'belso_kor', 'month', 'prod_VgbtwmiPVKTIme'),
  ('belso_kor_eves',           'Belső Kör — éves (2 hónap ajándék)',         279400, 'belso_kor', 'year',  'prod_VgbtwmiPVKTIme'),
  -- Gyorsított lépcsők (admin jóváhagyással nyílnak)
  ('gyorsitott_m2_ip2',        'II. Modul + IP 2 — gyorsított hozzáférés',   54940,  null, null, 'prod_VgbwbICFQliZfC'),
  ('gyorsitott_ip3',           'IP 3 — gyorsított hozzáférés',               44940,  null, null, 'prod_VgbwI6pIJhOfRS'),
  ('gyorsitott_m2_ip3_csomag', 'II. Modul + IP 2 + IP 3 — csomag',           89940,  null, null, 'prod_VgbwymkGkEr3BR'),
  -- Események (terembérleti hozzájárulás)
  ('nyilt_est_kulsos',         'Nyílt Meditációs Est — külsős',              4940,   null, null, null),
  ('nyilt_est_tarsasagi',      'Nyílt Meditációs Est — Társasági Tag',       3200,   null, null, 'prod_VgbwHLurwdeqiB'),
  ('nyilt_est_belso_kor',      'Nyílt Meditációs Est — Belső Kör',           0,      null, null, null),
  ('gyakorlonap_tarsasagi',    'Élő Gyakorlónap — Társasági Tag',            6460,   null, null, 'prod_VgbwzJ9WLwj3sm'),
  ('gyakorlonap_belso_kor',    'Élő Gyakorlónap — Belső Kör',                0,      null, null, null),
  -- 1-on-1 konzultáció
  ('konzultacio_tarsasagi',    '1-on-1 konzultáció — Társasági Tag',         15000,  null, null, 'prod_VgbwTM5LbEZbJp'),
  ('konzultacio_belso_kor',    '1-on-1 konzultáció — Belső Kör',             13000,  null, null, 'prod_VgbwTM5LbEZbJp'),
  -- Kereten felüli Kedves Üzenet: szabadon választott összeg, ez a minimum
  ('kedves_uzenet_extra',      'Kedves Üzenet — kereten felüli (minimum)',   1000,   null, null, 'prod_VgbwF1NbmherdR'),
  -- Szabadság Elvonulás: alkalmanként változó önköltség, az ár az events táblában
  ('elvonulas',                'Szabadság Elvonulás — önköltség (eseményenként)', 0, null, null, 'prod_VgbwyB3bE8BEvE')
on conflict (code) do update set
  label = excluded.label,
  amount_huf = excluded.amount_huf,
  tier = excluded.tier,
  billing_interval = excluded.billing_interval,
  stripe_product_id = excluded.stripe_product_id;

-- Megjegyzés: a Szabadság Elvonulás önköltséges ára (kb. 65 000 – 85 000 Ft)
-- alkalmanként változik, ezért az events.price_tarsasagi_huf mezőben adjuk meg.
-- Checkoutnál price_data-val, a fenti 'elvonulas' Stripe-termékre hivatkozva.
