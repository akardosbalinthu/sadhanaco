import { z } from "zod";

/**
 * Nyilvános (kliensre is kerülő) környezeti változók.
 * Szerveroldali titkokat (service role, Stripe) itt NEM olvasunk.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_TARSASAG_URL: z.string().url().default("http://localhost:3000/tarsasag"),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TARSASAG_URL: process.env.NEXT_PUBLIC_TARSASAG_URL,
});
