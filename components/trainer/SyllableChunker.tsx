"use client";

import { useMemo, useState } from "react";
import { Check, Medal, Mic, Square } from "lucide-react";
import { useVoiceEvaluator } from "@/hooks/useVoiceEvaluator";
import type { EvaluationResult, EvaluationTarget } from "@/lib/evaluation";
import type { PhonemeType, SyllableChunk } from "@/lib/types";

export const CHUNK_PASS_SCORE = 60;

export interface SyllableChunkerProps {
  chunks: SyllableChunk[];
  phonemeType: PhonemeType;
  frictionBand: [number, number];
  chunksDone: string[];
  onChunkDone: (label: string) => void;
}

const cleanLabel = (label: string) => label.replace(/[-–‐]/g, "").trim();

/** Phase 3: tap a phonetic slab, read the hint and record it in isolation (acoustic engine only). */
export default function SyllableChunker({ chunks, phonemeType, frictionBand, chunksDone, onChunkDone }: SyllableChunkerProps) {
  const [selected, setSelected] = useState(0);
  const [lastResult, setLastResult] = useState<{ label: string; result: EvaluationResult } | null>(null);
  const chunk = chunks[selected];

  const target = useMemo<EvaluationTarget>(
    () => ({
      word: cleanLabel(chunk.label),
      phonemeType,
      commonMispronunciations: [],
      referenceWaveform: [],
      anatomicalTipEs: chunk.hintEs,
      syllables: 1,
    }),
    [chunk, phonemeType],
  );

  const { status, start, stop, error } = useVoiceEvaluator({
    target,
    frictionBand,
    useSpeech: false,
    maxDurationMs: 2500,
    silenceStopMs: 700,
    onResult: (result) => {
      setLastResult({ label: chunk.label, result });
      if (result.score >= CHUNK_PASS_SCORE) onChunkDone(chunk.label);
    },
  });

  const recording = status === "recording" || status === "requesting";
  const allDone = chunks.every((c) => chunksDone.includes(c.label));
  const shown = lastResult?.label === chunk.label ? lastResult.result : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Sílabas">
        {chunks.map((c, i) => {
          const done = chunksDone.includes(c.label);
          return (
            <button
              key={c.label}
              type="button"
              role="tab"
              aria-selected={i === selected}
              disabled={recording}
              onClick={() => setSelected(i)}
              className={`relative rounded-xl border-2 px-4 py-2.5 text-lg font-bold transition ${
                i === selected ? "border-indigo-600 bg-indigo-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-800 hover:border-indigo-300"
              }`}
            >
              {c.label}
              {done && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3.5" aria-label="Superada" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="font-ipa text-indigo-700">{chunk.ipa}</p>
        <p className="mt-1 text-sm text-slate-700">{chunk.hintEs}</p>
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
            recording ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          {recording ? "Detener" : `Practicar «${chunk.label}»`}
        </button>
        {status === "analyzing" && <p className="mt-2 text-sm text-slate-500">Analizando…</p>}
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {shown && status === "done" && (
          <p className={`mt-2 text-sm font-medium ${shown.score >= CHUNK_PASS_SCORE ? "text-emerald-700" : "text-amber-700"}`} aria-live="polite">
            {shown.score >= CHUNK_PASS_SCORE ? `¡Bien! ${shown.score}% · ` : `${shown.score}% · ${shown.headlineEs}. `}
            {shown.score >= CHUNK_PASS_SCORE ? "Pasa a la siguiente sílaba." : shown.tipEs}
          </p>
        )}
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-xl border p-3 text-sm ${
          allDone ? "border-amber-300 bg-amber-50 text-amber-900" : "border-dashed border-slate-300 text-slate-500"
        }`}
      >
        <Medal className={`size-6 shrink-0 ${allDone ? "text-amber-500" : "text-slate-300"}`} />
        {allDone
          ? "¡Insignia de sílabas desbloqueada! Ya dominas cada bloque: ahora únelos en la palabra completa."
          : `Supera las ${chunks.length} sílabas para desbloquear la insignia (${chunks.filter((c) => chunksDone.includes(c.label)).length}/${chunks.length}).`}
      </div>
    </div>
  );
}
