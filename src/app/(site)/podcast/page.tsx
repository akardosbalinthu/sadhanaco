import { SITE } from "@/lib/site";

export const metadata = { title: "Podcast · Kardos Bálint" };

export default function PodcastPage() {
  const links = [
    { label: "Spotify", href: SITE.podcast.spotify },
    { label: "Apple Podcasts", href: SITE.podcast.apple },
  ].filter((l) => l.href);

  return (
    <main className="py-16">
      <h1 className="font-serif text-3xl">Integrált meditációs és idegrendszer-fejlesztő podcast</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Rövid, 5–10 perces szóló epizódok a stressz, a légzés és a figyelem neurobiológiájáról —
        érthetően, a mindennapi gyakorlás felől.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        {links.length > 0 ? (
          links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              rel="noopener"
              className="rounded-md border border-line px-4 py-2 text-sm text-ink hover:border-moss"
            >
              {l.label}
            </a>
          ))
        ) : (
          <p className="text-sm text-ink-soft">A podcast-linkek hamarosan itt lesznek.</p>
        )}
      </div>
    </main>
  );
}
