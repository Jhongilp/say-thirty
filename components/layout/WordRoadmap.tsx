"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Trophy } from "lucide-react";
import { useProgressStore } from "@/hooks/useProgressStore";
import { wordPath } from "@/lib/site";
import type { WordNavItem } from "@/lib/words";

/** Landing-page roadmap of the 10 challenge words with per-word progress from localStorage. */
export default function WordRoadmap({ words }: { words: WordNavItem[] }) {
  const { progress } = useProgressStore();
  const nextUp = words.find((w) => !progress.words[w.slug]?.mastered) ?? null;

  return (
    <div>
      {nextUp ? (
        <Link
          href={wordPath(nextUp.slug)}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          {nextUp.orderIndex === 1 && !progress.words[nextUp.slug] ? "Empezar el reto" : "Continuar"}: {nextUp.word}
          <ArrowRight className="size-5" />
        </Link>
      ) : (
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 font-bold text-emerald-800">
          <Trophy className="size-5" /> ¡Completaste el reto! Repasa cuando quieras.
        </p>
      )}

      <ol className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {words.map((w) => {
          const p = progress.words[w.slug];
          const isNext = nextUp?.slug === w.slug;
          return (
            <li key={w.slug}>
              <Link
                href={wordPath(w.slug)}
                className={`flex items-center gap-4 rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                  isNext ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ${
                    p?.mastered ? "bg-emerald-500 text-white" : isNext ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p?.mastered ? <CircleCheck className="size-5" aria-label="Dominada" /> : w.orderIndex}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-slate-900">{w.word}</span>
                  <span className="block truncate text-sm text-slate-500">
                    <span className="font-ipa text-indigo-700">{w.ipa}</span> · {w.translationEs}
                  </span>
                </span>
                <span className="text-right text-xs text-slate-500">
                  {p ? <strong className="block text-base text-slate-800">{p.bestScore}%</strong> : null}
                  {w.difficulty}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
