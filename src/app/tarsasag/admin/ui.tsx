/** Kis, közös építőelemek az admin oldalakhoz. */

export type SP = Promise<Record<string, string | string[] | undefined>>;

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = one(sp.ok);
  const hiba = one(sp.hiba);
  if (!ok && !hiba) return null;
  return (
    <p
      role="status"
      className={`mb-8 rounded-md border px-4 py-3 text-sm ${hiba ? "border-alert/40 text-alert" : "border-gold/50 text-forest"}`}
    >
      {hiba || ok}
    </p>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-2xl text-forest">{children}</h2>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-ink-soft">{children}</p>;
}

export const smallButton =
  "rounded-md border border-forest px-3 py-1.5 text-xs text-forest transition-colors duration-300 hover:border-gold hover:bg-gold-soft/40";
export const smallPrimary =
  "rounded-md border border-forest bg-forest px-3 py-1.5 text-xs text-paper transition-colors duration-300 hover:border-gold";
export const smallInput =
  "rounded-md border border-line bg-paper-deep/60 px-2.5 py-1.5 text-sm outline-none transition-colors duration-300 focus:border-gold";
export const label = "block text-xs uppercase tracking-[0.15em] text-ink-soft";
