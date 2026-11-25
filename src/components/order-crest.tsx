import { CrestKertorzok, CrestMagusok, CrestTorpok, CrestTundek, CrestVandorok } from "@/components/ornaments";

const CRESTS = { tundek: CrestTundek, kertorzok: CrestKertorzok, torpok: CrestTorpok, vandorok: CrestVandorok, magusok: CrestMagusok };

export function OrderCrest({ order, className }: { order: string | null | undefined; className?: string }) {
  const C = order && order in CRESTS ? CRESTS[order as keyof typeof CRESTS] : null;
  return C ? <C className={className} /> : null;
}
