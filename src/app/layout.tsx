import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { themeInitScript } from "@/components/theme";
import { resolvedSiteUrl } from "@/lib/site";

const TITLE = "Kardos Bálint · Egyéni idegrendszer-fejlesztő és meditációs program";
const DESCRIPTION = "Több ezer éves jógikus légző- és meditációs gyakorlatok, modern életmód-orvostani keretrendszerben – rád szabva.";

export const metadata: Metadata = {
  metadataBase: new URL(resolvedSiteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "Kardos Bálint",
    title: "Találd meg a nyugalmad – és tartsd is meg a hétköznapokban.",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
        {/* Süti nélküli, összesített látogatottságmérés (Vercel Web Analytics). */}
        <Analytics />
      </body>
    </html>
  );
}
