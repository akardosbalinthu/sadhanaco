import { CompassDivider, PageHeader } from "@/components/ornaments";

export type LegalSection = { title: string; body: React.ReactNode };

/** Hosszú jogi szöveg nyugodt, jól olvasható tördeléssel és tartalomjegyzékkel. */
export function LegalDoc({
  eyebrow,
  title,
  intro,
  meta,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  meta: string;
  sections: LegalSection[];
}) {
  return (
    <main className="py-16">
      <PageHeader eyebrow={eyebrow} title={title}>
        {intro}
        <p className="text-xs">{meta}</p>
      </PageHeader>
      <CompassDivider className="my-12" />
      <nav aria-label="Tartalom" className="max-w-2xl">
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.title}>
              <a href={`#p${i + 1}`} className="text-ink-soft transition-colors duration-300 hover:text-gold">
                <span className="mr-2 text-gold">{i + 1}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-14 max-w-2xl space-y-12">
        {sections.map((s, i) => (
          <section key={s.title} id={`p${i + 1}`} className="scroll-mt-24">
            <h2 className="font-serif text-2xl text-forest">
              <span className="mr-2 text-gold">{i + 1}.</span>
              {s.title}
            </h2>
            <div className="legal mt-4 space-y-3 text-[15px] leading-relaxed text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-forest [&_ul]:space-y-1.5 [&_a]:text-forest [&_a]:underline [&_a]:decoration-gold/60 [&_a]:underline-offset-4 hover:[&_a]:text-gold">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
