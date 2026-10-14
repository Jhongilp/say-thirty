export const SITE = {
  name: "TH Master",
  title: "TH Master: domina la pronunciación de la TH en inglés",
  description:
    "Aprende a pronunciar la TH del inglés (thirty, though, weather…) con tu micrófono. Corrección instantánea y gratuita para hispanohablantes.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://th-master.web.app").replace(/\/$/, ""),
  locale: "es_ES",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contacto@example.com",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  adSlots: {
    article: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE || "",
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || "",
  },
} as const;

export const CHALLENGE_NAME = "Reto Domina la TH";

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function wordPath(slug: string): string {
  return `/pronunciar/${slug}`;
}
