import Link from "next/link";
import SafeAdSlot from "@/components/ads/SafeAdSlot";
import { SITE, wordPath } from "@/lib/site";
import type { PhonemeType, WordDocument } from "@/lib/types";
import type { WordNavItem } from "@/lib/words";

const TONGUE_POSITION: Record<PhonemeType, string> = {
  "th-unvoiced": "Punta de la lengua entre los dientes; aire continuo sin voz.",
  "th-voiced": "Punta de la lengua entre los dientes; aire continuo con vibración de la voz.",
  "th-cluster": "Lengua entre los dientes para la TH, enlazada sin cortes con la consonante vecina.",
  "ough-trap": "Lengua entre los dientes para la TH; la «ough» se pronuncia según la palabra.",
};

function extractIpa(text: string): string {
  return text.match(/\/[^/\s]+\//)?.[0] ?? "—";
}

/** Below-the-fold editorial content (anti-thin-content for AdSense + programmatic SEO). */
export default function WordSeoArticle({ word, related }: { word: WordDocument; related: WordNavItem[] }) {
  const { article } = word.seo;
  const trap = word.commonMispronunciations[0]?.heardWord ?? "";

  return (
    <article className="prose-th mx-auto max-w-3xl">
      <section>
        <h2>¿Cómo se pronuncia «{word.word}» en inglés correctamente?</h2>
        <p>
          <strong>«{word.word}»</strong> ({word.translationEs}) se transcribe como <span className="font-ipa">{word.ipa}</span> y para un
          hispanohablante suena aproximadamente como <em>{word.phoneticRespellingEs}</em>.
        </p>
        <p>{article.whyIsItHardEs}</p>
        <h3>Guía anatómica paso a paso</h3>
        <p>{word.anatomicalTipEs}</p>
        <ol>
          {word.chunks.map((c) => (
            <li key={c.label}>
              <strong>{c.label}</strong> <span className="font-ipa">{c.ipa}</span>: {c.hintEs}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>
          Errores comunes de hispanohablantes: «{word.word}» vs «{trap}»
        </h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Lo que se oye</th>
                <th scope="col">Sonido (IPA)</th>
                <th scope="col">Posición de la lengua</th>
                <th scope="col">Cómo corregirlo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-emerald-50">
                <td>
                  <strong>{word.word}</strong> ✅
                </td>
                <td className="font-ipa">{word.ipa}</td>
                <td>{TONGUE_POSITION[word.phonemeType]}</td>
                <td>Pronunciación correcta.</td>
              </tr>
              {word.commonMispronunciations.map((m) => (
                <tr key={m.heardWord}>
                  <td>
                    <strong>{m.heardWord}</strong> ❌
                  </td>
                  <td className="font-ipa">{extractIpa(m.errorType)}</td>
                  <td>{m.errorType}</td>
                  <td>{m.correctionTipEs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>{article.comparisonTitleEs}</h3>
        <p>{article.comparisonBodyEs}</p>
      </section>

      <SafeAdSlot slot={SITE.adSlots.article} className="my-10" />

      <section>
        <h2>Ejemplos y frases con «{word.word}» en contexto real</h2>
        <blockquote>
          <p className="text-lg font-semibold text-slate-900">{word.shadowingSentence.english}</p>
          <p className="font-ipa text-sm text-indigo-700">{word.shadowingSentence.ipa}</p>
          <p className="italic">{word.shadowingSentence.spanish}</p>
        </blockquote>
        <p>
          Practica esta frase en la <strong>Fase 4 (Shadowing)</strong> del entrenador: escucha, repite al mismo ritmo y comprueba si el
          reconocimiento de voz entiende «{word.word}» a velocidad real.
        </p>
      </section>

      <section>
        <h2>Preguntas Frecuentes (FAQ)</h2>
        {article.faqs.map((f) => (
          <details key={f.question} className="group">
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </section>

      {related.length > 0 && (
        <section>
          <h2>Sigue practicando la TH</h2>
          <ul className="not-prose grid grid-cols-2 gap-2 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={wordPath(r.slug)}
                  className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-400 hover:shadow"
                >
                  <span className="block font-bold text-slate-900">{r.word}</span>
                  <span className="block font-ipa text-xs text-indigo-700">{r.ipa}</span>
                  <span className="block text-xs text-slate-500">{r.translationEs}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
