"use client";

import { isVerifiedHuman } from "./human-gate";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

/** Sends a GA4 event only for verified humans (never for bots or before a real interaction). */
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !isVerifiedHuman() || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

const sentActiveLearner = new Set<string>();

/** "Active Learner" engagement event, fired once per word per page view after a real practice attempt. */
export function trackActiveLearner(slug: string, score: number) {
  if (sentActiveLearner.has(slug)) return;
  if (!isVerifiedHuman()) return;
  sentActiveLearner.add(slug);
  trackEvent("active_learner", { word: slug, score });
}
