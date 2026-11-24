import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { tp } from "@/lib/site";

export const metadata = {
  title: "A Társaság",
  description:
    "Azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve. Kedvesség, figyelmesség, tudatosság, segítőkészség.",
};

export default function TarsasagLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-gold/30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href={tp("/")} className="font-serif text-lg text-forest">
            A Társaság
          </Link>
          <nav className="flex gap-5 text-sm text-ink-soft">
            <a href={publicEnv.NEXT_PUBLIC_SITE_URL} className="transition-colors duration-300 hover:text-gold">
              akardosbalint.hu
            </a>
            <Link href={tp("/belepes")} className="transition-colors duration-300 hover:text-gold">
              Belépés
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
