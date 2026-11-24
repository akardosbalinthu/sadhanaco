/**
 * Egy Next.js app két felülettel:
 *  - akardosbalint.hu           — fő weboldal (nyilvános)
 *  - tarsasag.akardosbalint.hu  — Sadhana Társaság (élesben aldomain; a middleware
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
  egyKedvesUzenetUrl: "https://egykedvesuzenet.hu",
  /** A podcast-linkek még nincsenek megadva — üresen a felület „hamarosan” jelzést mutat. */
  podcast: {
    spotify: process.env.NEXT_PUBLIC_PODCAST_SPOTIFY_URL ?? "",
    apple: process.env.NEXT_PUBLIC_PODCAST_APPLE_URL ?? "",
  },
} as const;

const hufFormatter = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
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
