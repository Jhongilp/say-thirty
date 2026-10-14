import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateSpeech, normalizeTranscript } from "../lib/evaluation";
import { FALLBACK_WORDS } from "../lib/fallback-words";
import { validateWordDocument } from "../lib/word-validation";

const SPEC_TRAPS: Record<string, string[]> = {
  thirty: ["dirty", "tirty", "thirteen"],
  thirteen: ["thirty", "dirteen"],
  through: ["true", "drew", "trough"],
  though: ["dough", "tough", "thought"],
  thought: ["taught", "dot", "fought"],
  weather: ["wedder", "wetter"],
  whether: ["wedder", "whiter"],
  bath: ["bat", "bad", "bass"],
  breath: ["bread", "breathe"],
  strength: ["strenth", "strengt"],
};

describe("offline seed data (lib/fallback-words.ts)", () => {
  it("contains exactly the 10 MVP words in order", () => {
    assert.deepEqual(
      FALLBACK_WORDS.map((w) => w.slug),
      Object.keys(SPEC_TRAPS),
    );
    assert.deepEqual(
      FALLBACK_WORDS.map((w) => w.orderIndex),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
  });

  for (const word of FALLBACK_WORDS) {
    describe(word.slug, () => {
      it("passes schema validation", () => {
        assert.deepEqual(validateWordDocument(word), []);
      });

      it("includes the spec's phonetic traps", () => {
        const heard = word.commonMispronunciations.map((m) => m.heardWord);
        for (const trap of SPEC_TRAPS[word.slug]) assert.ok(heard.includes(trap), `missing trap "${trap}"`);
      });

      it("never lists an accepted transcript as a mistake", () => {
        const accepted = new Set([word.word, ...(word.acceptedTranscripts ?? [])].map(normalizeTranscript));
        for (const m of word.commonMispronunciations) assert.ok(!accepted.has(normalizeTranscript(m.heardWord)), m.heardWord);
      });

      it("recognizes its own word as a match", () => {
        const r = evaluateSpeech([word.word.toLowerCase()], {
          word: word.word,
          phonemeType: word.phonemeType,
          commonMispronunciations: word.commonMispronunciations,
          acceptedTranscripts: word.acceptedTranscripts,
          referenceWaveform: word.referenceWaveform,
          anatomicalTipEs: word.anatomicalTipEs,
          syllables: word.chunks.length,
        });
        assert.equal(r.kind, "match");
        assert.equal(r.trap, null);
      });

      it("has a long-form article (anti-thin content)", () => {
        const words = word.seo.article.whyIsItHardEs.split(/\s+/).length;
        assert.ok(words >= 140, `whyIsItHardEs has only ${words} words`);
        assert.ok(word.seo.metaDescription.length <= 170, "metaDescription too long");
      });
    });
  }
});
