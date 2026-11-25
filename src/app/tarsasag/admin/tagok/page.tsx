import Link from "next/link";
import { fmtDate, requireAdmin, STATUS_LABEL, TIER_LABEL } from "@/lib/admin";
import { MEMBER_ORDERS, ORDER_INFO, type OrderKey } from "@/lib/member";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { setOrder, setRole, setUnlocks } from "../actions";
import { Empty, Flash, H2, label, one, smallButton, smallInput, smallPrimary, type SP } from "../ui";

export default async function AdminMembers({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase, isSuperadmin } = await requireAdmin();
  const q = one(sp.q).trim();
  const tagId = one(sp.tag);
  const all = one(sp.mind) === "1";

  let query = supabase
    .from("profiles")
    .select("id, display_name, email, tier, subscription_status, order_key, current_period_end, trial_ends_at, cancel_at_period_end, role")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!all) query = query.neq("tier", "none");
  if (q) {
    // A keresőkifejezésből kivesszük a PostgREST-szűrő vezérlőkarakterait.
    const safe = q.replace(/[,()*%\\]/g, " ").trim();
    if (safe) query = query.or(`email.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }

  const [{ data: members }, { data: top10 }, selected] = await Promise.all([
    query,
    supabase.rpc("admin_quarter_top10"),
    tagId
      ? supabase.from("profiles").select("*").eq("id", tagId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const t = selected.data;
  const { data: xp } = t
    ? await supabase.from("xp_events").select("xp").eq("user_id", t.id).gte("created_at", t.membership_started_at ?? "1970-01-01")
    : { data: null };
  const totalXp = (xp ?? []).reduce((s, e) => s + e.xp, 0);

  return (
    <div className="space-y-14">
      <Flash sp={sp} />

      {t && (
        <section>
          <GildedCard className="p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-forest">{t.display_name || t.email}</h2>
                <p className="mt-1 text-sm text-ink-soft">{t.email}</p>
                <p className="mt-3 text-sm text-ink-soft">
                  {TIER_LABEL[t.tier]} · {STATUS_LABEL[t.subscription_status] ?? t.subscription_status}
                  {t.billing_interval && ` · ${t.billing_interval === "year" ? "éves" : "havi"}`}
                  {t.cancel_at_period_end && " · lemondva a ciklus végén"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Belépett: {fmtDate(t.membership_started_at)} · Következő ciklus: {fmtDate(t.current_period_end)}
                  {t.trial_ends_at && ` · Próba vége: ${fmtDate(t.trial_ends_at)}`}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Rend: {t.order_key ? ORDER_INFO[t.order_key as OrderKey].name : "még nincs (Ceremónia)"} · XP ebben a ciklusban: {totalXp}
                  {" · "}Díjmentes üzenet: {t.free_messages_remaining} · Konzultáció: {t.free_consultations_remaining}
                </p>
              </div>
              <Link href={tp("/admin/tagok")} className="text-sm text-ink-soft hover:text-gold">
                Bezárás
              </Link>
            </div>

            <form action={setUnlocks} className="mt-8 border-t border-line pt-6">
              <input type="hidden" name="id" value={t.id} />
              <p className={label}>Lépcsők (csak kézzel nyílnak)</p>
              <div className="mt-3 flex flex-wrap gap-6 text-sm">
                {(
                  [
                    ["m2_unlocked", "II. lépcső", t.m2_unlocked, t.m2_purchased],
                    ["ip3_unlocked", "III. lépcső", t.ip3_unlocked, t.ip3_purchased],
                    ["retreat_unlocked", "IV. lépcső – Szabadság Elvonulás", t.retreat_unlocked, false],
                  ] as const
                ).map(([name, text, on, bought]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" name={name} defaultChecked={on} className="accent-[var(--color-gold)]" />
                    {text}
                    {bought && <span className="text-xs text-gold">(gyorsítva megvásárolta)</span>}
                  </label>
                ))}
              </div>
              <button className={`${smallPrimary} mt-4`}>Lépcsők mentése</button>
              <p className="mt-2 text-xs text-ink-soft">
                Rendes esetben a Továbblépések oldalon, a konzultáció után nyitod meg; ez a kézi javításhoz való.
              </p>
            </form>

            {isSuperadmin && (
              <div className="mt-8 flex flex-wrap gap-8 border-t border-line pt-6">
                <form action={setRole} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <label>
                    <span className={label}>Szerepkör</span>
                    <select name="role" defaultValue={t.role === "superadmin" ? "admin" : t.role} className={`${smallInput} mt-1`} disabled={t.role === "superadmin"}>
                      <option value="member">Tag</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  {t.role !== "superadmin" && <button className={smallButton}>Mentés</button>}
                </form>
                <form action={setOrder} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <label>
                    <span className={label}>Rend javítása</span>
                    <select name="order" defaultValue={t.order_key ?? "tundek"} className={`${smallInput} mt-1`}>
                      {(t.role === "member" ? [...MEMBER_ORDERS] : (["magusok"] as OrderKey[])).map((k) => (
                        <option key={k} value={k}>
                          {ORDER_INFO[k].name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className={smallButton}>Javítás</button>
                </form>
              </div>
            )}
          </GildedCard>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <H2>Tagok</H2>
          <form className="flex flex-wrap items-center gap-2">
            <input name="q" defaultValue={q} placeholder="Név vagy e-mail" className={smallInput} />
            <label className="flex items-center gap-1.5 text-xs text-ink-soft">
              <input type="checkbox" name="mind" value="1" defaultChecked={all} className="accent-[var(--color-gold)]" />
              volt tagok is
            </label>
            <button className={smallButton}>Keresés</button>
          </form>
        </div>
        {(members ?? []).length === 0 ? (
          <Empty>Nincs találat.</Empty>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-ink-soft">
                <tr className="border-b border-line">
                  <th className="py-2 pr-4 font-normal">Név</th>
                  <th className="py-2 pr-4 font-normal">Csomag</th>
                  <th className="py-2 pr-4 font-normal">Állapot</th>
                  <th className="py-2 pr-4 font-normal">Rend</th>
                  <th className="py-2 font-normal">Következő ciklus</th>
                </tr>
              </thead>
              <tbody>
                {members!.map((m) => (
                  <tr key={m.id} className="border-b border-line/60">
                    <td className="py-2.5 pr-4">
                      <Link href={tp(`/admin/tagok?tag=${m.id}`)} className="text-forest hover:text-gold">
                        {m.display_name || m.email}
                      </Link>
                      <p className="text-xs text-ink-soft">{m.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">{TIER_LABEL[m.tier]}</td>
                    <td className="py-2.5 pr-4 text-ink-soft">
                      {STATUS_LABEL[m.subscription_status] ?? m.subscription_status}
                      {m.cancel_at_period_end && " (lemondva)"}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">{m.order_key ? ORDER_INFO[m.order_key as OrderKey].name : "–"}</td>
                    <td className="py-2.5 text-ink-soft">{fmtDate(m.subscription_status === "trialing" ? m.trial_ends_at : m.current_period_end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <H2>Negyedéves vacsorameghívás</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          A negyedéves ranglista első tíz helyezettje, az elrejtett tagokkal együtt. Ez a lista csak itt látszik.
        </p>
        {(top10 ?? []).length === 0 ? (
          <Empty>Ebben a negyedévben még nincs XP.</Empty>
        ) : (
          <ol className="mt-6 space-y-1.5 text-sm">
            {top10!.map((p) => (
              <li key={p.user_id} className="flex gap-3">
                <span className="w-6 text-right font-serif text-gold">{p.pos}.</span>
                <span className="text-forest">{p.display_name || p.email}</span>
                <span className="text-ink-soft">{p.email}</span>
                <span className="ml-auto text-ink-soft">{p.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
