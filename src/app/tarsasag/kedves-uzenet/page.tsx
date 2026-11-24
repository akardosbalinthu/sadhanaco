import { requireMember } from "@/lib/member";
import { publicEnv } from "@/lib/env";
import { MemberNav } from "@/components/member-nav";
import { GildedCard } from "@/components/ornaments";
import { KindMessageForm } from "@/components/kind-message-form";
import { sendMemberMessage } from "./actions";

export const metadata = { title: "Kedves Üzenet · A Társaság", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = {
  queued: "sorban vár",
  scheduled: "időpont egyeztetve",
  followup: "folyamatban — még próbálom elérni",
  delivered: "kézbesítve",
  failed: "nem sikerült elérni",
  rejected: "nem kézbesíthető",
  pending_confirmation: "megerősítésre vár",
};

const when = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "short", day: "numeric" });

export default async function MemberKindMessagePage() {
  const { supabase, profile, hasAccess } = await requireMember();
  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MemberNav active="/kedves-uzenet" />
        <GildedCard className="text-sm text-ink-soft">Az Elsőbbségi Kedves Üzenet A Társaság aktív tagjainak érhető el.</GildedCard>
      </main>
    );
  }

  const { data: paying } = await supabase.rpc("is_paying_member");
  const trial = profile.subscription_status === "trialing";
  const left = paying ? profile.free_messages_remaining : 0;
  const { data: mine } = await supabase
    .from("kind_messages")
    .select("id, recipient_name, kind, status, created_at")
    .eq("sender_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const priorityText = trial
    ? "A díjmentes elsőbbségi keret az első sikeres fizetés után nyílik meg."
    : left > 0
    ? `Ebben a hónapban még ${left} díjmentes elsőbbségi üzeneted van. Elsőként kézbesítem, garanciával.`
    : "Ebben a hónapban már elküldted a díjmentes elsőbbségi üzeneteidet; a keret hó 1-jén újraindul.";

  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/kedves-uzenet" />
      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Egy Kedves Üzenet</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Kinek mondanál ma köszönetet?</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Megírod, én pedig egy meglepetés-telefonhívásban átadom. Tagként nem kell megerősítened az üzenetet, és a havi
        keretedből elsőbbséggel küldheted.
      </p>

      <GildedCard className="mt-8 p-7">
        <KindMessageForm
          action={sendMemberMessage}
          termsHref={`${site}/aszf#p11`}
          choices={[
            { value: "priority", title: "Elsőbbségi", text: priorityText, disabled: trial || left <= 0 },
            { value: "standard", title: "Díjmentes", text: "Bármikor küldhetsz; a beérkezés sorrendjében kézbesítem, három próbálkozással." },
          ]}
        />
      </GildedCard>
      <p className="mt-4 text-xs text-ink-soft">
        A kereten felüli, általad választott összegű elsőbbségi üzenet hamarosan itt is elérhető lesz.
      </p>

      {(mine ?? []).length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-forest">Az üzeneteid</h2>
          <ul className="mt-5 space-y-2 text-sm">
            {mine!.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{m.recipient_name}</span>
                <span className="text-ink-soft">{m.kind === "priority" ? "elsőbbségi" : "díjmentes"}</span>
                <span className={m.status === "delivered" ? "text-gold" : "text-ink-soft"}>{STATUS[m.status] ?? m.status}</span>
                <span className="ml-auto text-ink-soft">{when.format(new Date(m.created_at))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
