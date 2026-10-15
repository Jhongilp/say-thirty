"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Ear, Loader2, Mic, RotateCcw, Snail, Square, Trophy, Volume2 } from "lucide-react";
import { useProgressStore } from "@/hooks/useProgressStore";
import { useSpeechSupport, useVoiceEvaluator } from "@/hooks/useVoiceEvaluator";
import { trackActiveLearner, trackEvent } from "@/lib/analytics";
import { playReference } from "@/lib/audio-playback";
import type { EvaluationResult, EvaluationTarget } from "@/lib/evaluation";
import { wordPath } from "@/lib/site";
import type { WordDocument } from "@/lib/types";
import FeedbackBadge from "./FeedbackBadge";
import MouthAnatomySVG from "./MouthAnatomySVG";
import ShadowingChallenge from "./ShadowingChallenge";
import SyllableChunker from "./SyllableChunker";
import WaveformCanvas from "./WaveformCanvas";

export interface PronunciationTrainerProps {
  word: WordDocument;
  nextWord: { slug: string; word: string } | null;
}

const PHASES = [
  { id: 1, title: "Diagnóstico", subtitle: "Mira y escucha" },
  { id: 2, title: "Espejo acústico", subtitle: "Graba tu voz" },
  { id: 3, title: "Sílabas", subtitle: "Bloque a bloque" },
  { id: 4, title: "Contexto real", subtitle: "Shadowing" },
] as const;

const HOLD_TO_TALK_MS = 450;

async function celebrate() {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.65 }, disableForReducedMotion: true });
}

/** Master interactive client component: the 4-phase above-the-fold trainer. */
export default function PronunciationTrainer({ word, nextWord }: PronunciationTrainerProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [mouthMode, setMouthMode] = useState<"english" | "spanish">("english");
  const [playing, setPlaying] = useState<null | "normal" | "slow">(null);
  const [justMastered, setJustMastered] = useState(false);
  const pressRef = useRef<{ at: number; startedHere: boolean } | null>(null);
  const speechSupported = useSpeechSupport();
  const { progress, recordAttempt, recordChunk } = useProgressStore();
  const wordProgress = progress.words[word.slug];

  const target = useMemo<EvaluationTarget>(
    () => ({
      word: word.word,
      phonemeType: word.phonemeType,
      commonMispronunciations: word.commonMispronunciations,
      acceptedTranscripts: word.acceptedTranscripts,
      referenceWaveform: word.referenceWaveform,
      anatomicalTipEs: word.anatomicalTipEs,
      syllables: word.chunks.length,
    }),
    [word],
  );

  const handleResult = (result: EvaluationResult) => {
    recordAttempt(word.slug, result.score);
    trackActiveLearner(word.slug, result.score);
    trackEvent("pronunciation_attempt", { word: word.slug, score: result.score, engine: result.engine });
    if (result.passed) {
      setJustMastered(true);
      void celebrate();
    }
  };

  const { status, result, error, start, stop, reset, liveLevelsRef, activeBarRef } = useVoiceEvaluator({
    target,
    frictionBand: word.targetFrequencyHz,
    onResult: handleResult,
  });
  const recording = status === "recording";
  const busy = status === "requesting" || status === "analyzing";

  const play = async (rate: 1 | 0.6) => {
    setPlaying(rate === 1 ? "normal" : "slow");
    try {
      await playReference({ text: word.word, normalUrl: word.audioNormalUrl, slowUrl: word.audioSlowUrl, rate });
    } catch {
      // Audio unavailable: nothing else to do; the visual guide remains.
    } finally {
      setPlaying(null);
    }
  };

  const onMicPointerDown = () => {
    if (recording) {
      stop();
      pressRef.current = null;
      return;
    }
    if (busy) return;
    pressRef.current = { at: performance.now(), startedHere: true };
    void start();
  };
  const onMicPointerUp = () => {
    const press = pressRef.current;
    pressRef.current = null;
    if (press?.startedHere && performance.now() - press.at >= HOLD_TO_TALK_MS) stop();
  };
  const onMicKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (recording) stop();
    else if (!busy) void start();
  };

  const mastered = Boolean(wordProgress?.mastered);

  return (
    <section aria-labelledby="trainer-title" className="rounded-3xl bg-white p-4 shadow-xl shadow-indigo-100 ring-1 ring-slate-200 sm:p-6">
      {/* Word header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Palabra {word.orderIndex} · {word.difficulty}
          </p>
          <h1 id="trainer-title" className="text-sm font-semibold text-slate-500">
            {word.seo.h1}
          </h1>
          <p className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {word.word}
          </p>
          <p className="mt-1 text-slate-600">
            <span className="font-ipa text-lg text-indigo-700">{word.ipa}</span> · {word.translationEs}
          </p>
          <p className="text-sm text-slate-500">Suena: {word.phoneticRespellingEs}</p>
        </div>
        {wordProgress && (
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
            <Trophy className={`size-4 ${mastered ? "text-amber-500" : "text-slate-400"}`} />
            Mejor: <strong>{wordProgress.bestScore}%</strong>
            {mastered && <span className="font-semibold text-emerald-600">· Dominada</span>}
          </div>
        )}
      </div>

      {/* Phase stepper */}
      <nav aria-label="Fases del entrenamiento" className="mt-5 grid grid-cols-4 gap-1.5 sm:gap-2">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPhase(p.id)}
            aria-current={phase === p.id ? "step" : undefined}
            className={`rounded-xl px-2 py-2 text-left transition sm:px-3 ${
              phase === p.id ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span className="block text-[11px] font-semibold opacity-80">Fase {p.id}</span>
            <span className="block text-xs font-bold leading-tight sm:text-sm">{p.title}</span>
            <span className="hidden text-[11px] opacity-80 sm:block">{p.subtitle}</span>
          </button>
        ))}
      </nav>

      <div className="mt-5 min-h-[420px]">
        {phase === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMouthMode("english")}
                  className={`rounded-full px-3 py-1.5 ${mouthMode === "english" ? "bg-white text-emerald-700 shadow" : "text-slate-600"}`}
                >
                  ✅ Inglés correcto
                </button>
                <button
                  type="button"
                  onClick={() => setMouthMode("spanish")}
                  className={`rounded-full px-3 py-1.5 ${mouthMode === "spanish" ? "bg-white text-rose-700 shadow" : "text-slate-600"}`}
                >
                  ❌ Hábito del español
                </button>
              </div>
              <MouthAnatomySVG
                phonemeType={word.phonemeType}
                word={word.word}
                mode={mouthMode}
                className="mx-auto block max-h-64 w-full max-w-sm rounded-2xl bg-slate-50 sm:max-h-80"
              />
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-base leading-relaxed text-slate-800">
                {mouthMode === "english"
                  ? word.anatomicalTipEs
                  : "En español, la «T» y la «D» se hacen apoyando la lengua detrás de los dientes y cortando el aire. Ese golpe es lo que hace que «thirty» suene a «dirty». Compara ambas posiciones."}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => play(1)}
                  disabled={playing !== null}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-4 font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-70"
                >
                  {playing === "normal" ? <Loader2 className="size-5 animate-spin" /> : <Volume2 className="size-5" />} Normal 1.0x
                </button>
                <button
                  type="button"
                  onClick={() => play(0.6)}
                  disabled={playing !== null}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-white px-4 py-4 font-semibold text-indigo-700 transition hover:border-indigo-400 disabled:opacity-70"
                >
                  {playing === "slow" ? <Loader2 className="size-5 animate-spin" /> : <Snail className="size-5" />} Lento 0.6x
                </button>
              </div>
              <p className="text-center font-ipa text-2xl text-indigo-700">{word.ipa}</p>
              <button
                type="button"
                onClick={() => setPhase(2)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Probar mi pronunciación <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 2 && (
          <div className="flex flex-col gap-4">
            <WaveformCanvas
              reference={word.referenceWaveform}
              chunks={word.chunks}
              word={word.word}
              userWaveform={result?.acoustic.userWaveform ?? null}
              liveLevelsRef={liveLevelsRef}
              activeBarRef={activeBarRef}
              recording={recording}
            />

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onPointerDown={onMicPointerDown}
                onPointerUp={onMicPointerUp}
                onPointerCancel={onMicPointerUp}
                onKeyDown={onMicKeyDown}
                onContextMenu={(e) => e.preventDefault()}
                aria-pressed={recording}
                aria-label={recording ? "Detener grabación" : `Grabar mi pronunciación de ${word.word}`}
                className={`relative grid size-24 touch-none select-none place-items-center rounded-full text-white shadow-lg transition active:scale-95 ${
                  recording ? "bg-rose-500" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {recording && <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-40" />}
                {busy ? <Loader2 className="size-10 animate-spin" /> : recording ? <Square className="size-9" /> : <Mic className="size-10" />}
              </button>
              <p className="text-sm text-slate-600">
                {status === "requesting"
                  ? "Activando micrófono…"
                  : recording
                    ? `Di «${word.word}» ahora…`
                    : status === "analyzing"
                      ? "Analizando tu pronunciación…"
                      : "Toca o mantén pulsado y di la palabra"}
              </p>
              {!speechSupported && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Ear className="size-3.5" /> Modo acústico: analizamos la fricción de la TH directamente en tu dispositivo.
                </p>
              )}
            </div>

            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            {result && status === "done" && <FeedbackBadge result={result} />}

            {result && status === "done" && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="size-4" /> Intentar de nuevo
                </button>
                {!result.passed && (
                  <button
                    type="button"
                    onClick={() => setPhase(3)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Practicar por sílabas <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            )}

            {justMastered && result?.passed && (
              <div className="animate-pop-in rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-center text-white shadow-lg">
                <p className="text-lg font-black">¡Dominada! 🎉</p>
                {nextWord ? (
                  <Link
                    href={wordPath(nextWord.slug)}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-bold text-emerald-700 shadow hover:bg-emerald-50"
                  >
                    ¡Dominada! Siguiente reto: {nextWord.word} <ArrowRight className="size-5" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-bold text-emerald-700 shadow hover:bg-emerald-50"
                  >
                    ¡Reto completado! Ver mi progreso <ArrowRight className="size-5" />
                  </Link>
                )}
                <button type="button" onClick={() => setPhase(4)} className="mt-2 block w-full text-sm text-white/90 underline">
                  O fija la memoria muscular con la frase en contexto
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 3 && (
          <SyllableChunker
            chunks={word.chunks}
            phonemeType={word.phonemeType}
            frictionBand={word.targetFrequencyHz}
            chunksDone={wordProgress?.chunksDone ?? []}
            onChunkDone={(label) => recordChunk(word.slug, label)}
          />
        )}

        {phase === 4 && <ShadowingChallenge word={word} />}
      </div>
    </section>
  );
}
