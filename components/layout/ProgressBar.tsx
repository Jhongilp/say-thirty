"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useProgressStore } from "@/hooks/useProgressStore";
import { masteredCount } from "@/lib/progress";
import { CHALLENGE_NAME } from "@/lib/site";

/** Sticky top bar: "Reto Domina la TH: X de 10 palabras superadas 🔥" + daily streak. */
export default function ProgressBar({ slugs }: { slugs: string[] }) {
  const { progress, streak } = useProgressStore();
  const total = slugs.length;
  const done = masteredCount(progress, slugs);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="shrink-0 text-lg font-black tracking-tight text-indigo-700">
          TH<span className="text-slate-900">Master</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
            {CHALLENGE_NAME}: {done} de {total} palabras superadas 🔥
          </p>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label="Progreso del reto"
          >
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${streak > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}
          title="Racha diaria"
        >
          <Flame className="size-4" /> {streak} {streak === 1 ? "día" : "días"}
        </div>
      </div>
    </header>
  );
}
