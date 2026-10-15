"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { SyllableChunk } from "@/lib/types";

export interface WaveformCanvasProps {
  /** 48 normalized native amplitude peaks (pre-computed by the seeder). */
  reference: number[];
  /** Phonetic chunks / syllables of the target word shown over their corresponding waveform region. */
  chunks?: SyllableChunk[];
  /** Display word for the instructional caption. */
  word?: string;
  /** Final, trimmed user envelope after an attempt. */
  userWaveform?: number[] | null;
  /** Live levels written by `useVoiceEvaluator` while recording (read every animation frame). */
  liveLevelsRef?: RefObject<Float32Array>;
  /** Current active bar index (0..47, or -1 before voice onset) while recording. */
  activeBarRef?: RefObject<number>;
  recording?: boolean;
  className?: string;
}

const NATIVE_COLOR = "rgba(79, 70, 229, 0.85)";
const USER_COLOR = "rgba(16, 185, 129, 0.9)";
const LIVE_COLOR = "rgba(244, 63, 94, 0.9)";
const PLAYHEAD_COLOR = "rgba(244, 63, 94, 0.45)";
const DIVIDER_COLOR = "rgba(99, 102, 241, 0.25)";

function draw(
  canvas: HTMLCanvasElement,
  reference: number[],
  user: ArrayLike<number> | null,
  userColor: string,
  chunkCount: number,
  activeBar = -1,
) {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const mid = height / 2;
  const bars = Math.max(reference.length, user?.length ?? 0, 1);
  const slot = width / bars;
  const barWidth = Math.max(1.5, slot * 0.62);

  // Subtle vertical dividers between syllable chunks so each "mountain" is clearly scoped.
  if (chunkCount > 1) {
    ctx.save();
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let c = 1; c < chunkCount; c++) {
      const x = Math.round((c * width) / chunkCount) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x, height - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(width, mid);
  ctx.stroke();

  const radius = barWidth / 2;
  const roundBar = (x: number, y: number, h: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, barWidth, h, radius);
    else ctx.rect(x, y, barWidth, h);
    ctx.fill();
  };

  // Native reference: top half. User attempt: bottom half (mirror) for easy visual comparison.
  ctx.fillStyle = NATIVE_COLOR;
  reference.forEach((v, i) => {
    const h = Math.max(2, v * (mid - 4));
    roundBar(i * slot + (slot - barWidth) / 2, mid - h - 1, h);
  });
  if (user) {
    ctx.fillStyle = userColor;
    for (let i = 0; i < user.length; i++) {
      const h = Math.max(user[i] > 0 ? 2 : 0, user[i] * (mid - 4));
      if (h > 0) roundBar(i * slot + (slot - barWidth) / 2, mid + 1, h);
    }
  }

  // Live playhead cursor once voice onset is detected.
  if (activeBar >= 0 && activeBar < bars) {
    const x = activeBar * slot + slot / 2;
    ctx.save();
    ctx.strokeStyle = PLAYHEAD_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.lineTo(x, height - 4);
    ctx.stroke();
    ctx.restore();
  }
}

/** Dual HTML5 canvas: native waveform (top) vs. live/final user waveform (bottom). */
export default function WaveformCanvas({
  reference,
  chunks,
  word,
  userWaveform,
  liveLevelsRef,
  activeBarRef,
  recording,
  className,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunkCount = chunks?.length ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (recording && liveLevelsRef) {
      let raf = 0;
      const loop = () => {
        draw(canvas, reference, liveLevelsRef.current, LIVE_COLOR, chunkCount, activeBarRef?.current ?? -1);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }

    const render = () => draw(canvas, reference, userWaveform ?? null, USER_COLOR, chunkCount, -1);
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [reference, userWaveform, liveLevelsRef, activeBarRef, recording, chunkCount]);

  return (
    <div className={className}>
      {chunks && chunks.length > 0 && (
        <div
          className="mb-1.5 grid gap-1 text-center"
          style={{ gridTemplateColumns: `repeat(${chunks.length}, minmax(0, 1fr))` }}
          aria-label="Bloques fonéticos de la palabra en la onda de voz"
        >
          {chunks.map((chunk, i) => (
            <div
              key={chunk.label}
              className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2 py-1 text-xs"
            >
              <span className="font-bold text-slate-800">
                {i + 1}. {chunk.label}
              </span>{" "}
              <span className="font-ipa text-indigo-700">{chunk.ipa}</span>
            </div>
          ))}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-36 w-full rounded-xl bg-slate-50 sm:h-40"
        role="img"
        aria-label="Comparación de la onda de voz nativa (arriba) con tu grabación (abajo)"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-indigo-600" /> Nativo (arriba)
        </span>
        <span className="text-center text-[11px] text-slate-400">
          {word ? `Toda la gráfica = 1 sola vez «${word}» (cada montaña es una sílaba/bloque)` : "Cada montaña representa un bloque de la palabra"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-full ${recording ? "bg-rose-500" : "bg-emerald-500"}`} />
          {recording ? "Grabando tu voz…" : "Tu voz (abajo)"}
        </span>
      </div>
    </div>
  );
}
