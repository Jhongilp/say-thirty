import type { EvaluationResult } from "@/lib/evaluation";

function scoreColor(score: number) {
  if (score >= 80) return { ring: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 55) return { ring: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  return { ring: "#f43f5e", text: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
}

const ENGINE_LABEL: Record<EvaluationResult["engine"], string> = {
  dual: "Motor dual: reconocimiento de voz + análisis acústico",
  acoustic: "Análisis acústico de fricción (modo compatible iPhone / apps)",
  speech: "Reconocimiento de voz",
};

/** Circular 0–100 % score plus the phonetic-trap diagnosis and an actionable tip in Spanish. */
export default function FeedbackBadge({ result, word }: { result: EvaluationResult; word: string }) {
  const { score, headlineEs, tipEs, errorType, heard, engine, acoustic } = result;
  const colors = scoreColor(score);
  const circumference = 2 * Math.PI * 34;

  return (
    <div className={`animate-pop-in rounded-2xl border p-4 sm:p-5 ${colors.bg}`} aria-live="polite">
      {result.wordRecognized && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
          <p className="text-lg font-bold">¡Te entendimos! Dijiste «{word}».</p>
          <p className="mt-1 text-sm">Lograste comunicar la palabra. Ahora puedes seguir afinando el sonido.</p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-lg font-bold text-slate-900">
            {score}%<span className="sr-only">, estimación orientativa</span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs text-slate-500">Estimación orientativa · No es una certificación</p>
          <p className={`text-lg font-bold leading-tight ${colors.text}`}>{headlineEs}</p>
          {errorType && (
            <span className="mt-1 inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
              {errorType}
            </span>
          )}
          {heard && (
            <p className="mt-1 text-sm text-slate-600">
              Escuchamos: <strong className="font-semibold">«{heard}»</strong>
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-800">{tipEs}</p>
      <p className="mt-3 text-[11px] text-slate-500">
        {ENGINE_LABEL[engine]}
        {acoustic.speechDetected && ` · Fricción detectada: ${acoustic.frictionMs} ms · Duración: ${(acoustic.durationMs / 1000).toFixed(2)} s`}
      </p>
    </div>
  );
}
