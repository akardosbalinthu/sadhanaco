import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";
import { SittingCircle } from "@/components/illustrations";
import { InquiryForm } from "./inquiry-form";

export const metadata = {
  title: "Cégeknek · Kardos Bálint",
  description:
    "Cégre szabott tréningnapok és programok idegrendszer-fejlesztésről, tradicionális jógikus gyakorlatokkal, modern életmód-orvostani keretrendszerben. Kérj személyre szabott ajánlatot.",
};

// P – a csapat helyzete
const PROBLEM = [
  "Folyamatos határidők és értesítések – a kollégák este sem tudnak igazán kikapcsolni.",
  "A feszültség a megbeszéléseken és a munkahelyi kapcsolatokban is megjelenik.",
  "Egyre nehezebb elmélyülten, egy dologra figyelni.",
  "A nyugalom csak szabadság alatt jön, és az első munkanapon el is múlik.",
];

const FORMS = [
  { title: "Tréningnap", text: "Egy közös nap a csapattal: érthető elmélet és közös gyakorlás, a ti helyzetetekhez igazítva." },
  { title: "Többalkalmas program", text: "Rendszeres alkalmak hetek vagy hónapok alatt, hogy a gyakorlás valóban beépüljön a csapat hétköznapjaiba." },
  { title: "Előadás", text: "Rövidebb alkalom arról, hogyan működik az idegrendszer terhelés alatt, és mit tehetünk érte – akár egy rendezvény részeként." },
  { title: "Egyéni program vezetőknek", text: "Nyolchónapos egyéni program azoknak a vezetőknek, akik maguk is nyugodtabban szeretnének dolgozni." },
];

// O – mi változik (cél, nem garancia)
const OUTCOMES = [
  { title: "Hamarabb visszatalálnak a nyugalomhoz", text: "Egy feszült megbeszélés vagy egy nehéz hét után a kollégák tudják, mit tehetnek, hogy ne vigyék magukkal a feszültséget." },
  { title: "Több figyelem marad a munkára és egymásra", text: "Ha valaki jobban figyel magára, a munkájára és a kollégáira is több figyelme marad." },
  { title: "Közös nyelv a terhelésről", text: "A csapat érti, mi zajlik benne nyomás alatt, és tudja, mit tehet érte – egyénileg és együtt is." },
];

const STEPS = [
  { title: "Ajánlatkérés", text: "Kitöltöd a lenti űrlapot: néhány adat a cégről, és hogy mit szeretnétek elérni." },
  { title: "Egyeztető beszélgetés", text: "Röviden beszélünk arról, mi zajlik most a csapatban, és milyen forma illik hozzátok." },
  { title: "Cégre szabott ajánlat", text: "Elküldöm a javaslatomat a tartalommal, a menetrenddel és a díjjal." },
];

const FAQ = [
  { q: "Mennyibe kerül?", a: "A díj a csapat méretétől, a formától és a helyszíntől függ, ezért minden ajánlat egyedi. A tervezett keretet az űrlapon jelezheted." },
  { q: "Kell hozzá előzetes tapasztalat?", a: "Nem. Az alkalmakat úgy építem fel, hogy az is könnyen bekapcsolódhasson, aki még sosem meditált." },
  { q: "Hol tartjuk?", a: "Nálatok, egy külső helyszínen vagy online – amelyik a csapatnak a legjobban megfelel." },
  { q: "Terápia ez?", a: "Nem. A tréning nem helyettesíti az orvosi vagy pszichológiai kezelést; az egészséges életmódot és a terhelés jobb kezelését támogatja." },
];

export default function BusinessPage() {
  return (
    <main className="py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <PageHeader eyebrow="Cégeknek" title="Nyugodtabb csapat – a nyomás alatt is.">
          <p className="font-serif text-xl text-ink">
            Cégre szabott tréningnapok és programok tradicionális jógikus gyakorlatokkal, modern életmód-orvostani
            keretrendszerben.
          </p>
          <p>
            Ugyanaz a módszer, amellyel egyéni programomban dolgozom, a ti csapatotokra szabva. Középpontjában az
            idegrendszer-fejlesztés áll: hogyan találjunk vissza a nyugalomhoz egy nehéz helyzet után, és hogyan tartsuk
            meg a hétköznapokban.
          </p>
          <p className="flex flex-wrap gap-3 pt-2">
            <a href="#ajanlat" className={buttonPrimary}>
              Ajánlatot kérek
            </a>
            <a href="#formak" className={buttonSecondary}>
              Milyen formában?
            </a>
          </p>
        </PageHeader>
        <SittingCircle className="mx-auto hidden h-48 w-48 lg:block" />
      </div>

      <CompassDivider className="my-20" />

      {/* P + A */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Ismerős?" title="Amikor a csapat folyamatosan készenlétben van" />
          <ul className="mt-8 space-y-3">
            {PROBLEM.map((t) => (
              <li key={t} className="flex items-start gap-3 text-lg text-ink">
                <span className="mt-3 h-px w-5 shrink-0 bg-gold" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 self-end text-lg leading-relaxed text-ink-soft">
          <p>
            Egy csapatépítő vagy egy inspiráló előadás jó élmény, de a hatása néhány nap alatt elmúlik, ha nincs mögötte
            rendszer és gyakorlás.
          </p>
          <p className="text-ink">
            A nyugalom nem szerencse kérdése, hanem tanulható készség – egyénileg és csapatként is.
          </p>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* S */}
      <section id="formak" className="scroll-mt-24">
        <SectionTitle eyebrow="Milyen formában?" title="Négy forma, a ti helyzetetekhez igazítva" />
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft">
          A kollégák megértik, hogyan működik az idegrendszerük terhelés alatt, és olyan eszközöket kapnak a
          nyugalomhoz, amelyeket a munkanapjukba is be tudnak építeni. Az alkalmakat tarthatjuk nálatok, egy külső
          helyszínen vagy online.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {FORMS.map(({ title, text }) => (
            <GildedCard key={title} className="p-7">
              <h3 className="font-serif text-2xl text-forest">{title}</h3>
              <p className="mt-2 text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* O */}
      <section>
        <SectionTitle eyebrow="Amiért dolgozunk" title="Mi változik a csapatban?" />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {OUTCOMES.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Hogyan működik?" title="Három lépés az ajánlatig" />
        <ol className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-gold/30 pt-5">
              <span className="font-serif text-2xl text-gold">{i + 1}.</span>
              <h3 className="mt-2 font-serif text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section className="grid max-w-3xl items-start gap-8 sm:grid-cols-[auto_1fr]">
        <Image
          src="/images/rolam/portre.webp"
          alt="Kardos Bálint portréja"
          width={500}
          height={499}
          sizes="128px"
          className="h-28 w-28 rounded-full border border-gold/40 bg-white object-cover sm:h-32 sm:w-32"
        />
        <div>
          <p className="font-serif text-xl leading-relaxed text-ink">
            A nevem Kardos Bálint. Integratív meditációs és idegrendszer-fejlesztő tréner, életmód-tanácsadó és jógaoktató
            vagyok.
          </p>
          <div className="mt-5 rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Végzettségeim</p>
            <ul className="mt-2 space-y-1 text-[15px] text-ink-soft">
              <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
              <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
            </ul>
          </div>
          <Link href="/rolam" className="mt-5 inline-flex items-center gap-1.5 text-forest underline decoration-gold/50 underline-offset-4 transition-colors duration-500 hover:decoration-gold">
            Az én történetem <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Gyakori kérdések" title="Amit érdemes tudni" />
        <div className="mt-8 max-w-3xl divide-y divide-line border-y border-line">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-forest">
                {q}
                <span className="text-gold transition-transform duration-500 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section id="ajanlat" className="scroll-mt-24">
        <SectionTitle eyebrow="Ajánlatkérés" title="Kérj a cégetekre szabott ajánlatot" />
        <p className="mt-4 max-w-2xl text-ink-soft">Pár perc az egész. Átnézem, és hamarosan jelentkezem.</p>
        <GildedCard ornate className="mt-8 max-w-3xl p-6 sm:p-8">
          <InquiryForm />
        </GildedCard>
      </section>
    </main>
  );
}
