"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  PROGRESS_STORAGE_KEY,
  currentStreak,
  emptyProgress,
  localDateKey,
  parseProgress,
  recordAttempt as applyAttempt,
  recordChunk as applyChunk,
  recordGuidePractice as applyGuidePractice,
  type ProgressState,
} from "@/lib/progress";

const SERVER_SNAPSHOT = emptyProgress();
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: ProgressState = SERVER_SNAPSHOT;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ProgressState {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseProgress(raw);
  }
  return cachedState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROGRESS_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(update: (state: ProgressState) => ProgressState) {
  const next = update(getSnapshot());
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): keep the in-memory state for this session.
    cachedRaw = JSON.stringify(next);
    cachedState = next;
  }
  listeners.forEach((l) => l());
}

/** LocalStorage-backed gamification state (`th_master_progress`), shared across components and tabs. */
export function useProgressStore() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const recordAttempt = useCallback((slug: string, score: number) => {
    write((s) => applyAttempt(s, slug, score, localDateKey()));
  }, []);

  const recordChunk = useCallback((slug: string, chunkLabel: string) => {
    write((s) => applyChunk(s, slug, chunkLabel, localDateKey()));
  }, []);

  const reset = useCallback(() => write(() => emptyProgress()), []);
  const recordGuidePractice = useCallback((slug: string) => {
    write((s) => applyGuidePractice(s, slug, localDateKey()));
  }, []);

  return {
    progress,
    streak: currentStreak(progress, localDateKey()),
    isMastered: (slug: string) => Boolean(progress.words[slug]?.mastered),
    recordAttempt,
    recordChunk,
    recordGuidePractice,
    reset,
  };
}
