import { WAVEFORM_BARS } from "./types";

/** Resample an amplitude envelope to `bars` buckets using the peak of each bucket. */
export function resampleEnvelope(values: ArrayLike<number>, bars = WAVEFORM_BARS): number[] {
  const out = new Array<number>(bars).fill(0);
  const n = values.length;
  if (n === 0) return out;
  for (let b = 0; b < bars; b++) {
    const from = Math.floor((b * n) / bars);
    const to = Math.max(from + 1, Math.floor(((b + 1) * n) / bars));
    let peak = 0;
    for (let i = from; i < to && i < n; i++) peak = Math.max(peak, values[i]);
    out[b] = peak;
  }
  return out;
}

export function normalizePeaks(values: number[], decimals = 3): number[] {
  const max = values.reduce((m, v) => Math.max(m, v), 0);
  const factor = 10 ** decimals;
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => Math.round((v / max) * factor) / factor);
}

/** Indices [start, end] (inclusive) of the region whose level exceeds `ratio` of the peak. */
export function findActiveRegion(values: ArrayLike<number>, ratio = 0.06): [number, number] | null {
  let peak = 0;
  for (let i = 0; i < values.length; i++) peak = Math.max(peak, values[i]);
  if (peak <= 0) return null;
  const threshold = peak * ratio;
  let start = -1;
  let end = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] >= threshold) {
      if (start === -1) start = i;
      end = i;
    }
  }
  return start === -1 ? null : [start, end];
}

/** RMS level of consecutive windows of `windowSize` samples. */
export function rmsWindows(samples: ArrayLike<number>, windowSize: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < samples.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(samples.length, i + windowSize);
    for (let j = i; j < end; j++) sum += samples[j] * samples[j];
    out.push(Math.sqrt(sum / Math.max(1, end - i)));
  }
  return out;
}

/**
 * Computes the normalized 48-bar reference waveform from raw PCM samples (-1..1):
 * 10 ms RMS windows, silence trimmed, peak-resampled, normalized to 0..1.
 */
export function computeWaveformPeaks(
  samples: ArrayLike<number>,
  sampleRate: number,
  bars = WAVEFORM_BARS,
): number[] {
  const windows = rmsWindows(samples, Math.max(1, Math.round(sampleRate * 0.01)));
  const region = findActiveRegion(windows, 0.04);
  if (!region) return new Array<number>(bars).fill(0);
  const trimmed = windows.slice(region[0], region[1] + 1);
  return normalizePeaks(resampleEnvelope(trimmed, bars));
}

/** Parses a RIFF/WAVE buffer containing 16-bit PCM (Google TTS `LINEAR16`) into mono floats. */
export function decodeWavPcm16(buffer: Uint8Array): { samples: Float32Array; sampleRate: number } {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const tag = (offset: number) =>
    String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("Not a WAV buffer");

  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;
  while (offset + 8 <= view.byteLength) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === "data") {
      if (bitsPerSample !== 16) throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
      const dataSize = Math.min(size, view.byteLength - body);
      const frames = Math.floor(dataSize / (2 * channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        samples[i] = view.getInt16(body + i * 2 * channels, true) / 32768;
      }
      return { samples, sampleRate };
    }
    offset = body + size + (size % 2);
  }
  throw new Error("WAV buffer has no data chunk");
}

/**
 * Mean linear power of the FFT bins in [loHz, hiHz] from `AnalyserNode.getByteFrequencyData()` output.
 * Byte bins are dB values mapped from [minDecibels, maxDecibels] to [0, 255].
 */
export function bandPower(
  bytes: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
  [loHz, hiHz]: [number, number],
  minDecibels = -100,
  maxDecibels = -30,
): number {
  const binHz = sampleRate / fftSize;
  const from = Math.max(0, Math.floor(loHz / binHz));
  const to = Math.min(bytes.length - 1, Math.ceil(hiHz / binHz));
  if (to < from) return 0;
  let sum = 0;
  for (let i = from; i <= to; i++) {
    const db = minDecibels + (bytes[i] / 255) * (maxDecibels - minDecibels);
    sum += bytes[i] === 0 ? 0 : 10 ** (db / 10);
  }
  return sum / (to - from + 1);
}

/** Pearson correlation of two equally sized envelopes (0 when undefined). */
export function envelopeCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    va += (a[i] - ma) ** 2;
    vb += (b[i] - mb) ** 2;
  }
  if (va === 0 || vb === 0) return 0;
  return cov / Math.sqrt(va * vb);
}
