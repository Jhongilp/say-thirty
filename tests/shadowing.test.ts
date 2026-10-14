import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreShadowing } from "../lib/shadowing";

describe("scoreShadowing", () => {
  const sentence = "I have thirty things to think about on Thursday.";

  it("scores a perfect repetition at 100", () => {
    const r = scoreShadowing(sentence, "I have thirty things to think about on Thursday", "Thirty");
    assert.equal(r.score, 100);
    assert.equal(r.targetHit, true);
  });

  it("accepts digit transcripts for the target word", () => {
    const r = scoreShadowing(sentence, "I have 30 things to think about on Thursday", "Thirty", ["30"]);
    assert.equal(r.targetHit, true);
  });

  it("marks missed words, including the target", () => {
    const r = scoreShadowing(sentence, "I have dirty things to sink about on Thursday", "Thirty", ["30"]);
    assert.equal(r.targetHit, false);
    assert.ok(r.score < 80);
    assert.equal(r.tokens.find((t) => t.isTarget)?.matched, false);
  });
});
