# Sadhana Idegrendszerfejlesztő Társaság

Next.js 15 (App Router) + Supabase webalkalmazás. A kötelező érvényű specifikáció: [`CLAUDE.md`](./CLAUDE.md).

## Helyi fejlesztés

```bash
npm install
cp .env.example .env.local        # majd töltsd ki (npx supabase status kiírja a kulcsokat)
npm run db:start                  # helyi Supabase (Docker kell)
npm run db:reset                  # migrációk + seed újrafuttatása
npm run db:test                   # pgTAP tesztek
npm run dev
```

A helyi Magic Link leveleket a Mailpit/Inbucket felületen látod: http://127.0.0.1:54324

Éles (`kqvxosoqmwscymaoqhyj`) Supabase projektre migrációt csak Bálint jóváhagyásával alkalmazunk.
