import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import WordSeoArticle from "@/components/seo/WordSeoArticle";
import PronunciationTrainer from "@/components/trainer/PronunciationTrainer";
import { wordPath } from "@/lib/site";
import { getAllWords, getWordBySlug, getWordNav } from "@/lib/words";

// Static export: only the slugs returned by generateStaticParams exist.
export const dynamicParams = false;

export async function generateStaticParams() {
  const words = await getAllWords();
  return words.map((w) => ({ word: w.slug }));
}

export async function generateMetadata({ params }: PageProps<"/pronunciar/[word]">): Promise<Metadata> {
  const { word: slug } = await params;
  const word = await getWordBySlug(slug);
  if (!word) return {};
  const path = wordPath(word.slug);
  return {
    title: { absolute: word.seo.metaTitle },
    description: word.seo.metaDescription,
    alternates: { canonical: path },
    keywords: [`pronunciar ${word.word.toLowerCase()}`, `cómo se pronuncia ${word.word.toLowerCase()}`, `${word.word} pronunciación`, "TH en inglés"],
    openGraph: { type: "article", title: word.seo.metaTitle, description: word.seo.metaDescription, url: path },
    twitter: { card: "summary_large_image", title: word.seo.metaTitle, description: word.seo.metaDescription },
  };
}

export default async function WordPage({ params }: PageProps<"/pronunciar/[word]">) {
  const { word: slug } = await params;
  const word = await getWordBySlug(slug);
  if (!word) notFound();

  const nav = await getWordNav();
  const idx = nav.findIndex((w) => w.slug === word.slug);
  const next = idx >= 0 && idx < nav.length - 1 ? nav[idx + 1] : null;
  const related = nav.filter((w) => w.slug !== word.slug);

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
      <JsonLdSchema word={word} />
      <PronunciationTrainer word={word} nextWord={next ? { slug: next.slug, word: next.word } : null} />
      <div className="mt-6 text-center text-sm text-slate-400" aria-hidden="true">
        ↓ Guía completa de pronunciación ↓
      </div>
      <div className="mt-4 px-1">
        <WordSeoArticle word={word} related={related} />
      </div>
    </main>
  );
}
