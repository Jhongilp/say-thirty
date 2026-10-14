import type { MetadataRoute } from "next";
import { absoluteUrl, wordPath } from "@/lib/site";
import { getAllWords } from "@/lib/words";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const words = await getAllWords();
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...words.map((w) => ({
      url: absoluteUrl(wordPath(w.slug)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["/privacidad", "/terminos", "/cookies", "/contacto"].map((p) => ({
      url: absoluteUrl(p),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
