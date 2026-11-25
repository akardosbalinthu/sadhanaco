/**
 * Egy Next.js app két felülettel:
 *  - akardosbalint.hu           — fő weboldal (nyilvános)
 *  - tarsasag.akardosbalint.hu  — A Társaság (élesben aldomain; a middleware
 *                                 belsőleg a /tarsasag útvonalakra írja át)
 * Helyi fejlesztésben a Társaság a http://localhost:3000/tarsasag címen érhető el.
 */

/**
 * A webhely címe: NEXT_PUBLIC_SITE_URL, ennek hiányában (Vercel előnézet) a telepítés saját
 * címe (NEXT_PUBLIC_VERCEL_URL), helyben http://localhost:3000.
 */
export function resolvedSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

/** A Társaság címe: NEXT_PUBLIC_TARSASAG_URL, ennek hiányában a webhely /tarsasag útvonala. */
export function resolvedTarsasagUrl(): string {
  return process.env.NEXT_PUBLIC_TARSASAG_URL ?? `${resolvedSiteUrl().replace(/\/$/, "")}/tarsasag`;
}

/**
 * A Társaság linkjeinek előtagja, a Társaság címének útvonalából:
 * helyben/előnézetben ".../tarsasag" -> "/tarsasag", élesben https://tarsasag.akardosbalint.hu -> "".
 */
export function tarsasagBasePath(url = resolvedTarsasagUrl()) {
  return new URL(url).pathname.replace(/\/$/, "");
}
export const TARSASAG_BASE = tarsasagBasePath();

/** Társasági útvonal a böngészőnek (link, redirect). */
export function tp(path: string = "/"): string {
  const p = path === "/" ? "" : path;
  return TARSASAG_BASE + p || "/";
}

export const SITE = {
  name: "Kardos Bálint",
  email: "info@akardosbalint.hu",
  /** Ide mennek az admin-értesítők (új jelentkezés, foglalás); ADMIN_NOTIFY_EMAIL felülírja. */
  adminEmail: process.env.ADMIN_NOTIFY_EMAIL || "balint@akardosbalint.hu",
  egyKedvesUzenetUrl: "https://egykedvesuzenet.hu",
} as const;

/** A szolgáltató (számlázási entitás) jogi adatai — ÁSZF, Adatkezelés, Impresszum. Kft.-váltáskor itt kell módosítani. */
export const LEGAL = {
  name: "Kardos Bálint e. v.",
  fullName: "Kardos Bálint egyéni vállalkozó",
  address: "1027 Budapest, Bem József utca 6. fsz. 3., Magyarország",
  registrationNumber: "61623820",
  taxNumber: "91637778-1-41",
  effectiveFrom: "2026. november 25.",
  host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA",
} as const;

// useGrouping "always": a négyjegyű összegek is tagolva (9 940 Ft), ahogy a nyomtatott árakban.
const hufFormatter = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0, useGrouping: "always" });
export function formatHuf(amount: number): string {
  return `${hufFormatter.format(amount)} Ft`;
}

const dateFormatter = new Intl.DateTimeFormat("hu-HU", {
  timeZone: "Europe/Budapest",
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});
const timeFormatter = new Intl.DateTimeFormat("hu-HU", {
  timeZone: "Europe/Budapest",
  hour: "2-digit",
  minute: "2-digit",
});
export function formatEventDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}
