"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bandPower } from "@/lib/audio-analysis";
import {
  evaluateAttempt,
  type AcousticFrame,
  type EvaluationResult,
  type EvaluationTarget,
} from "@/lib/evaluation";
import { markHumanInteraction } from "@/lib/human-gate";
import { WAVEFORM_BARS } from "@/lib/types";

/* Minimal Web Speech API typings (not part of TypeScript's DOM lib). */
interface SpeechAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechResultItem {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternative;
}
interface SpeechResultEvent extends Event {
  readonly results: { readonly length: number; [index: number]: SpeechResultItem };
}
interface SpeechErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};
/** Whether Engine A (Web Speech API) is available in this browser. */
export function useSpeechSupport(): boolean {
  return useSyncExternalStore(noopSubscribe, () => getSpeechRecognitionCtor() !== null, () => false);
}

export type RecorderStatus = "idle" | "requesting" | "recording" | "analyzing" | "done" | "error";

export interface VoiceEvaluatorOptions {
  target: EvaluationTarget;
  /** Friction band analysed by Engine B, e.g. [4000, 8000] Hz for /θ/. */
  frictionBand: [number, number];
  useSpeech?: boolean;
  maxDurationMs?: number;
  /** Auto-stop after this much silence following detected speech. */
  silenceStopMs?: number;
  onResult?: (result: EvaluationResult) => void;
}

interface Session {
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  frames: AcousticFrame[];
  startedAt: number;
  rafId: number;
  timeoutId: number;
  recognition: SpeechRecognitionLike | null;
  recognitionDone: Promise<void>;
  finalAlts: string[];
  interimAlts: string[];
  heardVoiceAt: number | null;
  lastVoiceAt: number;
  stopping: boolean;
}

const LOW_BAND: [number, number] = [80, 500];

/**
 * Dual-engine, 100% client-side pronunciation evaluator.
 * Engine A: Web Speech API (en-US, maxAlternatives 5) → phonetic trap matching.
 * Engine B: Web Audio API AnalyserNode FFT → friction energy in the target band, plosive onset,
 * closure gaps and envelope/duration alignment. Engine B alone works on iOS Safari / in-app browsers.
 */
export function useVoiceEvaluator({
  target,
  frictionBand,
  useSpeech = true,
  maxDurationMs = 3500,
  silenceStopMs = 900,
  onResult,
}: VoiceEvaluatorOptions) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveLevelsRef = useRef<Float32Array>(new Float32Array(WAVEFORM_BARS));
  const ctxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const latest = useRef({ target, frictionBand, onResult, maxDurationMs, silenceStopMs });

  useEffect(() => {
    latest.current = { target, frictionBand, onResult, maxDurationMs, silenceStopMs };
  });

  const teardown = useCallback((session: Session) => {
    cancelAnimationFrame(session.rafId);
    window.clearTimeout(session.timeoutId);
    session.source.disconnect();
    session.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const finish = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.stopping) return;
    session.stopping = true;
    teardown(session);
    setStatus("analyzing");

    try {
      session.recognition?.stop();
    } catch {
      // Recognition may already have ended on its own.
    }
    await Promise.race([session.recognitionDone, new Promise((r) => window.setTimeout(r, 1500))]);
    session.recognition?.abort();

    const alternatives = [...new Set([...session.finalAlts, ...session.interimAlts])];
    const evaluation = evaluateAttempt(session.frames, alternatives, latest.current.target);
    sessionRef.current = null;
    setResult(evaluation);
    setStatus("done");
    latest.current.onResult?.(evaluation);
  }, [teardown]);

  const startRecognition = useCallback((session: Session) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      let resolveDone: () => void = () => {};
      session.recognitionDone = new Promise<void>((r) => (resolveDone = r));
      rec.onresult = (e) => {
        const finals: string[] = [];
        const interims: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          for (let j = 0; j < res.length; j++) {
            const text = res[j]?.transcript?.trim();
            if (text) (res.isFinal ? finals : interims).push(text);
          }
        }
        if (finals.length) session.finalAlts = finals;
        if (interims.length) session.interimAlts = interims;
      };
      rec.onerror = () => resolveDone();
      rec.onend = () => resolveDone();
      rec.start();
      session.recognition = rec;
    } catch {
      session.recognition = null;
      session.recognitionDone = Promise.resolve();
    }
  }, []);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    markHumanInteraction();
    setError(null);
    setResult(null);
    liveLevelsRef.current.fill(0);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no permite usar el micrófono. Prueba con Chrome, Edge o Safari actualizados (y HTTPS).");
      setStatus("error");
      return;
    }

    setStatus("requesting");
    try {
      // AudioContext must be created/resumed inside the user gesture (iOS Safari).
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current ??= new AudioCtx();
      const ctx = ctxRef.current;
      const resumed = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
      });
      await resumed;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      analyser.minDecibels = -100;
      analyser.maxDecibels = -30;
      source.connect(analyser);

      const session: Session = {
        stream,
        source,
        analyser,
        frames: [],
        startedAt: performance.now(),
        rafId: 0,
        timeoutId: 0,
        recognition: null,
        recognitionDone: Promise.resolve(),
        finalAlts: [],
        interimAlts: [],
        heardVoiceAt: null,
        lastVoiceAt: 0,
        stopping: false,
      };
      sessionRef.current = session;
      if (useSpeech) startRecognition(session);

      const timeBuf = new Float32Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);
      const { frictionBand: band, maxDurationMs: maxMs, silenceStopMs: silenceMs } = latest.current;
      const midBand: [number, number] = [500, band[0]];
      const msPerBar = maxMs / WAVEFORM_BARS;

      const tick = () => {
        if (session.stopping) return;
        const t = performance.now() - session.startedAt;
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getByteFrequencyData(freqBuf);
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(sum / timeBuf.length);
        session.frames.push({
          t,
          rms,
          high: bandPower(freqBuf, ctx.sampleRate, analyser.fftSize, band),
          low: bandPower(freqBuf, ctx.sampleRate, analyser.fftSize, LOW_BAND),
          mid: bandPower(freqBuf, ctx.sampleRate, analyser.fftSize, midBand),
        });

        const bar = Math.min(WAVEFORM_BARS - 1, Math.floor(t / msPerBar));
        liveLevelsRef.current[bar] = Math.max(liveLevelsRef.current[bar], Math.min(1, rms * 6));

        // Simple voice-activity detection for hands-free auto-stop.
        if (rms > 0.03) {
          session.heardVoiceAt ??= t;
          session.lastVoiceAt = t;
        }
        if (session.heardVoiceAt !== null && t - session.lastVoiceAt > silenceMs && t > 600) {
          void finish();
          return;
        }
        session.rafId = requestAnimationFrame(tick);
      };
      session.rafId = requestAnimationFrame(tick);
      session.timeoutId = window.setTimeout(() => void finish(), maxMs);
      setStatus("recording");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Necesitamos permiso para usar el micrófono. Actívalo en la barra de direcciones y vuelve a intentarlo."
          : name === "NotFoundError"
            ? "No encontramos ningún micrófono conectado."
            : "No pudimos iniciar el micrófono. Cierra otras apps que lo estén usando e inténtalo de nuevo.",
      );
      setStatus("error");
      sessionRef.current = null;
    }
  }, [finish, startRecognition, useSpeech]);

  const stop = useCallback(() => {
    void finish();
  }, [finish]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
    liveLevelsRef.current.fill(0);
  }, []);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.stopping = true;
        teardown(session);
        session.recognition?.abort();
        sessionRef.current = null;
      }
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [teardown]);

  return { status, result, error, start, stop, reset, liveLevelsRef };
}
