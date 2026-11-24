/**
 * Egy Next.js app két felülettel:
 *  - akardosbalint.hu           — fő weboldal (nyilvános)
 *  - tarsasag.akardosbalint.hu  — Sadhana Társaság (élesben aldomain; a middleware
 *                                 belsőleg a /tarsasag útvonalakra írja át)
 * Helyi fejlesztésben a Társaság a http://localhost:3000/tarsasag címen érhető el.
 */

/**
 * A Társaság linkjeinek előtagja, a NEXT_PUBLIC_TARSASAG_URL útvonalából:
 * helyben http://localhost:3000/tarsasag -> "/tarsasag", élesben https://tarsasag.akardosbalint.hu -> "".
 */
export function tarsasagBasePath(url = process.env.NEXT_PUBLIC_TARSASAG_URL ?? "http://localhost:3000/tarsasag") {
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
