import { redirect } from "next/navigation";

/** A jelentkezés a kérdőívvel indul; a régi /konzultacio linkek oda vezetnek (a forrásjelöléssel együtt). */
export default async function ConsultationRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.utm_source ?? sp.forras;
  const src = Array.isArray(raw) ? raw[0] : raw;
  redirect(src ? `/jelentkezes?utm_source=${encodeURIComponent(src)}` : "/jelentkezes");
}
