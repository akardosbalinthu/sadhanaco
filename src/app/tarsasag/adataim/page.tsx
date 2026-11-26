import { requireMember } from "@/lib/member";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { tp } from "@/lib/site";
import { saveNames, setNotifications } from "./actions";
import { NameFields } from "./name-preview";

export const metadata = { title: "Adataim · Programom", robots: { index: false, follow: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MyDetailsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireMember();
  const { data: paidProgram } = await supabase
    .from("program_enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .in("payment_plan", ["egyeni_program_4_reszlet", "egyeni_program_havi"])
    .limit(1);
  const hiba = typeof sp.hiba === "string" ? sp.hiba : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/adataim" />
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Programom · Adataim</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Hogyan szólíthatunk?</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Így szólítalak a felületen és a leveleimben. Ha van beceneved, amit szívesen hallasz, add meg.
      </p>

      {sp.ok && <p role="status" className="mt-6 rounded-md border border-gold/50 px-4 py-3 text-sm text-forest">Elmentve.</p>}
      {hiba && <p role="status" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{hiba}</p>}

      <GildedCard className="mt-8 p-7">
        <form action={saveNames} className="space-y-6">
          <NameFields last={profile.last_name ?? ""} first={profile.first_name ?? ""} nick={profile.nickname ?? ""} />
          <button className={buttonPrimary}>Mentés</button>
        </form>
      </GildedCard>

      <section id="ertesitesek" className="mt-12 scroll-mt-24 border-t border-gold/25 pt-8">
        <h2 className="font-serif text-2xl text-forest">Értesítések</h2>
        <p className="mt-3 text-sm text-ink-soft">
          {profile.notify_admin_updates
            ? "E-mailt kapsz, amikor új Nyílt Est vagy más alkalom indul."
            : "Most nem kapsz levelet az újdonságokról."}{" "}
          A programodról és a foglalásaidról szóló leveleket mindenképp megkapod.
        </p>
        <form action={setNotifications} className="mt-4">
          <input type="hidden" name="on" value={profile.notify_admin_updates ? "false" : "true"} />
          <button className={buttonSecondary}>{profile.notify_admin_updates ? "Nem kérek ilyen levelet" : "Kérem a leveleket az újdonságokról"}</button>
        </form>
      </section>

      <section className="mt-12 border-t border-gold/25 pt-8">
        <h2 className="font-serif text-2xl text-forest">Belépés</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Belépési e-mail-címed: <span className="text-forest">{profile.email}</span>. Ha módosítanád, írj nekem.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {/* A megszűnt Társaság régi előfizetéseinek kezelése (ha van ilyen). */}
          {(paidProgram?.length ?? 0) > 0 && profile.stripe_customer_id && (
            <form action={tp("/elofizetes")} method="post">
              <button className={buttonSecondary}>Fizetési kártya frissítése</button>
            </form>
          )}
          {profile.tier !== "none" && (
            <form action={tp("/elofizetes")} method="post">
              <button className={buttonSecondary}>Korábbi előfizetés kezelése</button>
            </form>
          )}
          <form action={tp("/auth/kijelentkezes")} method="post">
            <button className={buttonSecondary}>Kijelentkezés</button>
          </form>
        </div>
      </section>
    </main>
  );
}
