import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bandPower,
  computeWaveformPeaks,
  decodeWavPcm16,
  envelopeCorrelation,
  findActiveRegion,
  normalizePeaks,
  resampleEnvelope,
} from "../lib/audio-analysis";

function makeWav(samples: Int16Array, sampleRate = 24000): Uint8Array {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return new Uint8Array(buf);
}

describe("audio-analysis", () => {
  it("resamples envelopes to 48 bars using peaks", () => {
    const out = resampleEnvelope(Array.from({ length: 480 }, (_, i) => i), 48);
    assert.equal(out.length, 48);
    assert.equal(out[47], 479);
    assert.deepEqual(resampleEnvelope([], 4), [0, 0, 0, 0]);
  });

  it("normalizes peaks to 0..1", () => {
    assert.deepEqual(normalizePeaks([1, 2, 4]), [0.25, 0.5, 1]);
    assert.deepEqual(normalizePeaks([0, 0]), [0, 0]);
  });

  it("finds the active region", () => {
    assert.deepEqual(findActiveRegion([0, 0, 0.5, 1, 0.4, 0]), [2, 4]);
    assert.equal(findActiveRegion([0, 0]), null);
  });

  it("decodes 16-bit PCM WAV and computes a trimmed 48-bar waveform", () => {
    const sr = 24000;
    const pcm = new Int16Array(sr); // 1 s: 0.25 s silence, 0.5 s tone, 0.25 s silence
    for (let i = sr / 4; i < (3 * sr) / 4; i++) pcm[i] = Math.round(Math.sin(i / 5) * 12000);
    const { samples, sampleRate } = decodeWavPcm16(makeWav(pcm, sr));
    assert.equal(sampleRate, sr);
    assert.equal(samples.length, sr);
    const peaks = computeWaveformPeaks(samples, sampleRate);
    assert.equal(peaks.length, 48);
    assert.equal(Math.max(...peaks), 1);
    assert.ok(peaks.every((p) => p >= 0 && p <= 1));
    assert.ok(peaks[0] > 0.5, "leading silence should be trimmed");
  });

  it("rejects non-WAV buffers", () => {
    assert.throws(() => decodeWavPcm16(new Uint8Array(64)), /Not a WAV/);
  });

  it("measures band power from byte FFT data", () => {
    const bins = new Uint8Array(1024);
    // 48 kHz / 2048 FFT = 23.4 Hz per bin → 4–8 kHz ≈ bins 170–342.
    for (let i = 170; i <= 342; i++) bins[i] = 255;
    const high = bandPower(bins, 48000, 2048, [4000, 8000]);
    const low = bandPower(bins, 48000, 2048, [80, 500]);
    assert.ok(high > low * 1000);
  });

  it("correlates identical envelopes as 1", () => {
    const a = [0.1, 0.5, 1, 0.4];
    assert.ok(Math.abs(envelopeCorrelation(a, a) - 1) < 1e-9);
    assert.equal(envelopeCorrelation([1, 1], [0, 1]), 0);
  });
});
