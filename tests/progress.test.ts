import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bumpStreak,
  currentStreak,
  emptyProgress,
  masteredCount,
  parseProgress,
  recordAttempt,
  recordChunk,
  recordGuidePractice,
} from "../lib/progress";

describe("progress store", () => {
  it("persists guide practice without a score, attempt or mastery", () => {
    const state = recordGuidePractice(emptyProgress(), "thirty", "2026-10-14");
    assert.deepEqual(state.words.thirty, {
      bestScore: 0, mastered: false, attempts: 0, chunksDone: [],
      lastPracticedAt: "2026-10-14", guidePracticed: true,
    });
    assert.equal(masteredCount(state), 0);
    assert.deepEqual(parseProgress(JSON.stringify(state)), state);
    assert.equal(recordGuidePractice(state, "thirty", "2026-10-14").streak.count, 1);
    assert.equal(recordGuidePractice(state, "bath", "2026-10-15").streak.count, 2);
  });

  it("keeps existing mastery, attempts and chunks when practicing the guide", () => {
    const previous = recordChunk(recordAttempt(emptyProgress(), "thirty", 86, "2026-10-14"), "thirty", "Thir-", "2026-10-14");
    const practiced = recordGuidePractice(previous, "thirty", "2026-10-15");
    assert.deepEqual(practiced.words.thirty, {
      ...previous.words.thirty, guidePracticed: true, lastPracticedAt: "2026-10-15",
    });
    assert.equal(recordAttempt(practiced, "thirty", 30, "2026-10-15").words.thirty.guidePracticed, true);
    assert.equal(previous.words.thirty.guidePracticed, undefined);
  });

  it("keeps legacy records unchanged and accepts only boolean guide completion", () => {
    const previous = recordAttempt(emptyProgress(), "bath", 60, "2026-10-14");
    assert.deepEqual(parseProgress(JSON.stringify(previous)), previous);
    const raw = { words: { bath: { ...previous.words.bath, guidePracticed: "true" } } };
    assert.equal(parseProgress(JSON.stringify(raw)).words.bath.guidePracticed, undefined);
  });

  it("records attempts, best score and mastery at >= 80", () => {
    let s = recordAttempt(emptyProgress(), "thirty", 62, "2026-10-14");
    assert.equal(s.words.thirty.mastered, false);
    s = recordAttempt(s, "thirty", 85, "2026-10-14");
    s = recordAttempt(s, "thirty", 40, "2026-10-14");
    assert.equal(s.words.thirty.bestScore, 85);
    assert.equal(s.words.thirty.mastered, true);
    assert.equal(s.words.thirty.attempts, 3);
    assert.equal(masteredCount(s), 1);
    assert.equal(masteredCount(s, ["bath"]), 0);
  });

  it("tracks chunks once", () => {
    let s = recordChunk(emptyProgress(), "thirty", "Thir-", "2026-10-14");
    s = recordChunk(s, "thirty", "Thir-", "2026-10-14");
    assert.deepEqual(s.words.thirty.chunksDone, ["Thir-"]);
  });

  it("bumps the daily streak across consecutive days and resets after a gap", () => {
    let st = bumpStreak({ count: 0, lastDate: null }, "2026-10-14");
    assert.deepEqual(st, { count: 1, lastDate: "2026-10-14" });
    st = bumpStreak(st, "2026-10-14");
    assert.equal(st.count, 1);
    st = bumpStreak(st, "2026-10-15");
    assert.equal(st.count, 2);
    st = bumpStreak(st, "2026-11-01");
    assert.equal(st.count, 1);
    // Month/year boundaries
    assert.equal(bumpStreak({ count: 4, lastDate: "2026-12-31" }, "2027-01-01").count, 5);
  });

  it("shows a streak only while it is still alive", () => {
    const s = { ...emptyProgress(), streak: { count: 3, lastDate: "2026-10-14" } };
    assert.equal(currentStreak(s, "2026-10-15"), 3);
    assert.equal(currentStreak(s, "2026-10-17"), 0);
  });

  it("survives corrupt or partial storage", () => {
    assert.deepEqual(parseProgress("not json"), emptyProgress());
    assert.deepEqual(parseProgress(null), emptyProgress());
    const p = parseProgress(JSON.stringify({ words: { bath: { bestScore: 900, mastered: true } } }));
    assert.equal(p.words.bath.bestScore, 100);
    assert.deepEqual(p.words.bath.chunksDone, []);
    assert.equal(p.streak.count, 0);
  });
});
