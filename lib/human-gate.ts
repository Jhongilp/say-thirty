"use client";

import { verifyAppCheck } from "./firebase-client";

/**
 * Proof-of-humanity gate for ads and analytics (AdSense IVT protection).
 * - `human`: a trusted, natural interaction happened (pointer/touch/key/wheel, or a trainer action).
 * - `bot`: automation signals were found (webdriver, headless UA, no audio input devices, failed App Check).
 */
export interface GateState {
  human: boolean;
  bot: boolean;
  checked: boolean;
}

const SERVER_STATE: GateState = { human: false, bot: false, checked: false };
let state: GateState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function setState(patch: Partial<GateState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

async function detectBot(): Promise<boolean> {
  const nav = window.navigator;
  if (nav.webdriver) return true;
  if (/HeadlessChrome|PhantomJS|Lighthouse|bot|crawler|spider/i.test(nav.userAgent)) return true;
  if (Array.isArray(nav.languages) && nav.languages.length === 0) return true;
  if (nav.mediaDevices?.enumerateDevices) {
    try {
      const devices = await nav.mediaDevices.enumerateDevices();
      if (!devices.some((d) => d.kind === "audioinput")) return true;
    } catch {
      return true;
    }
  }
  return (await verifyAppCheck()) === false;
}

const INTERACTION_EVENTS = ["pointerdown", "touchstart", "keydown", "wheel"] as const;

function onInteraction(e: Event) {
  if (!e.isTrusted) return;
  markHumanInteraction();
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, onInteraction, { passive: true, capture: true }));
  detectBot().then((bot) => setState({ bot, checked: true }));
}

export function markHumanInteraction() {
  if (state.human) return;
  INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, onInteraction, { capture: true }));
  setState({ human: true });
}

export function subscribeGate(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getGateSnapshot = () => state;
export const getGateServerSnapshot = () => SERVER_STATE;

export function isVerifiedHuman(s: GateState = state): boolean {
  return s.human && s.checked && !s.bot;
}
