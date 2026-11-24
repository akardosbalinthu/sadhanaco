"use client";

import { useState } from "react";
import { inputClass } from "@/components/ornaments";

/** Névmezők élő előnézettel: Vezetéknév Keresztnév "Becenév". */
export function NameFields({ last, first, nick }: { last: string; first: string; nick: string }) {
  const [v, setV] = useState({ last, first, nick });
  const shown = [v.last.trim(), v.first.trim()].filter(Boolean).join(" ") + (v.nick.trim() ? ` "${v.nick.trim()}"` : "");
  const field = (key: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ink-soft">{label}</span>
      <input
        {...props}
        name={key === "last" ? "last_name" : key === "first" ? "first_name" : "nickname"}
        value={v[key]}
        onChange={(e) => setV({ ...v, [key]: e.target.value })}
        className={inputClass}
      />
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("last", "Vezetéknév", { required: true, maxLength: 60, autoComplete: "family-name" })}
        {field("first", "Keresztnév", { required: true, maxLength: 60, autoComplete: "given-name" })}
      </div>
      {field("nick", "Becenév (nem kötelező)", { maxLength: 30, pattern: '[^"]*', title: "Idézőjel nélkül" })}
      <p className="text-sm text-ink-soft">
        Így jelensz meg a közösségben és a ranglistán:{" "}
        <span className="font-serif text-lg text-forest">{shown || "—"}</span>
      </p>
    </div>
  );
}
