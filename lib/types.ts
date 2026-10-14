export interface MispronunciationFeedback {
  heardWord: string;
  errorType: string;
  correctionTipEs: string;
}

export interface SyllableChunk {
  label: string;
  ipa: string;
  hintEs: string;
}

export interface WordSEOArticle {
  whyIsItHardEs: string;
  comparisonTitleEs: string;
  comparisonBodyEs: string;
  faqs: Array<{ question: string; answer: string }>;
}

export type PhonemeType = "th-unvoiced" | "th-voiced" | "th-cluster" | "ough-trap";
export type Difficulty = "Básico" | "Intermedio" | "Avanzado";

export interface WordDocument {
  slug: string;
  word: string;
  translationEs: string;
  ipa: string;
  phoneticRespellingEs: string;
  difficulty: Difficulty;
  phonemeType: PhonemeType;
  targetFrequencyHz: [number, number];
  anatomicalTipEs: string;
  audioNormalUrl: string;
  audioSlowUrl: string;
  referenceWaveform: number[];
  chunks: SyllableChunk[];
  commonMispronunciations: MispronunciationFeedback[];
  /**
   * Extra transcripts that count as a correct attempt (digits such as "30",
   * or homophones such as "whether" for "weather"). The word itself is always accepted.
   */
  acceptedTranscripts?: string[];
  shadowingSentence: {
    english: string;
    spanish: string;
    ipa: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    article: WordSEOArticle;
  };
  orderIndex: number;
}

export const WAVEFORM_BARS = 48;
