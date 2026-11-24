"use client";

import { useEffect, useState } from "react";
import { Clock, Moon, Sun } from "lucide-react";

type Choice = "auto" | "light" | "dark";
const KEY = "tarsasag-theme";

/** Az oldal megjelenése előtt fut (a <head>-ben), hogy ne villanjon fel a rossz szín. */
export const themeInitScript = `(function(){try{var c=localStorage.getItem("${KEY}");var h=new Date().getHours();var t=c==="light"||c==="dark"?c:(h>=20||h<7?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){var h2=new Date().getHours();document.documentElement.dataset.theme=(h2>=20||h2<7)?"dark":"light";}})();`;

function resolve(choice: Choice): "light" | "dark" {
  if (choice !== "auto") return choice;
  const h = new Date().getHours();
  return h >= 20 || h < 7 ? "dark" : "light";
}

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

const NEXT: Record<Choice, Choice> = { auto: "light", light: "dark", dark: "auto" };
const LABEL: Record<Choice, string> = {
  auto: "Automatikus (napszak szerint)",
  light: "Világos mód",
  dark: "Sötét mód",
};

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("auto");

  useEffect(() => {
    setChoice(read());
  }, []);

  // Automatikus módban percenként igazodunk a napszakhoz.
  useEffect(() => {
    document.documentElement.dataset.theme = resolve(choice);
    if (choice !== "auto") return;
    const t = setInterval(() => (document.documentElement.dataset.theme = resolve("auto")), 60_000);
    return () => clearInterval(t);
  }, [choice]);

  function cycle() {
    const next = NEXT[choice];
    try {
      if (next === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* a böngésző nem engedi a tárolást: csak erre a látogatásra érvényes */
    }
    setChoice(next);
  }

  const Icon = choice === "auto" ? Clock : choice === "light" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={cycle}
      title={`${LABEL[choice]} — kattints a váltáshoz`}
      aria-label={`Megjelenés: ${LABEL[choice]}. Kattints a váltáshoz.`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft transition-colors duration-300 hover:border-gold hover:text-gold"
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
