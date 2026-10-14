"use client";

import { useSyncExternalStore } from "react";
import { getGateServerSnapshot, getGateSnapshot, isVerifiedHuman, subscribeGate } from "@/lib/human-gate";

/** True once a real human interacted with the page and no bot signals were detected. */
export function useHumanGate(): boolean {
  const state = useSyncExternalStore(subscribeGate, getGateSnapshot, getGateServerSnapshot);
  return isVerifiedHuman(state);
}
