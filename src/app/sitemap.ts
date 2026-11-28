import type { MetadataRoute } from "next";
import { resolvedSiteUrl } from "@/lib/site";

/** A nyilvános, keresőben megjelenő oldalak. */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/jelentkezes", priority: 0.9, changeFrequency: "monthly" },
  { path: "/rolam", priority: 0.8, changeFrequency: "monthly" },
  { path: "/nyilt-estek", priority: 0.8, changeFrequency: "weekly" },
  { path: "/cegeknek", priority: 0.7, changeFrequency: "monthly" },
  { path: "/egy-kedves-uzenet", priority: 0.6, changeFrequency: "monthly" },
  { path: "/aszf", priority: 0.2, changeFrequency: "yearly" },
  { path: "/adatkezeles", priority: 0.2, changeFrequency: "yearly" },
  { path: "/impresszum", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolvedSiteUrl().replace(/\/$/, "");
  return PAGES.map((p) => ({ url: `${base}${p.path === "/" ? "" : p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
