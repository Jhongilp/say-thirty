import type { WordDocument } from "./types";
import { WAVEFORM_BARS } from "./types";

const PHONEME_TYPES = ["th-unvoiced", "th-voiced", "th-cluster", "ough-trap"];
const DIFFICULTIES = ["Básico", "Intermedio", "Avanzado"];

/** Returns a list of human-readable problems; an empty list means the document is valid. */
export function validateWordDocument(doc: unknown): string[] {
  const errors: string[] = [];
  if (!doc || typeof doc !== "object") return ["document is not an object"];
  const d = doc as Partial<WordDocument>;
  const str = (key: keyof WordDocument) => {
    if (typeof d[key] !== "string" || !(d[key] as string).trim()) errors.push(`${key} must be a non-empty string`);
  };

  (["slug", "word", "translationEs", "ipa", "phoneticRespellingEs", "anatomicalTipEs"] as const).forEach(str);
  if (typeof d.audioNormalUrl !== "string") errors.push("audioNormalUrl must be a string");
  if (typeof d.audioSlowUrl !== "string") errors.push("audioSlowUrl must be a string");
  if (d.slug && !/^[a-z0-9-]+$/.test(d.slug)) errors.push("slug must be lowercase kebab-case");
  if (!DIFFICULTIES.includes(d.difficulty as string)) errors.push("difficulty is invalid");
  if (!PHONEME_TYPES.includes(d.phonemeType as string)) errors.push("phonemeType is invalid");

  const band = d.targetFrequencyHz;
  if (!Array.isArray(band) || band.length !== 2 || !(band[0] < band[1]) || band[0] <= 0) {
    errors.push("targetFrequencyHz must be [low, high] with 0 < low < high");
  }

  const waveform = d.referenceWaveform;
  if (!Array.isArray(waveform) || waveform.length !== WAVEFORM_BARS) {
    errors.push(`referenceWaveform must have ${WAVEFORM_BARS} values`);
  } else if (waveform.some((v) => typeof v !== "number" || v < 0 || v > 1 || Number.isNaN(v))) {
    errors.push("referenceWaveform values must be within 0..1");
  }

  if (!Array.isArray(d.chunks) || d.chunks.length === 0) errors.push("chunks must not be empty");
  else if (d.chunks.some((c) => !c?.label || !c?.ipa || !c?.hintEs)) errors.push("every chunk needs label, ipa and hintEs");

  if (!Array.isArray(d.commonMispronunciations) || d.commonMispronunciations.length === 0) {
    errors.push("commonMispronunciations must not be empty");
  } else if (d.commonMispronunciations.some((m) => !m?.heardWord || !m?.errorType || !m?.correctionTipEs)) {
    errors.push("every mispronunciation needs heardWord, errorType and correctionTipEs");
  }

  if (d.acceptedTranscripts !== undefined && !Array.isArray(d.acceptedTranscripts)) {
    errors.push("acceptedTranscripts must be an array when present");
  }

  const s = d.shadowingSentence;
  if (!s?.english || !s?.spanish || !s?.ipa) errors.push("shadowingSentence needs english, spanish and ipa");

  const seo = d.seo;
  if (!seo?.metaTitle || !seo?.metaDescription || !seo?.h1) errors.push("seo needs metaTitle, metaDescription and h1");
  const article = seo?.article;
  if (!article?.whyIsItHardEs || !article?.comparisonTitleEs || !article?.comparisonBodyEs) {
    errors.push("seo.article needs whyIsItHardEs, comparisonTitleEs and comparisonBodyEs");
  }
  if (!Array.isArray(article?.faqs) || article.faqs.length === 0 || article.faqs.some((f) => !f?.question || !f?.answer)) {
    errors.push("seo.article.faqs needs at least one question/answer pair");
  }

  if (typeof d.orderIndex !== "number" || !Number.isInteger(d.orderIndex) || d.orderIndex < 1) {
    errors.push("orderIndex must be a positive integer");
  }
  return errors;
}
