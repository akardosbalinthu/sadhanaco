import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6">{children}</div>
      <SiteFooter />
    </>
  );
}
