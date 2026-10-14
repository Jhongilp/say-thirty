"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface WaveformCanvasProps {
  /** 48 normalized native amplitude peaks (pre-computed by the seeder). */
  reference: number[];
  /** Final, trimmed user envelope after an attempt. */
  userWaveform?: number[] | null;
  /** Live levels written by `useVoiceEvaluator` while recording (read every animation frame). */
  liveLevelsRef?: RefObject<Float32Array>;
  recording?: boolean;
  className?: string;
}

const NATIVE_COLOR = "rgba(79, 70, 229, 0.85)";
const USER_COLOR = "rgba(16, 185, 129, 0.9)";
const LIVE_COLOR = "rgba(244, 63, 94, 0.9)";

function draw(canvas: HTMLCanvasElement, reference: number[], user: ArrayLike<number> | null, userColor: string) {
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
}

/** Dual HTML5 canvas: native waveform (top) vs. live/final user waveform (bottom). */
export default function WaveformCanvas({ reference, userWaveform, liveLevelsRef, recording, className }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (recording && liveLevelsRef) {
      let raf = 0;
      const loop = () => {
        draw(canvas, reference, liveLevelsRef.current, LIVE_COLOR);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }

    const render = () => draw(canvas, reference, userWaveform ?? null, USER_COLOR);
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [reference, userWaveform, liveLevelsRef, recording]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="h-36 w-full rounded-xl bg-slate-50 sm:h-40"
        role="img"
        aria-label="Comparación de la onda de voz nativa (arriba) con tu grabación (abajo)"
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-indigo-600" /> Nativo
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-full ${recording ? "bg-rose-500" : "bg-emerald-500"}`} />
          {recording ? "Grabando…" : "Tu voz"}
        </span>
      </div>
    </div>
  );
}
