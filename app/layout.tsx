import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import GatedScripts from "@/components/ads/GatedScripts";
import ProgressBar from "@/components/layout/ProgressBar";
import SiteFooter from "@/components/layout/SiteFooter";
import { SITE } from "@/lib/site";
import { getWordNav } from "@/lib/words";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: SITE.locale, url: SITE.url },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // Lets AdSense verify site ownership even though the ad library itself is gated behind human interaction.
  other: SITE.adsenseClient ? { "google-adsense-account": SITE.adsenseClient } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const words = await getWordNav();
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ProgressBar slugs={words.map((w) => w.slug)} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <GatedScripts />
      </body>
    </html>
  );
}
