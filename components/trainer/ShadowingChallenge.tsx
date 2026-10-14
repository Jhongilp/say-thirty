"use client";

import { Mic, Square, Volume2 } from "lucide-react";
import { useSentenceShadowing } from "@/hooks/useSentenceShadowing";
import { speakText, stopPlayback } from "@/lib/audio-playback";
import { markHumanInteraction } from "@/lib/human-gate";
import type { WordDocument } from "@/lib/types";
import { normalizeTranscript } from "@/lib/evaluation";

/** Phase 4: real-speed context challenge (shadowing express). */
export default function ShadowingChallenge({ word }: { word: WordDocument }) {
  const { english, spanish, ipa } = word.shadowingSentence;
  const accepted = word.acceptedTranscripts ?? [];
  const { status, transcript, score, error, start, stop } = useSentenceShadowing(english, word.word, accepted);
  const targets = new Set([word.word, ...accepted].map(normalizeTranscript));

  const listen = () => {
    markHumanInteraction();
    stopPlayback();
    void speakText(english, 0.95).catch(() => {});
  };

  const tokens = score?.tokens ?? english.split(/\s+/).map((text) => ({ text, matched: false, isTarget: targets.has(normalizeTranscript(text)) }));

  return (
    <div>
      <p className="text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
        {tokens.map((t, i) => (
          <span
            key={`${t.text}-${i}`}
            className={`mr-1.5 inline-block rounded px-0.5 transition ${t.isTarget ? "underline decoration-indigo-500 decoration-4 underline-offset-4" : ""} ${
              score ? (t.matched ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900") : ""
            }`}
          >
            {t.text}
          </span>
        ))}
      </p>
      <p className="mt-2 font-ipa text-sm text-indigo-700">{ipa}</p>
      <p className="mt-1 text-sm italic text-slate-600">{spanish}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={listen}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-indigo-400"
        >
          <Volume2 className="size-4" /> Escuchar frase
        </button>
        <button
          type="button"
          onClick={status === "listening" ? stop : start}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${
            status === "listening" ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {status === "listening" ? <Square className="size-4" /> : <Mic className="size-4" />}
          {status === "listening" ? "Terminar" : "Repetir a velocidad real"}
        </button>
      </div>

      {status === "listening" && <p className="mt-3 text-sm text-slate-500">Escuchando… {transcript && <em>«{transcript}»</em>}</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {score && status === "done" && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" aria-live="polite">
          <p className="font-semibold text-slate-900">
            Ritmo y claridad: {score.score}% {score.targetHit ? `· «${word.word}» reconocida ✅` : `· «${word.word}» no reconocida ❌`}
          </p>
          <p className="mt-1 text-slate-600">
            Escuchamos: «{transcript}». {score.score >= 80 ? "¡Fluidez nativa! Repite la frase 3 veces más para fijar la memoria muscular." : "Escucha otra vez e imita el ritmo, no solo las palabras."}
          </p>
        </div>
      )}
    </div>
  );
}
