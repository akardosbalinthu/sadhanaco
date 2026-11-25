import Link from "next/link";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { closePoll, createPoll, linkPollEvent } from "../actions";
import { Empty, Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../ui";
import { SubmitButton } from "../submit-button";

const monthName = (d: string) => new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d));

export default async function AdminHikes({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: polls }, { data: hikes }] = await Promise.all([
    supabase.from("destination_polls").select("*").order("month", { ascending: false }).limit(12),
    supabase.from("events").select("id, title, starts_at").eq("kind", "tura").is("cancelled_at", null).order("starts_at", { ascending: false }).limit(20),
  ]);
  const results = await Promise.all(
    (polls ?? []).map((p) => supabase.rpc("destination_poll_results", { p_poll_id: p.id }).then((r) => [p.id, r.data ?? []] as const)),
  );
  const resultsBy = new Map(results);
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Úti cél szavazások</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Hónaponként egy szavazás, 5–10 úti céllal. A tagok a lezárásig csak a saját szavazatukat látják; te itt
          mindig látod az állást. Holtversenynél te választasz.
        </p>
        {(polls ?? []).length === 0 ? (
          <Empty>Még nincs szavazás.</Empty>
        ) : (
          <ul className="mt-6 space-y-4">
            {polls!.map((p) => {
              const rows = resultsBy.get(p.id) ?? [];
              const closed = !!p.winning_option_id;
              const total = rows.reduce((s, r) => s + r.votes, 0);
              return (
                <li key={p.id}>
                  <GildedCard>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-serif text-xl text-forest">
                        {monthName(p.month)} · {p.title}
                      </h3>
                      <p className="text-sm text-ink-soft">
                        {closed ? "Lezárva" : `Zárul: ${fmtDateTime(p.closes_at)}`} · {total} szavazat
                      </p>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm">
                      {rows.map((r) => (
                        <li key={r.option_id} className="flex gap-3">
                          <span className={r.is_winner ? "text-gold" : "text-forest"}>
                            {r.name}
                            {r.is_winner && " — a cél"}
                          </span>
                          <span className="ml-auto text-ink-soft">{r.votes}</span>
                        </li>
                      ))}
                    </ul>
                    {!closed ? (
                      <form action={closePoll} className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                        <input type="hidden" name="id" value={p.id} />
                        <select name="option_id" defaultValue="" className={smallInput}>
                          <option value="">A legtöbb szavazatot kapott cél</option>
                          {rows.map((r) => (
                            <option key={r.option_id} value={r.option_id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <button className={smallButton}>Szavazás lezárása</button>
                      </form>
                    ) : (
                      <div className="mt-5 border-t border-line pt-4 text-sm">
                        {p.event_id ? (
                          <Link href={tp(`/admin/esemenyek?esemeny=${p.event_id}`)} className="text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
                            A kiírt túra megnyitása
                          </Link>
                        ) : (hikes ?? []).length > 0 ? (
                          <form action={linkPollEvent} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <select name="event_id" className={smallInput}>
                              {hikes!.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {h.title} · {fmtDateTime(h.starts_at)}
                                </option>
                              ))}
                            </select>
                            <button className={smallButton}>Túra hozzárendelése</button>
                          </form>
                        ) : (
                          <p className="text-ink-soft">
                            Hozd létre a túrát az{" "}
                            <Link href={tp("/admin/esemenyek")} className="text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
                              Események
                            </Link>{" "}
                            oldalon („Közös túra” típussal), majd rendeld ide.
                          </p>
                        )}
                      </div>
                    )}
                  </GildedCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <H2>Új szavazás</H2>
        <GildedCard className="mt-6">
          <form action={createPoll} className="grid gap-3 sm:grid-cols-6">
            <label className="sm:col-span-2">
              <span className={label}>A túra hónapja</span>
              <input type="month" name="month" required defaultValue={next} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-4">
              <span className={label}>Cím</span>
              <input name="title" placeholder="Hová menjünk túrázni?" className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-6">
              <span className={label}>Bevezető (nem kötelező)</span>
              <textarea name="description" rows={2} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-6">
              <span className={label}>Úti célok — soronként egy (5–10); leírás „ — ” után</span>
              <textarea
                name="options"
                rows={7}
                required
                placeholder={"Pilis, Dobogókő — könnyű, 12 km\nBörzsöny, Csóványos — közepes, 16 km\n…"}
                className={`${smallInput} mt-1 w-full font-mono text-xs`}
              />
            </label>
            <label className="sm:col-span-3">
              <span className={label}>Szavazás zárul</span>
              <input type="datetime-local" name="closes_at" required className={`${smallInput} mt-1 w-full`} />
            </label>
            <div className="flex items-end justify-end sm:col-span-3">
              <SubmitButton className={smallPrimary}>Szavazás kiírása</SubmitButton>
            </div>
          </form>
        </GildedCard>
      </section>
    </div>
  );
}
