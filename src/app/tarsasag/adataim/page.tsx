import { requireMember } from "@/lib/member";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { tp } from "@/lib/site";
import { saveNames, setNotifications } from "./actions";
import { NameFields } from "./name-preview";

export const metadata = { title: "Adataim · A Társaság", robots: { index: false, follow: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MyDetailsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { profile } = await requireMember();
  const hiba = typeof sp.hiba === "string" ? sp.hiba : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/adataim" />
      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Adataim</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Hogyan szólíthatunk?</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        A Társaságban a teljes neveddel jelensz meg. Ha van beceneved, amit szívesen hallasz, add meg — a neved után,
        idézőjelben látszik majd.
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
            ? "E-mailt kapsz, amikor új alkalom, bejegyzés vagy túra-szavazás indul A Társaságban."
            : "Most nem kapsz levelet az újdonságokról — az Események és a Közösség oldalon így is mindent látsz."}{" "}
          A foglalásaidról és fizetéseidről szóló leveleket mindenképp megkapod.
        </p>
        <form action={setNotifications} className="mt-4">
          <input type="hidden" name="on" value={profile.notify_admin_updates ? "false" : "true"} />
          <button className={buttonSecondary}>{profile.notify_admin_updates ? "Nem kérek ilyen levelet" : "Kérem a leveleket az újdonságokról"}</button>
        </form>
      </section>

      <section className="mt-12 border-t border-gold/25 pt-8">
        <h2 className="font-serif text-2xl text-forest">Tagság és belépés</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Belépési e-mail-címed: <span className="text-forest">{profile.email}</span>. Ennek módosításához írj nekünk.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={tp("/udvozlunk")} className={buttonSecondary}>
            A bevezető újra
          </a>
          <form action={tp("/elofizetes")} method="post">
            <button className={buttonSecondary}>Előfizetés kezelése</button>
          </form>
          <form action={tp("/auth/kijelentkezes")} method="post">
            <button className={buttonSecondary}>Kijelentkezés</button>
          </form>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Az előfizetés kezelésénél módosíthatod a bankkártyádat, vagy lemondhatod a tagságot (a lemondás a következő
          számlázási időszaktól él). A számláidat e-mailben kapod meg.
        </p>
      </section>
    </main>
  );
}
