import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { tp } from "@/lib/site";

export const metadata = {
  title: "A Társaság",
  description:
    "Közös gyakorlótér Kardos Bálinttal: idegrendszer-fejlesztés, kedvesség, figyelmesség, tudatosság és segítőkészség.",
};

export default function TarsasagLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href={tp("/")} className="font-serif text-lg">
            A Társaság
          </Link>
          <nav className="flex gap-5 text-sm text-ink-soft">
            <a href={publicEnv.NEXT_PUBLIC_SITE_URL} className="hover:text-moss">
              akardosbalint.hu
            </a>
            <Link href={tp("/belepes")} className="hover:text-moss">
              Belépés
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
