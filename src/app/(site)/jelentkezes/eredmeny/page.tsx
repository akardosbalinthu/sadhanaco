import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sprout as SproutIcon } from "lucide-react";
import { lifestyleMap, RESULT_TEXT, type Answers } from "@/lib/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { LifestyleRadar } from "@/components/lifestyle-map";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, PageHeader } from "@/components/ornaments";

export const metadata = { title: "Az Életmód-térképed · Kardos Bálint", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/jelentkezes");
  const { data: app } = await createAdminClient()
    .from("applications")
    .select("full_name, answers, questionnaire_version, qualified")
    .eq("token", token)
    .maybeSingle();
  if (!app) redirect("/jelentkezes");
  if (app.questionnaire_version !== 2 || !app.answers) redirect(`/jelentkezes/idopont?t=${token}`);

  const map = lifestyleMap(app.answers as unknown as Answers);
  const first = app.full_name.split(/\s+/).slice(-1)[0];

  return (
    <main className="py-16">
      <PageHeader eyebrow="Az Életmód-térképed" title={`${first}, így állsz most.`}>
        <p>A hat életmód-pillér az elmúlt két hét alapján, 1-től 10-ig. Nem minősítés, hanem pillanatkép arról, honnan indulsz.</p>
      </PageHeader>

      <section className="mt-12 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <GildedCard className="p-4 sm:p-8">
          <LifestyleRadar values={map.pillars.map((p) => ({ name: p.name, value: p.value }))} className="mx-auto w-full max-w-lg" />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Befelé</p>
              <p className="mt-1 font-serif text-2xl text-forest">{map.inward.toLocaleString("hu-HU")}</p>
              <p className="text-xs text-ink-soft">figyelem a testedre és a jelenre</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Kifelé</p>
              <p className="mt-1 font-serif text-2xl text-forest">{map.outward.toLocaleString("hu-HU")}</p>
              <p className="text-xs text-ink-soft">kapcsolódás másokhoz</p>
            </div>
          </div>
        </GildedCard>

        <div className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Az erősséged</p>
            <h2 className="mt-2 font-serif text-2xl text-forest">{map.strongest.name}</h2>
            <p className="mt-2 text-ink-soft">{map.strongest.strength} Erre biztosan építhetsz.</p>
          </div>
          {map.weakest && (
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold">A következő kis lépésed</p>
              <h2 className="mt-2 font-serif text-2xl text-forest">{map.weakest.name}</h2>
              <div className="mt-3 flex gap-3 rounded-lg bg-paper-deep/70 p-4">
                <SproutIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                <p className="text-ink">{map.weakest.tip}</p>
              </div>
            </div>
          )}
          <p className="text-ink-soft">{RESULT_TEXT.longTerm}</p>
        </div>
      </section>

      <CompassDivider className="my-16" />

      <section className="mx-auto max-w-2xl text-center">
        <p className="text-lg leading-relaxed text-ink">{app.qualified ? RESULT_TEXT.qualified : RESULT_TEXT.later}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {app.qualified ? (
            <Link href={`/jelentkezes/idopont?t=${token}`} className={buttonPrimary}>
              {RESULT_TEXT.qualifiedCta} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          ) : (
            <Link href="/nyilt-estek" className={buttonPrimary}>
              {RESULT_TEXT.laterCta} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          )}
          <Link href="/#modszer" className={buttonSecondary}>
            A módszerem
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-soft">Az eredményedet e-mailben is elküldtem.</p>
      </section>
    </main>
  );
}
