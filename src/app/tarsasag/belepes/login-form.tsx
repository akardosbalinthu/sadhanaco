"use client";

import { buttonPrimary } from "@/components/ornaments";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { sendMagicLink, type LoginState } from "./actions";

const initial: LoginState = { status: "idle" };

export function LoginForm({ tovabb }: { tovabb?: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return (
      <div className="rounded-md border border-gold/40 bg-gold-soft/20 p-5 text-ink-soft">
        <p>
          Ha a <span className="text-ink">{state.email}</span> címmel van tagságod,
          pár percen belül érkezik egy belépő link. Nyugodtan nézd meg a levelezésedet,
          ráérsz.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tovabb" value={tovabb ?? ""} />
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím</span>
        <div className="flex items-center gap-2 rounded-md border border-line bg-white/60 px-3 transition-colors duration-300 focus-within:border-gold">
          <Mail className="h-4 w-4 text-ink-soft" strokeWidth={1.5} aria-hidden />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full bg-transparent py-2.5 text-ink outline-none"
          />
        </div>
      </label>
      {state.status === "error" && <p className="text-sm text-ink">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} w-full`}
      >
        {pending ? "Küldés…" : "Belépő link kérése"}
      </button>
    </form>
  );
}
