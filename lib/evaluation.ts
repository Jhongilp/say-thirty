import { envelopeCorrelation, normalizePeaks, resampleEnvelope } from "./audio-analysis";
import type { MispronunciationFeedback, PhonemeType, WordDocument } from "./types";
import { WAVEFORM_BARS } from "./types";

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

/** One analysis frame captured from the AnalyserNode while recording. */
export interface AcousticFrame {
  /** Milliseconds since recording started. */
  t: number;
  /** Time-domain RMS level (0..1). */
  rms: number;
  /** Mean linear power in the word's friction band (`targetFrequencyHz`, e.g. 4–8 kHz). */
  high: number;
  /** Mean linear power below 500 Hz (voicing / plosive bursts). */
  low: number;
  /** Mean linear power 500 Hz – friction band (vowel formants). */
  mid: number;
}

export type ThPosition = "initial" | "medial" | "final";

export type EvaluationTarget = Pick<
  WordDocument,
  "word" | "phonemeType" | "commonMispronunciations" | "acceptedTranscripts" | "referenceWaveform" | "anatomicalTipEs"
> & { syllables: number };

export type AcousticIssue = "no-speech" | "no-friction" | "plosive" | "closure" | "too-short" | "too-long";

export interface AcousticResult {
  score: number;
  speechDetected: boolean;
  frictionMs: number;
  plosiveOnset: boolean;
  closureGap: boolean;
  durationMs: number;
  envelopeSimilarity: number;
  userWaveform: number[];
  issues: AcousticIssue[];
}

export interface SpeechResult {
  kind: "match" | "trap" | "unknown" | "none";
  score: number;
  heard: string | null;
  rank: number;
  trap: MispronunciationFeedback | null;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  wordRecognized: boolean;
  engine: "dual" | "acoustic" | "speech";
  headlineEs: string;
  tipEs: string;
  errorType: string | null;
  heard: string | null;
  acoustic: AcousticResult;
  speech: SpeechResult;
}

export const PASS_SCORE = 80;

/** Tunable thresholds for the friction detector. */
export const ACOUSTIC_CONFIG = {
  minPeakRms: 0.012,
  minSpeechMs: 120,
  noiseMultiplier: 2.5,
  peakRatio: 0.08,
  frictionHighOverNoise: 3,
  frictionRatio: 0.18,
  onsetLookbackMs: 260,
  onsetLookaheadMs: 120,
  codaLookbackMs: 140,
  codaLookaheadMs: 280,
  frictionFullMsUnvoiced: 70,
  frictionFullMsVoiced: 35,
  plosiveRiseMs: 34,
  closureMinMs: 45,
  closureLevel: 0.12,
  /** Max silent gap inside a single word before a later sound is treated as a separate noise/click. */
  maxInternalSilenceMs: 260,
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function getThPositions(word: string): ThPosition[] {
  const w = word.toLowerCase();
  const out = new Set<ThPosition>();
  let idx = w.indexOf("th");
  while (idx !== -1) {
    const isInitial = idx === 0;
    const isFinal = idx + 2 >= w.length;
    if (isInitial) out.add("initial");
    if (isFinal) out.add("final");
    if (!isInitial && !isFinal) out.add("medial");
    idx = w.indexOf("th", idx + 1);
  }
  return [...out];
}

export function isVoiced(type: PhonemeType): boolean {
  return type === "th-voiced";
}

export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function transcriptMatches(alternative: string, candidate: string): boolean {
  const alt = normalizeTranscript(alternative);
  const cand = normalizeTranscript(candidate);
  if (!alt || !cand) return false;
  if (alt === cand) return true;
  // Single-word targets: accept when the candidate appears as a standalone token.
  return !cand.includes(" ") && alt.split(" ").includes(cand);
}

export function expectedDurationMs(syllables: number): number {
  return 300 + 200 * Math.max(1, syllables);
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function percentile(xs: number[], p: number): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function frameDuration(frames: AcousticFrame[], i: number): number {
  if (i + 1 < frames.length) return Math.min(50, frames[i + 1].t - frames[i].t);
  return i > 0 ? Math.min(50, frames[i].t - frames[i - 1].t) : 16;
}

/* ------------------------------------------------------------------ */
/* Engine B: acoustic friction analysis (works without Web Speech API)  */
/* ------------------------------------------------------------------ */

export function analyzeAcoustics(frames: AcousticFrame[], target: EvaluationTarget): AcousticResult {
  const cfg = ACOUSTIC_CONFIG;
  const empty: AcousticResult = {
    score: 0,
    speechDetected: false,
    frictionMs: 0,
    plosiveOnset: false,
    closureGap: false,
    durationMs: 0,
    envelopeSimilarity: 0,
    userWaveform: new Array<number>(WAVEFORM_BARS).fill(0),
    issues: ["no-speech"],
  };
  if (frames.length < 4) return empty;

  const levels = frames.map((f) => f.rms);
  const peak = Math.max(...levels);
  const noiseRms = percentile(levels, 0.1);
  const noiseHigh = percentile(
    frames.map((f) => f.high),
    0.1,
  );
  if (peak < cfg.minPeakRms) return empty;

  const threshold = Math.max(noiseRms * cfg.noiseMultiplier, peak * cfg.peakRatio, cfg.minPeakRms * 0.5);
  // Group contiguous active regions bridged across brief internal dips (consonant closures <= maxInternalSilenceMs)
  // and pick the highest-energy speech island so a trailing button click or breath never stretches the word.
  const islands: Array<{ start: number; end: number; energy: number }> = [];
  let curStart = -1;
  let curEnd = -1;
  let curEnergy = 0;
  let silentMs = 0;
  levels.forEach((lvl, i) => {
    const dt = frameDuration(frames, i);
    if (lvl >= threshold) {
      if (curStart === -1) curStart = i;
      curEnd = i;
      curEnergy += lvl * dt;
      silentMs = 0;
    } else if (curStart !== -1) {
      silentMs += dt;
      if (silentMs > cfg.maxInternalSilenceMs) {
        islands.push({ start: curStart, end: curEnd, energy: curEnergy });
        curStart = -1;
        curEnd = -1;
        curEnergy = 0;
        silentMs = 0;
      }
    }
  });
  if (curStart !== -1) islands.push({ start: curStart, end: curEnd, energy: curEnergy });
  if (!islands.length) return empty;

  const mainIsland = islands.reduce((best, cur) => (cur.energy > best.energy ? cur : best));
  const startIdx = mainIsland.start;
  const endIdx = mainIsland.end;

  const startT = frames[startIdx].t;
  const endT = frames[endIdx].t + frameDuration(frames, endIdx);
  const durationMs = endT - startT;
  if (durationMs < cfg.minSpeechMs) return { ...empty, durationMs };

  const isFrictionFrame = (f: AcousticFrame) => {
    const total = f.high + f.mid + f.low;
    return total > 0 && f.high > noiseHigh * cfg.frictionHighOverNoise && f.high / total >= cfg.frictionRatio;
  };
  const frictionIn = (fromT: number, toT: number) => {
    let ms = 0;
    frames.forEach((f, i) => {
      if (f.t >= fromT && f.t <= toT && isFrictionFrame(f)) ms += frameDuration(frames, i);
    });
    return ms;
  };

  const positions = getThPositions(target.word);
  const voiced = isVoiced(target.phonemeType);
  const fullMs = voiced ? cfg.frictionFullMsVoiced : cfg.frictionFullMsUnvoiced;

  let frictionMs = 0;
  if (positions.includes("initial")) {
    frictionMs = Math.max(frictionMs, frictionIn(startT - cfg.onsetLookbackMs, startT + cfg.onsetLookaheadMs));
  }
  if (positions.includes("final")) {
    frictionMs = Math.max(frictionMs, frictionIn(endT - cfg.codaLookbackMs, endT + cfg.codaLookaheadMs));
  }

  // A Spanish-style /t/ or /d/ starts with an abrupt burst; /θ/ and /ð/ fade in.
  let plosiveOnset = false;
  if (positions.includes("initial")) {
    const riseTarget = peak * 0.6;
    const quietBefore = levels[Math.max(0, startIdx - 1)] < peak * 0.2;
    const riseIdx = levels.findIndex((l, i) => i >= startIdx && l >= riseTarget);
    if (riseIdx !== -1 && quietBefore) {
      const riseMs = frames[riseIdx].t - startT;
      plosiveOnset = riseMs <= cfg.plosiveRiseMs && frictionMs < fullMs * 0.4;
    }
  }

  // Medial /ð/ is continuous; a silent closure in the middle means a /d/ ("wedder").
  let closureGap = false;
  if (positions.includes("medial")) {
    let run = 0;
    for (let i = startIdx + 1; i < endIdx; i++) {
      if (levels[i] < peak * cfg.closureLevel) {
        run += frameDuration(frames, i);
        if (run >= cfg.closureMinMs) {
          closureGap = true;
          break;
        }
      } else {
        run = 0;
      }
    }
  }

  const userWaveform = normalizePeaks(resampleEnvelope(levels.slice(startIdx, endIdx + 1), WAVEFORM_BARS));
  const envelopeSimilarity = target.referenceWaveform.length
    ? clamp01(envelopeCorrelation(userWaveform, target.referenceWaveform))
    : 0.5;

  const expected = expectedDurationMs(target.syllables);
  const ratio = durationMs / expected;
  const durationScore = ratio < 0.45 ? ratio / 0.45 : ratio > 2.2 ? clamp01(1 - (ratio - 2.2)) : 1;

  const issues: AcousticIssue[] = [];
  let articulation: number;
  if (positions.length === 0) {
    articulation = 1;
  } else if (positions.includes("medial") && !positions.includes("initial") && !positions.includes("final")) {
    articulation = closureGap ? 0.2 : 1;
    if (closureGap) issues.push("closure");
  } else {
    articulation = clamp01(frictionMs / fullMs);
    if (articulation < 0.5) issues.push("no-friction");
  }
  if (plosiveOnset) issues.push("plosive");
  if (ratio < 0.45) issues.push("too-short");
  if (ratio > 2.2) issues.push("too-long");

  const score = Math.round(
    100 * (0.55 * articulation + 0.15 * (plosiveOnset ? 0 : 1) + 0.15 * envelopeSimilarity + 0.15 * durationScore),
  );

  return {
    score,
    speechDetected: true,
    frictionMs: Math.round(frictionMs),
    plosiveOnset,
    closureGap,
    durationMs: Math.round(durationMs),
    envelopeSimilarity: Math.round(envelopeSimilarity * 100) / 100,
    userWaveform,
    issues,
  };
}

/* ------------------------------------------------------------------ */
/* Engine A: phonetic trap matcher (Web Speech API alternatives)        */
/* ------------------------------------------------------------------ */

export function evaluateSpeech(alternatives: string[], target: EvaluationTarget): SpeechResult {
  const alts = alternatives.map(normalizeTranscript).filter(Boolean);
  if (!alts.length) return { kind: "none", score: 0, heard: null, rank: -1, trap: null };

  const accepted = [target.word, ...(target.acceptedTranscripts ?? [])];
  const targetRank = alts.findIndex((alt) => accepted.some((a) => transcriptMatches(alt, a)));

  let trapRank = -1;
  let trap: MispronunciationFeedback | null = null;
  for (let i = 0; i < alts.length && !trap; i++) {
    const found = target.commonMispronunciations.find((m) => transcriptMatches(alts[i], m.heardWord));
    if (found) {
      trap = found;
      trapRank = i;
    }
  }

  if (targetRank !== -1) {
    // The recognizer preferred a known trap over the target: the attempt was ambiguous.
    if (trap && trapRank < targetRank) {
      return { kind: "match", score: 65, heard: alts[trapRank], rank: targetRank, trap };
    }
    return { kind: "match", score: Math.max(70, 100 - targetRank * 8), heard: alts[targetRank], rank: targetRank, trap: null };
  }
  if (trap) return { kind: "trap", score: 40, heard: alts[trapRank], rank: trapRank, trap };
  return { kind: "unknown", score: 25, heard: alts[0], rank: 0, trap: null };
}

/* ------------------------------------------------------------------ */
/* Combined scoring                                                    */
/* ------------------------------------------------------------------ */

function acousticTip(issue: AcousticIssue, target: EvaluationTarget): { headline: string; tip: string; errorType: string } {
  const voiced = isVoiced(target.phonemeType);
  switch (issue) {
    case "no-speech":
      return {
        headline: "No te escuchamos bien",
        tip: "Acerca el micrófono, revisa que el navegador tenga permiso y di la palabra con voz clara.",
        errorType: "Sin voz detectada",
      };
    case "plosive":
      return {
        headline: voiced ? "Sonó a una 'D' golpeada" : "Sonó a una 'T' golpeada",
        tip: voiced
          ? "Detectamos un golpe seco al inicio. No apoyes la lengua detrás de los dientes: déjala asomar entre ellos y haz vibrar la voz sin cortar el aire, como la 'd' suave de «cada»."
          : "Detectamos un golpe seco al inicio. No bloquees el aire: saca la punta de la lengua entre los dientes y sopla un siseo suave antes de la vocal.",
        errorType: voiced ? "Oclusión dental (/d/)" : "Oclusión dental (/t/)",
      };
    case "closure":
      return {
        headline: "Detectamos un corte en medio de la palabra",
        tip: "La /ð/ es continua: no cierres el paso del aire. Deja la lengua suelta entre los dientes y mantén la vibración de la voz de una vocal a la otra.",
        errorType: "Oclusión intervocálica (/d/)",
      };
    case "no-friction":
      return {
        headline: voiced ? "Falta el zumbido de la TH" : "No detectamos el soplo de la TH",
        tip: voiced
          ? "Coloca la punta de la lengua entre los dientes y deja que la voz vibre mientras el aire pasa. Debes sentir un cosquilleo en la lengua."
          : "No captamos la fricción aguda (4–8 kHz) de la /θ/. Pon la punta de la lengua entre los dientes y sopla como la 'Z' de España, sin voz.",
        errorType: voiced ? "Falta de fricción sonora (/ð/)" : "Falta de fricción (/θ/)",
      };
    case "too-short":
      return {
        headline: "Fue demasiado rápido",
        tip: "Dilo completo y sin prisa. Alarga un poco el sonido de la TH antes de pasar a la vocal.",
        errorType: "Duración insuficiente",
      };
    case "too-long":
      return {
        headline: "Fue demasiado lento",
        tip: "Intenta decir la palabra de un solo golpe de voz, con el ritmo del audio nativo.",
        errorType: "Duración excesiva",
      };
  }
}

const ISSUE_PRIORITY: AcousticIssue[] = ["no-speech", "plosive", "closure", "no-friction", "too-short", "too-long"];

export function combineEvaluation(
  speech: SpeechResult,
  acoustic: AcousticResult,
  target: EvaluationTarget,
  speechIsFinal = true,
): EvaluationResult {
  const speechUsable = speech.kind !== "none";
  let engine: EvaluationResult["engine"];
  let score: number;

  if (speechUsable && acoustic.speechDetected) {
    engine = "dual";
    score = 0.6 * speech.score + 0.4 * acoustic.score;
  } else if (speechUsable) {
    engine = "speech";
    score = speech.score * 0.85;
  } else {
    engine = "acoustic";
    score = acoustic.score;
  }
  if (speech.kind === "trap") score = Math.min(score, 55);
  if (speech.kind === "match" && speech.trap) score = Math.min(score, 75);
  score = Math.round(Math.max(0, Math.min(100, score)));

  const passed = score >= PASS_SCORE;
  const firstIssue = ISSUE_PRIORITY.find((i) => acoustic.issues.includes(i));
  const wordRecognized = speechIsFinal && speech.kind === "match" && speech.rank === 0 && speech.trap === null &&
    [target.word, ...(target.acceptedTranscripts ?? [])].some(
      (word) => normalizeTranscript(word) === normalizeTranscript(speech.heard ?? ""),
    );
  const base = { score, passed, wordRecognized, engine, acoustic, speech, heard: speech.heard };

  if (!speechUsable && !acoustic.speechDetected) {
    const t = acousticTip("no-speech", target);
    return { ...base, headlineEs: t.headline, tipEs: t.tip, errorType: t.errorType };
  }
  if (speech.trap) {
    return {
      ...base,
      headlineEs: `Sonó como «${speech.trap.heardWord}»`,
      tipEs: speech.trap.correctionTipEs,
      errorType: speech.trap.errorType,
    };
  }
  if (passed) {
    return {
      ...base,
      headlineEs: "¡Buen intento! Sigue practicando la TH",
      tipEs: target.anatomicalTipEs,
      errorType: null,
    };
  }
  if (firstIssue && firstIssue !== "no-speech") {
    const t = acousticTip(firstIssue, target);
    return { ...base, headlineEs: t.headline, tipEs: t.tip, errorType: t.errorType };
  }
  if (speech.kind === "unknown" && speech.heard) {
    return {
      ...base,
      headlineEs: `Escuchamos «${speech.heard}»`,
      tipEs: `No reconocimos «${target.word}». ${target.anatomicalTipEs}`,
      errorType: "Palabra no reconocida",
    };
  }
  return {
    ...base,
    headlineEs: "¡Casi! Sigue afinando",
    tipEs: target.anatomicalTipEs,
    errorType: null,
  };
}

export function evaluateAttempt(
  frames: AcousticFrame[],
  alternatives: string[],
  target: EvaluationTarget,
  speechIsFinal = true,
): EvaluationResult {
  return combineEvaluation(evaluateSpeech(alternatives, target), analyzeAcoustics(frames, target), target, speechIsFinal);
}
