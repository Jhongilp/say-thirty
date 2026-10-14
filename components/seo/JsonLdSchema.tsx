import { SITE, absoluteUrl, wordPath } from "@/lib/site";
import type { WordDocument } from "@/lib/types";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** FAQPage + LearningResource + BreadcrumbList structured data for a word page. */
export default function JsonLdSchema({ word }: { word: WordDocument }) {
  const url = absoluteUrl(wordPath(word.slug));

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: word.seo.article.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: word.seo.h1,
    description: word.seo.metaDescription,
    url,
    inLanguage: "es",
    learningResourceType: ["Interactive exercise", "Pronunciation guide"],
    educationalLevel: word.difficulty,
    interactivityType: "active",
    isAccessibleForFree: true,
    teaches: `Pronunciación de «${word.word}» ${word.ipa} en inglés`,
    about: { "@type": "Thing", name: `English pronunciation: ${word.word}` },
    audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: "Hispanohablantes que aprenden inglés" },
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: `Pronunciar ${word.word}`, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={faqPage} />
      <JsonLd data={learningResource} />
      <JsonLd data={breadcrumbs} />
    </>
  );
}
