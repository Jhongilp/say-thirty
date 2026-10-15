import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeAcoustics,
  combineEvaluation,
  evaluateAttempt,
  evaluateSpeech,
  getThPositions,
  type AcousticFrame,
  type EvaluationTarget,
} from "../lib/evaluation";
import { FALLBACK_WORDS } from "../lib/fallback-words";

type Seg = { ms: number; rms: number; high: number; low: number; mid: number };
const SILENCE: Omit<Seg, "ms"> = { rms: 0.002, high: 1e-9, low: 1e-8, mid: 1e-8 };
const FRICATIVE: Omit<Seg, "ms"> = { rms: 0.01, high: 1e-6, low: 1e-8, mid: 1e-7 };
const VOWEL: Omit<Seg, "ms"> = { rms: 0.2, high: 1e-8, low: 1e-5, mid: 1e-5 };
const WEAK_VOWEL: Omit<Seg, "ms"> = { ...VOWEL, rms: 0.14 };

function frames(segments: Seg[], step = 16): AcousticFrame[] {
  const out: AcousticFrame[] = [];
  let t = 0;
  for (const s of segments) {
    for (let elapsed = 0; elapsed < s.ms; elapsed += step) {
      out.push({ t, rms: s.rms, high: s.high, low: s.low, mid: s.mid });
      t += step;
    }
  }
  return out;
}

function targetFor(slug: string): EvaluationTarget {
  const w = FALLBACK_WORDS.find((x) => x.slug === slug)!;
  return {
    word: w.word,
    phonemeType: w.phonemeType,
    commonMispronunciations: w.commonMispronunciations,
    acceptedTranscripts: w.acceptedTranscripts,
    referenceWaveform: w.referenceWaveform,
    anatomicalTipEs: w.anatomicalTipEs,
    syllables: w.chunks.length,
  };
}

const goodThirty = frames([
  { ms: 240, ...SILENCE },
  { ms: 112, ...FRICATIVE },
  { ms: 320, ...VOWEL },
  { ms: 160, ...WEAK_VOWEL },
  { ms: 400, ...SILENCE },
]);
const dirty = frames([
  { ms: 300, ...SILENCE },
  { ms: 320, ...VOWEL },
  { ms: 160, ...WEAK_VOWEL },
  { ms: 400, ...SILENCE },
]);

describe("getThPositions", () => {
  it("classifies TH placement", () => {
    assert.deepEqual(getThPositions("thirty"), ["initial"]);
    assert.deepEqual(getThPositions("weather"), ["medial"]);
    assert.deepEqual(getThPositions("strength"), ["final"]);
    assert.deepEqual(getThPositions("bath"), ["final"]);
    assert.deepEqual(getThPositions("th").sort(), ["final", "initial"]);
    assert.deepEqual(getThPositions("ty"), []);
  });
});

describe("analyzeAcoustics (Engine B)", () => {
  it("detects /θ/ friction before the vowel and no plosive onset", () => {
    const r = analyzeAcoustics(goodThirty, targetFor("thirty"));
    assert.equal(r.speechDetected, true);
    assert.ok(r.frictionMs >= 70, `frictionMs=${r.frictionMs}`);
    assert.equal(r.plosiveOnset, false);
    assert.ok(!r.issues.includes("no-friction"));
    assert.ok(r.score >= 80, `score=${r.score}`);
    assert.equal(r.userWaveform.length, 48);
  });

  it("flags a Spanish-style plosive with no friction ('dirty')", () => {
    const r = analyzeAcoustics(dirty, targetFor("thirty"));
    assert.equal(r.frictionMs, 0);
    assert.equal(r.plosiveOnset, true);
    assert.ok(r.issues.includes("no-friction"));
    assert.ok(r.issues.includes("plosive"));
    assert.ok(r.score < 50, `score=${r.score}`);
  });

  it("detects a closure gap for medial /ð/ ('wedder') but not for continuous speech", () => {
    const wedder = frames([
      { ms: 200, ...SILENCE },
      { ms: 200, ...VOWEL },
      { ms: 96, ...SILENCE },
      { ms: 240, ...WEAK_VOWEL },
      { ms: 300, ...SILENCE },
    ]);
    const weather = frames([
      { ms: 200, ...SILENCE },
      { ms: 200, ...VOWEL },
      { ms: 96, rms: 0.06, high: 1e-7, low: 1e-6, mid: 1e-6 },
      { ms: 240, ...WEAK_VOWEL },
      { ms: 300, ...SILENCE },
    ]);
    assert.equal(analyzeAcoustics(wedder, targetFor("weather")).closureGap, true);
    const good = analyzeAcoustics(weather, targetFor("weather"));
    assert.equal(good.closureGap, false);
    assert.ok(good.score >= 80, `score=${good.score}`);
  });

  it("detects final /θ/ friction ('bath' vs 'bat')", () => {
    const bath = frames([
      { ms: 200, ...SILENCE },
      { ms: 360, ...VOWEL },
      { ms: 144, ...FRICATIVE },
      { ms: 300, ...SILENCE },
    ]);
    const bat = frames([
      { ms: 200, ...SILENCE },
      { ms: 360, ...VOWEL },
      { ms: 400, ...SILENCE },
    ]);
    assert.ok(analyzeAcoustics(bath, targetFor("bath")).frictionMs >= 70);
    assert.ok(analyzeAcoustics(bat, targetFor("bath")).issues.includes("no-friction"));
  });

  it("reports no speech for silence", () => {
    const r = analyzeAcoustics(frames([{ ms: 1500, ...SILENCE }]), targetFor("thirty"));
    assert.equal(r.speechDetected, false);
    assert.deepEqual(r.issues, ["no-speech"]);
  });

  it("ignores a trailing button click or breath separated by silence from the word", () => {
    const withTrailingClick = frames([
      { ms: 240, ...SILENCE },
      { ms: 112, ...FRICATIVE },
      { ms: 320, ...VOWEL },
      { ms: 160, ...WEAK_VOWEL },
      { ms: 700, ...SILENCE },
      { ms: 48, rms: 0.12, high: 1e-8, low: 1e-5, mid: 1e-6 }, // trailing click
      { ms: 160, ...SILENCE },
    ]);
    const r = analyzeAcoustics(withTrailingClick, targetFor("thirty"));
    assert.equal(r.speechDetected, true);
    assert.ok(r.durationMs < 650, `durationMs=${r.durationMs} should not include the 700ms silence + click`);
    assert.ok(r.score >= 80, `score=${r.score}`);
  });
});

describe("evaluateSpeech (Engine A)", () => {
  const t = targetFor("thirty");
  it("matches the target word and digit transcripts", () => {
    assert.equal(evaluateSpeech(["thirty"], t).kind, "match");
    assert.equal(evaluateSpeech(["thirty"], t).score, 100);
    assert.equal(evaluateSpeech(["30"], t).kind, "match");
    assert.equal(evaluateSpeech(["Thirty."], t).kind, "match");
  });
  it("penalizes lower-ranked matches", () => {
    assert.equal(evaluateSpeech(["flirty", "thirty"], t).score, 92);
  });
  it("reports the trap when it outranks the target", () => {
    const r = evaluateSpeech(["dirty", "thirty"], t);
    assert.equal(r.kind, "match");
    assert.equal(r.trap?.heardWord, "dirty");
  });
  it("detects phonetic traps", () => {
    const r = evaluateSpeech(["dirty", "durty"], t);
    assert.equal(r.kind, "trap");
    assert.match(r.trap!.correctionTipEs, /lengua/);
  });
  it("handles unknown and empty transcripts", () => {
    assert.equal(evaluateSpeech(["banana"], t).kind, "unknown");
    assert.equal(evaluateSpeech([], t).kind, "none");
  });
  it("accepts homophones", () => {
    assert.equal(evaluateSpeech(["whether"], targetFor("weather")).kind, "match");
    assert.equal(evaluateSpeech(["threw"], targetFor("through")).kind, "match");
  });
});

describe("combined scoring", () => {
  const t = targetFor("thirty");
  it("passes a correct dual-engine attempt", () => {
    const r = evaluateAttempt(goodThirty, ["thirty"], t);
    assert.equal(r.engine, "dual");
    assert.equal(r.passed, true);
    assert.equal(r.errorType, null);
  });
  it("caps trap attempts and returns the trap tip", () => {
    const r = evaluateAttempt(goodThirty, ["dirty"], t);
    assert.ok(r.score <= 55);
    assert.equal(r.passed, false);
    assert.equal(r.tipEs, t.commonMispronunciations[0].correctionTipEs);
  });
  it("does not pass when the recognizer is lenient but friction is missing", () => {
    const r = evaluateAttempt(dirty, ["thirty"], t);
    assert.equal(r.passed, false);
    assert.ok(r.errorType);
  });
  it("falls back to the acoustic engine without speech results (iOS / in-app browsers)", () => {
    const r = evaluateAttempt(goodThirty, [], t);
    assert.equal(r.engine, "acoustic");
    assert.equal(r.passed, true);
  });
  it("returns 0 with guidance when nothing was heard", () => {
    const silent = analyzeAcoustics(frames([{ ms: 1000, ...SILENCE }]), t);
    const r = combineEvaluation(evaluateSpeech([], t), silent, t);
    assert.equal(r.score, 0);
    assert.match(r.tipEs, /micrófono/);
  });
});
