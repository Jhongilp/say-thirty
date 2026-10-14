import { FALLBACK_WORDS } from "./fallback-words";
import { hasAdminCredentials } from "./firebase-admin";
import type { WordDocument } from "./types";
import { validateWordDocument } from "./word-validation";

let cache: Promise<WordDocument[]> | null = null;

async function loadFromFirestore(): Promise<WordDocument[]> {
  const { getAdminFirestore } = await import("./firebase-admin");
  const db = await getAdminFirestore();
  const snapshot = await db.collection("words").orderBy("orderIndex").get();
  const docs: WordDocument[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    const errors = validateWordDocument(data);
    if (errors.length) console.warn(`[words] Skipping invalid Firestore doc "${doc.id}": ${errors.join("; ")}`);
    else docs.push(data as WordDocument);
  });
  return docs;
}

/**
 * Single source of truth for build-time rendering (generateStaticParams / generateMetadata / sitemap).
 * Reads Firestore when WORDS_SOURCE=firestore and admin credentials exist; otherwise uses the offline seed.
 */
export function getAllWords(): Promise<WordDocument[]> {
  cache ??= (async () => {
    if (process.env.WORDS_SOURCE === "firestore" && hasAdminCredentials()) {
      try {
        const words = await loadFromFirestore();
        if (words.length) return words;
        console.warn("[words] Firestore returned no valid words; using offline fallback.");
      } catch (error) {
        console.warn("[words] Firestore unavailable; using offline fallback.", error);
      }
    }
    return [...FALLBACK_WORDS].sort((a, b) => a.orderIndex - b.orderIndex);
  })();
  return cache;
}

export async function getWordBySlug(slug: string): Promise<WordDocument | undefined> {
  return (await getAllWords()).find((w) => w.slug === slug);
}

export interface WordNavItem {
  slug: string;
  word: string;
  ipa: string;
  translationEs: string;
  difficulty: WordDocument["difficulty"];
  orderIndex: number;
}

export async function getWordNav(): Promise<WordNavItem[]> {
  return (await getAllWords()).map(({ slug, word, ipa, translationEs, difficulty, orderIndex }) => ({
    slug,
    word,
    ipa,
    translationEs,
    difficulty,
    orderIndex,
  }));
}
