import { PASS_SCORE } from "./evaluation";

export const PROGRESS_STORAGE_KEY = "th_master_progress";

export interface WordProgress {
  bestScore: number;
  mastered: boolean;
  attempts: number;
  chunksDone: string[];
  lastPracticedAt: string;
}

export interface ProgressState {
  version: 1;
  words: Record<string, WordProgress>;
  streak: { count: number; lastDate: string | null };
}

export function emptyProgress(): ProgressState {
  return { version: 1, words: {}, streak: { count: 0, lastDate: null } };
}

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(a: string, b: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return emptyProgress();
  try {
    const data = JSON.parse(raw) as Partial<ProgressState>;
    if (!data || typeof data !== "object" || typeof data.words !== "object" || data.words === null) return emptyProgress();
    const words: Record<string, WordProgress> = {};
    for (const [slug, w] of Object.entries(data.words)) {
      if (!w || typeof w !== "object") continue;
      words[slug] = {
        bestScore: Number.isFinite(w.bestScore) ? Math.max(0, Math.min(100, w.bestScore)) : 0,
        mastered: Boolean(w.mastered),
        attempts: Number.isFinite(w.attempts) ? w.attempts : 0,
        chunksDone: Array.isArray(w.chunksDone) ? w.chunksDone.filter((c) => typeof c === "string") : [],
        lastPracticedAt: typeof w.lastPracticedAt === "string" ? w.lastPracticedAt : "",
      };
    }
    const streak = data.streak;
    return {
      version: 1,
      words,
      streak: {
        count: Number.isFinite(streak?.count) ? (streak!.count as number) : 0,
        lastDate: typeof streak?.lastDate === "string" ? streak.lastDate : null,
      },
    };
  } catch {
    return emptyProgress();
  }
}

export function bumpStreak(streak: ProgressState["streak"], today: string): ProgressState["streak"] {
  if (!streak.lastDate) return { count: 1, lastDate: today };
  const gap = daysBetween(streak.lastDate, today);
  if (gap <= 0) return streak;
  if (gap === 1) return { count: streak.count + 1, lastDate: today };
  return { count: 1, lastDate: today };
}

/** Streak shown to the user: it survives until the end of the day after the last practice. */
export function currentStreak(state: ProgressState, today: string): number {
  if (!state.streak.lastDate) return 0;
  return daysBetween(state.streak.lastDate, today) <= 1 ? state.streak.count : 0;
}

function wordOrEmpty(state: ProgressState, slug: string): WordProgress {
  return state.words[slug] ?? { bestScore: 0, mastered: false, attempts: 0, chunksDone: [], lastPracticedAt: "" };
}

export function recordAttempt(state: ProgressState, slug: string, score: number, today: string): ProgressState {
  const prev = wordOrEmpty(state, slug);
  const bestScore = Math.max(prev.bestScore, Math.round(score));
  return {
    ...state,
    words: {
      ...state.words,
      [slug]: {
        ...prev,
        bestScore,
        mastered: prev.mastered || bestScore >= PASS_SCORE,
        attempts: prev.attempts + 1,
        lastPracticedAt: today,
      },
    },
    streak: bumpStreak(state.streak, today),
  };
}

export function recordChunk(state: ProgressState, slug: string, chunkLabel: string, today: string): ProgressState {
  const prev = wordOrEmpty(state, slug);
  if (prev.chunksDone.includes(chunkLabel)) return state;
  return {
    ...state,
    words: { ...state.words, [slug]: { ...prev, chunksDone: [...prev.chunksDone, chunkLabel], lastPracticedAt: today } },
    streak: bumpStreak(state.streak, today),
  };
}

export function masteredCount(state: ProgressState, slugs?: string[]): number {
  return Object.entries(state.words).filter(([slug, w]) => w.mastered && (!slugs || slugs.includes(slug))).length;
}
