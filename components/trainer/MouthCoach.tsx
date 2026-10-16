"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { playReference, stopPlayback } from "@/lib/audio-playback";
import { getMouthLesson, getMouthMotion, usesVoicedTh, type CoachFocus, type MouthContrast } from "@/lib/mouth-coach";
import type { WordDocument } from "@/lib/types";
import MouthAnatomySVG from "./MouthAnatomySVG";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (listener: () => void) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const getReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
const getServerMotion = () => true;

interface Props {
  word: WordDocument;
  focus: CoachFocus | null;
  practiced: boolean;
  onPracticed: () => void;
  onTryWord: () => void;
}

export default function MouthCoach({ word, focus, practiced, onPracticed, onTryWord }: Props) {
  const steps = getMouthLesson(word);
  const [index, setIndex] = useState(() => Math.max(0, steps.findIndex((s) => s.id === focus?.step)));
  const [contrast, setContrast] = useState<MouthContrast>(focus?.contrast ?? "none");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(1);
  const progressRef = useRef(1);
  const [checks, setChecks] = useState<string[]>(practiced ? steps.map((s) => s.id) : []);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerMotion);
  const step = steps[index];
  const voiced = usesVoicedTh(word);
  const motion = getMouthMotion(word, step.id, progress);
  const complete = checks.length === steps.length;

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const duration = step.id === "join" ? 6000 : 4000;
    let previous = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const next = Math.min(1, progressRef.current + (now - previous) / duration);
      previous = now;
      progressRef.current = next;
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, reducedMotion, step.id]);

  useEffect(() => {
    const query = window.matchMedia(MOTION_QUERY);
    const pause = () => { if (query.matches) setPlaying(false); };
    query.addEventListener("change", pause);
    return () => query.removeEventListener("change", pause);
  }, []);

  useEffect(() => () => stopPlayback(), []);

  function seek(value: number) {
    setPlaying(false);
    progressRef.current = value;
    setProgress(value);
  }
  function selectStep(next: number) {
    setIndex(next);
    setContrast("none");
    seek(1);
  }
  function replay() {
    progressRef.current = 0;
    setProgress(0);
    setPlaying(true);
  }
  function toggleCheck() {
    const next = checks.includes(step.id) ? checks.filter((id) => id !== step.id) : [...checks, step.id];
    setChecks(next);
    if (next.length === steps.length && !practiced) onPracticed();
  }
  async function listen(rate: 1 | 0.6) {
    setAudioBusy(true);
    setAudioError(null);
    try {
      await playReference({ text: word.word, normalUrl: word.audioNormalUrl, slowUrl: word.audioSlowUrl, rate });
    } catch (error) {
      console.error("No se pudo reproducir la referencia del entrenador de boca.", error);
      setAudioError("No pudimos reproducir el audio. Puedes seguir con el espejo e intentarlo de nuevo.");
    } finally {
      setAudioBusy(false);
    }
  }

  return (
    <div className="space-y-4" aria-label="Guía de movimientos de la boca">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Primero el movimiento, después la palabra</h2>
          <p className="mt-1 text-sm text-slate-600">Práctica sin puntos, sin micrófono y sin cámara. Usa un espejo si lo tienes.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {practiced ? "Guía practicada" : `${checks.length} de ${steps.length} ejercicios probados`}
        </span>
      </div>
      {focus && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Un movimiento que puede ayudarte: {focus.tip}</p>}

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Pasos de la guía de boca">
        {steps.map((s, i) => (
          <button key={s.id} type="button" aria-current={index === i ? "step" : undefined}
            onClick={() => selectStep(i)}
            className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${index === i ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-700 hover:border-indigo-300"}`}>
            {i + 1}. {s.title} {(practiced || checks.includes(s.id)) && <Check className="ml-1 inline size-4" aria-label="Probado" />}
          </button>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["front", "side"] as const).map((view) => (
              <figure key={view} className="min-w-0">
                <figcaption className="text-center text-xs font-semibold text-slate-600">
                  {view === "front" ? "De frente · tu espejo" : "De lado · dentro de la boca"}
                </figcaption>
                <MouthAnatomySVG view={view} motion={motion} contrast={contrast}
                  airflow={step.id !== "position" || contrast !== "none"} voiced={voiced} moving={playing && !reducedMotion}
                  highlight={contrast !== "none" ? "tongue" : step.id === "voicing" ? "throat" : step.id === "airflow" ? "air" : "tongue"} />
              </figure>
            ))}
          </div>
          <p className="text-center text-xs font-medium text-slate-600">
            {contrast === "dentalStop" ? "T / D: cierre breve del aire"
                : contrast === "labiodental" ? "F: trabaja el labio inferior, no la punta de la lengua"
                  : step.id === "voicing" ? (voiced ? "/ð/ · Con vibración en la garganta" : "/θ/ · Sin vibración durante la TH")
                  : "TH: contacto ligero de lengua y dientes"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" disabled={reducedMotion} onClick={() => {
              if (playing) setPlaying(false);
              else if (progress >= 1) replay();
              else setPlaying(true);
            }} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 disabled:opacity-50">
              {playing && !reducedMotion ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing && !reducedMotion ? "Pausar movimiento" : "Ver movimiento"}
            </button>
            <button type="button" onClick={() => reducedMotion ? seek(0) : replay()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-slate-300">
              <RotateCcw className="size-4" /> Desde el inicio
            </button>
          </div>
          <label className="mt-3 block text-xs font-medium text-slate-600">
            Explorar el movimiento paso a paso
            <input type="range" min="0" max="100" value={Math.round(progress * 100)}
              onChange={(e) => seek(Number(e.target.value) / 100)} className="mt-2 block w-full accent-indigo-600" />
          </label>
          {reducedMotion && <p className="mt-2 text-xs text-slate-500">Movimiento reducido: usa el control para explorar las posiciones sin reproducción automática.</p>}
          <p className="mt-2 text-xs text-slate-500">Esquema simplificado y ampliado para aprender. No reproduce todos los sonidos ni está sincronizado con el audio.</p>
        </div>

        <div className="space-y-3">
          {contrast !== "none" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-bold text-amber-950">Compara antes de practicar la TH</h3>
              <p className="mt-2 text-sm text-amber-900">
                {contrast === "labiodental"
                  ? "Ahora ves la F: el labio inferior toca los dientes superiores. Para TH, deja el labio libre y acerca la punta de la lengua."
                  : "Ahora ves el cierre de T / D: la lengua bloquea el aire. Para TH, el contacto es ligero y deja pasar un soplo continuo."}
              </p>
              <button type="button" onClick={() => { setContrast("none"); seek(1); }}
                className="mt-3 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Volver a la TH y practicar
              </button>
            </div>
          ) : (
          <>
          <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
          <p className="text-sm leading-relaxed text-slate-700">{step.instruction}</p>
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-sm font-bold text-indigo-900">Tu turno, sin grabar</p>
            <p className="mt-1 text-sm leading-relaxed text-indigo-950">{step.practice}</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={practiced || checks.includes(step.id)} disabled={practiced} onChange={toggleCheck} className="mt-1 size-4 shrink-0 accent-indigo-600" />
            {step.selfCheck}
          </label>
          <p className="text-xs text-slate-500">Marca lo que has probado, aunque aún no te salga. El micrófono no puede comprobar la posición de tu lengua.</p>
          </>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={index === 0} onClick={() => selectStep(index - 1)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">Anterior</button>
            {index < steps.length - 1 && <button type="button" onClick={() => selectStep(index + 1)}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Siguiente movimiento</button>}
          </div>
        </div>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-semibold text-slate-700">Compara las posiciones, no los acentos</legend>
        <div className="flex flex-wrap gap-2">
          {([
            ["none", "TH: lengua y dientes"],
            ["dentalStop", "T / D: aire bloqueado"],
            ["labiodental", "F: labio y dientes"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={contrast === value}
              onClick={() => { setIndex(1); setContrast(value); seek(1); }}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${contrast === value ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={audioBusy} onClick={() => void listen(1)}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">
          <Volume2 className="size-4" /> Escuchar {word.word} · 1.0x
        </button>
        <button type="button" disabled={audioBusy} onClick={() => void listen(0.6)}
          className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">Lento · 0.6x</button>
        <button type="button" onClick={onTryWord}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Probar la palabra cuando quiera <ArrowRight className="size-4" />
        </button>
      </div>
      {audioError && <p role="alert" className="text-sm text-rose-700">{audioError}</p>}
      <p role="status" className="text-sm text-emerald-800">
        {complete || practiced ? "¡Guía practicada! Has dedicado tiempo al movimiento. Esto no certifica tu pronunciación y no necesitas 80 puntos para continuar." : ""}
      </p>
    </div>
  );
}
