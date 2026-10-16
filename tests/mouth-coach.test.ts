import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAttempt, type AcousticIssue, type EvaluationResult } from "../lib/evaluation";
import { FALLBACK_WORDS } from "../lib/fallback-words";
import { getCoachFocus, getMouthLesson, getMouthMotion, usesVoicedTh } from "../lib/mouth-coach";

function word(slug: string) {
  const found = FALLBACK_WORDS.find((w) => w.slug === slug);
  assert.ok(found);
  return found;
}

function result(transcript: string[] = [], issues: AcousticIssue[] = [], speechDetected = true): EvaluationResult {
  const target = word("thirty");
  const evaluated = evaluateAttempt([], transcript, { ...target, syllables: target.chunks.length });
  return { ...evaluated, acoustic: { ...evaluated.acoustic, speechDetected, issues } };
}

describe("mouth lessons", () => {
  for (const target of FALLBACK_WORDS) {
    it(`provides four unscored steps and appropriate voicing for ${target.word}`, () => {
      const steps = getMouthLesson(target);
      assert.deepEqual(steps.map((s) => s.id), ["position", "airflow", "voicing", "join"]);
      assert.ok(steps.every((s) => s.instruction && s.practice && s.selfCheck));
      const voiced = ["though", "weather", "whether"].includes(target.slug);
      assert.equal(usesVoicedTh(target), voiced);
      assert.match(steps[2].instruction, voiced ? /\/ð\// : /\/θ\//);
      assert.ok(steps[3].instruction.includes(target.word));
      for (const step of steps) {
        for (const progress of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) {
          const motion = getMouthMotion(target, step.id, progress);
          assert.ok(motion.amount >= 0 && motion.amount <= 1);
        }
      }
    });
  }

  it("does not tell final TH learners to add a vowel", () => {
    for (const slug of ["bath", "breath", "strength"]) {
      const steps = getMouthLesson(word(slug));
      assert.match(steps[3].instruction, /sin añadir una vocal/);
      assert.doesNotMatch(steps[2].instruction, /vocal siguiente/);
    }
  });

  it("moves toward the teeth for placement, holding gently for air and voicing", () => {
    assert.deepEqual(getMouthMotion(word("thirty"), "position", 0), { from: "rest", to: "interdental", amount: 0 });
    assert.equal(getMouthMotion(word("thirty"), "position", 1).amount, 1);
    for (const step of ["airflow", "voicing"] as const) {
      assert.deepEqual(getMouthMotion(word("thirty"), step, 0.5), { from: "interdental", to: "interdental", amount: 0 });
    }
  });

  it("joins initial TH to the neighbouring posture", () => {
    for (const slug of ["thirty", "thirteen", "through"]) {
      assert.deepEqual(getMouthMotion(word(slug), "join", 1), { from: "interdental", to: "retracted", amount: 1 });
    }
    assert.deepEqual(getMouthMotion(word("though"), "join", 1), { from: "interdental", to: "rest", amount: 1 });
  });

  it("ends at the teeth for final TH, starting with a velar posture for strength", () => {
    assert.deepEqual(getMouthMotion(word("bath"), "join", 1), { from: "rest", to: "interdental", amount: 1 });
    assert.deepEqual(getMouthMotion(word("strength"), "join", 0), { from: "velar", to: "interdental", amount: 0 });
    assert.equal(getMouthMotion(word("strength"), "join", 1).amount, 1);
  });

  it("moves in and out for medial TH and clamps the animation endpoints", () => {
    const target = word("weather");
    assert.equal(getMouthMotion(target, "join", 0).amount, 0);
    assert.equal(getMouthMotion(target, "join", 0.5).amount, 1);
    assert.equal(getMouthMotion(target, "join", 1).amount, 0);
    assert.deepEqual(getMouthMotion(target, "join", -1), getMouthMotion(target, "join", 0));
    assert.deepEqual(getMouthMotion(target, "join", 2), getMouthMotion(target, "join", 1));
  });
});

describe("focused movement practice", () => {
  it("does not attribute a missing microphone signal to mouth position", () => {
    assert.equal(getCoachFocus(result([], ["no-speech"], false)), null);
  });

  it("routes F substitutions to tongue versus lip placement", () => {
    const focus = getCoachFocus(result(["forty"]));
    assert.equal(focus?.step, "position");
    assert.equal(focus?.contrast, "labiodental");
  });

  it("routes T/D substitutions and acoustic closures to continuous air", () => {
    for (const transcript of ["dirty", "tirty"]) {
      const focus = getCoachFocus(result([transcript]));
      assert.equal(focus?.step, "airflow");
      assert.equal(focus?.contrast, "dentalStop");
    }
    for (const issue of ["closure", "plosive"] as const) {
      assert.equal(getCoachFocus(result([], [issue]))?.contrast, "dentalStop");
    }
  });

  it("offers gentle airflow for missing friction and joining otherwise", () => {
    assert.equal(getCoachFocus(result([], ["no-friction"]))?.step, "airflow");
    assert.equal(getCoachFocus(result(["thirty"]))?.step, "join");
    assert.equal(getCoachFocus(result(["thirty"], ["no-speech"], false))?.step, "join");
  });
});
