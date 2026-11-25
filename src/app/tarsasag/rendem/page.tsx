import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMember, ORDER_INFO, MEMBER_ORDERS } from "@/lib/member";
import { createAdminClient } from "@/lib/supabase/admin";
import { DIMENSIONS, PORTRAITS, type MemberOrder } from "@/lib/ceremony-report";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { OrderCrest } from "@/components/order-crest";
import { buttonPrimary, CompassDivider, GildedCard } from "@/components/ornaments";

export const metadata = { title: "A rendem · A Társaság", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Option = { key: string; text: string; order: MemberOrder };

export default async function MyOrderPage() {
  const { profile } = await requireMember();
  const order = profile.order_key as MemberOrder | "magusok" | null;
  if (!order) redirect(tp("/ceremonia"));

  // A Mágusok rendje szerepkörrel jár, nem kérdőívvel.
  if (order === "magusok" || !profile.compass_scores) {
    const o = ORDER_INFO[order];
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <MemberNav active="" />
        <GildedCard className="p-8 text-center">
          <OrderCrest order={order} className="mx-auto h-28 w-24" />
          <h1 className="mt-4 font-serif text-4xl text-forest">{o.name}</h1>
          <p className="mt-2 text-gold">{o.gift}</p>
          <p className="mx-auto mt-6 max-w-md font-serif italic text-ink">{o.motto}</p>
          <p className="mx-auto mt-6 max-w-md text-sm text-ink-soft">
            {order === "magusok" ? "A Mágusok rendje az út őrzőié; nem a Ceremónia, hanem a feladat jelöli ki." : "A rendedhez nem tartozik kérdőív-kiértékelés."}
          </p>
        </GildedCard>
      </main>
    );
  }

  const scores = profile.compass_scores as Record<MemberOrder, number>;
  const answers = (profile.compass_answers ?? {}) as Record<string, string>;
  const total = MEMBER_ORDERS.reduce((s, k) => s + (scores[k] ?? 0), 0) || 1;
  const ranked = [...MEMBER_ORDERS].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  const primary = order as MemberOrder;
  const second = ranked.find((k) => k !== primary)!;
  const lowest = ranked[ranked.length - 1] === primary ? ranked[ranked.length - 2] : ranked[ranked.length - 1];
  const pct = (k: MemberOrder) => Math.round(((scores[k] ?? 0) / total) * 100);
  const tieDecided = (scores[second] ?? 0) === (scores[primary] ?? 0);
  const strongSecond = (scores[second] ?? 0) >= 3;
  const p = PORTRAITS[primary];
  const o = ORDER_INFO[primary];

  // A válaszok rend-hozzárendelését a kitöltéskor a tag nem látja; itt a szerver olvassa ki a saját válaszaihoz.
  const { data: questions } = await createAdminClient().from("compass_questions").select("id, position, prompt, options").order("position");
  const mine = (questions ?? [])
    .map((q) => {
      const opt = (q.options as unknown as Option[]).find((x) => x.key === answers[String(q.id)]);
      return opt ? { position: q.position, prompt: q.prompt, text: opt.text, order: opt.order } : null;
    })
    .filter(Boolean) as { position: number; prompt: string; text: string; order: MemberOrder }[];
  const ownVoice = mine.filter((a) => a.order === primary).length;

  const sections: [string, string][] = [
    ["Feszült helyzetben", p.stress],
    ["A tested jelzései", p.body],
    ["Ha elkalandozik a figyelmed", p.mind],
    ["Ami visszatölt", p.recharge],
    ["Az erősséged", p.strength],
    ["Amit az úton tanulsz", p.learn],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="" />

      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">A Ceremónia kiértékelése</p>
        <OrderCrest order={primary} className="mx-auto mt-6 h-32 w-28" />
        <h1 className="mt-4 font-serif text-4xl text-forest sm:text-5xl">{o.single} vagy</h1>
        <p className="mt-2 text-gold">{o.name} · {o.gift}</p>
        <p className="mx-auto mt-5 max-w-lg font-serif text-lg italic text-ink">{o.motto}</p>
      </header>

      <p className="mx-auto mt-10 max-w-2xl font-serif text-xl leading-relaxed text-ink">{p.intro}</p>

      <CompassDivider className="my-12" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">A hangolásod</p>
        <h2 className="mt-2 font-serif text-2xl text-forest">Négy hang, különböző erővel</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Mindenkiben mind a négy rend hangja megszólal — a kérdőív azt mutatja, melyik a legerősebb. A tizenkét
          válaszodból {ownVoice} a {o.name.toLowerCase()} hangján szólt.
        </p>
        <ul className="mt-6 space-y-3">
          {ranked.map((k) => (
            <li key={k} className="flex items-center gap-3">
              <OrderCrest order={k} className="h-9 w-8 shrink-0" />
              <span className={`w-24 text-sm ${k === primary ? "text-forest" : "text-ink-soft"}`}>{ORDER_INFO[k].name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                <span className={`block h-full rounded-full ${k === primary ? "bg-gold" : "bg-gold/40"}`} style={{ width: `${pct(k)}%` }} />
              </span>
              <span className="w-10 text-right text-sm text-ink-soft">{pct(k)}%</span>
            </li>
          ))}
        </ul>
        {tieDecided && (
          <p className="mt-4 text-sm text-ink-soft">
            A válaszaid alapján holtverseny alakult ki — a döntő kérdésnél te magad választottad a {o.name.toLowerCase()} útját.
          </p>
        )}
      </section>

      <CompassDivider className="my-12" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Rólad, a válaszaid alapján</p>
        <div className="mt-6 space-y-7">
          {sections.map(([title, text]) => (
            <div key={title}>
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {strongSecond && (
        <GildedCard className="mt-12 p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">A második hangod</p>
          <div className="mt-3 flex items-center gap-4">
            <OrderCrest order={second} className="h-14 w-12 shrink-0" />
            <h3 className="font-serif text-2xl text-forest">
              {ORDER_INFO[second].name} · {pct(second)}%
            </h3>
          </div>
          <p className="mt-4 leading-relaxed text-ink">
            Az alaphangolásod a {o.name.toLowerCase()} rendjéé, de erősen jelen van benned a {ORDER_INFO[second].name.toLowerCase()} hangja is: {PORTRAITS[second].asSecond}.
            A kettő együtt gazdag kiindulópont — {o.gift.toLowerCase()}, kiegészítve azzal, hogy {ORDER_INFO[second].gift.toLowerCase()} is a tiéd.
            Amikor az elsődleges utad elakad, gyakran ez a második hang mutat kiutat.
          </p>
        </GildedCard>
      )}

      <section className="mt-12">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ahol a legtöbbet tanulhatsz</p>
        <div className="mt-3 flex items-center gap-4">
          <OrderCrest order={lowest} className="h-14 w-12 shrink-0" />
          <h3 className="font-serif text-2xl text-forest">{ORDER_INFO[lowest].name} · {pct(lowest)}%</h3>
        </div>
        <p className="mt-4 leading-relaxed text-ink">
          Ez a hang szólt benned a legcsendesebben. Nem hiányosság — inkább egy kapu: {PORTRAITS[lowest].asGrowth} A
          közösségben a {ORDER_INFO[lowest].name.toLowerCase()} tagjaitól sokat tanulhatsz, és ők is tőled.
        </p>
      </section>

      <CompassDivider className="my-12" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">A válaszaid</p>
        <h2 className="mt-2 font-serif text-2xl text-forest">Amit a tizenkét kérdés megmutatott</h2>
        <ol className="mt-6 space-y-4">
          {mine.map((a) => (
            <li key={a.position} className="border-l-2 border-gold/40 pl-4">
              <p className="text-xs uppercase tracking-[0.15em] text-gold">
                {a.position}. {DIMENSIONS[a.position] ?? ""}
                <span className="ml-2 normal-case tracking-normal text-ink-soft">· {ORDER_INFO[a.order].name} hangja</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">{a.prompt}</p>
              <p className="mt-1 font-serif text-ink">„{a.text}”</p>
            </li>
          ))}
        </ol>
      </section>

      <GildedCard className="mt-12 p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Gyakorlás neked</p>
        <p className="mt-3 leading-relaxed text-ink">{p.practice}</p>
        <p className="mt-3 text-sm text-ink-soft">
          Minden rend mindent gyakorol — a heti küldetések mindenkinek ugyanazok. A rended csak azt mutatja, mi lesz
          könnyű, és hol kell majd türelem.
        </p>
        <Link href={tp("/gyakorlas")} className={`${buttonPrimary} mt-6`}>
          Vissza a gyakorlótérbe
        </Link>
      </GildedCard>

      <p className="mt-10 text-center text-xs text-ink-soft">
        A Ceremónia kérdőíve önismereti eszköz, nem pszichológiai vizsgálat vagy diagnózis. Nincs jó vagy rossz
        eredmény: minden rend egyenrangú, és minden rend mindent gyakorol — csak a kiindulópont más. A rended végleges.
      </p>
    </main>
  );
}
