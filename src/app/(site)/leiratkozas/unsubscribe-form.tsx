"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { buttonPrimary } from "@/components/ornaments";
import { unsubscribe, type UnsubState } from "./actions";

export function UnsubscribeForm({ token, settingsHref }: { token: string; settingsHref: string }) {
  const [state, action, pending] = useActionState(unsubscribe, { status: "idle" } as UnsubState);
  if (state.status === "ok") {
    return (
      <div role="status" className="flex items-start gap-3 text-forest">
        <Check className="mt-1 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        <p className="leading-relaxed">
          Kész, több ilyen levelet nem küldök. Az újdonságokat továbbra is látod A Társaság felületén, és az{" "}
          <a href={settingsHref} className="underline decoration-gold/60 underline-offset-4">Adataim</a> oldalon bármikor
          visszakapcsolhatod.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="t" value={token} />
      {state.status === "error" && <p role="alert" className="text-sm text-alert">Ez a link nem érvényes. Az Adataim oldalon is leiratkozhatsz.</p>}
      <button disabled={pending} className={buttonPrimary}>
        {pending ? "Egy pillanat…" : "Leiratkozom"}
      </button>
    </form>
  );
}
