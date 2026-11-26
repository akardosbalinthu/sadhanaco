import { publicEnv } from "@/lib/env";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonPrimary, buttonSecondary, PageHeader } from "@/components/ornaments";

export const metadata = { title: "Az oldal nem található · Kardos Bálint", robots: { index: false, follow: false } };

/** Saját 404-es oldal. A linkek abszolútak, hogy a résztvevői aldomainről is a fő oldalra vigyenek. */
export default function NotFound() {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <PageHeader eyebrow="404" title="Ez az oldal nem található.">
          <p>Lehet, hogy elírás történt a címben, vagy az oldal már nem létezik. Semmi baj – innen is könnyen továbbmehetsz.</p>
        </PageHeader>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href={`${site}/`} className={buttonPrimary}>
            Vissza a kezdőlapra
          </a>
          <a href={`${site}/jelentkezes`} className={buttonSecondary}>
            Kérem az Életmód-térképem
          </a>
        </div>
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft" aria-label="További oldalak">
          {[
            ["/nyilt-estek", "Nyílt Estek"],
            ["/egy-kedves-uzenet", "Egy Kedves Üzenet"],
            ["/rolam", "Rólam"],
          ].map(([path, label]) => (
            <a key={path} href={`${site}${path}`} className="underline decoration-gold/50 underline-offset-4 transition-colors duration-300 hover:text-gold">
              {label}
            </a>
          ))}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
