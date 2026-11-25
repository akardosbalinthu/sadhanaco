import type { Metadata } from "next";
import "./globals.css";
import { themeInitScript } from "@/components/theme";

export const metadata: Metadata = {
  title: "Kardos Bálint · Egyéni idegrendszer-fejlesztő és meditációs program",
  description: "Tradicionális jógikus gyakorlatok, modern életmód-orvostani keretrendszerben – rád szabva.",
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
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
