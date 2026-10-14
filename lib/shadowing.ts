import { normalizeTranscript } from "./evaluation";

export interface ShadowingToken {
  text: string;
  matched: boolean;
  isTarget: boolean;
}

export interface ShadowingScore {
  score: number;
  tokens: ShadowingToken[];
  targetHit: boolean;
}

const tokenize = (s: string) => normalizeTranscript(s).split(" ").filter(Boolean);

/** Aligns the recognized transcript with the sentence (in order, small look-ahead) and scores coverage. */
export function scoreShadowing(sentence: string, transcript: string, targetWord: string, accepted: string[] = []): ShadowingScore {
  const display = sentence.split(/\s+/).filter(Boolean);
  const expected = display.map((w) => normalizeTranscript(w));
  const heard = tokenize(transcript);
  const targets = new Set([targetWord, ...accepted].map((w) => normalizeTranscript(w)));

  let cursor = 0;
  const tokens: ShadowingToken[] = display.map((text, i) => {
    const want = expected[i];
    const isTarget = targets.has(want);
    let matched = false;
    for (let j = cursor; j < Math.min(heard.length, cursor + 4); j++) {
      if (heard[j] === want || (isTarget && targets.has(heard[j]))) {
        matched = true;
        cursor = j + 1;
        break;
      }
    }
    return { text, matched, isTarget };
  });

  const total = tokens.length || 1;
  const matchedCount = tokens.filter((t) => t.matched).length;
  const targetHit = tokens.some((t) => t.isTarget && t.matched);
  // The target word weighs double: it is the sound being trained.
  const score = Math.round(((matchedCount + (targetHit ? 1 : 0)) / (total + 1)) * 100);
  return { score, tokens, targetHit };
}
