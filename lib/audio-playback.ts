"use client";

import { markHumanInteraction } from "./human-gate";

let currentAudio: HTMLAudioElement | null = null;

export function stopPlayback() {
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const us = voices.filter((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("en-us"));
  const preferred = /(Google US English|Samantha|Aria|Jenny|Guy|Natural)/i;
  return us.find((v) => preferred.test(v.name)) ?? us[0] ?? voices.find((v) => v.lang?.startsWith("en"));
}

/** Browser TTS fallback, used when no pre-generated Cloud Storage MP3 exists yet. */
export function speakText(text: string, rate = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("speechSynthesis unavailable"));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? resolve() : reject(e));
    window.speechSynthesis.speak(utterance);
  });
}

function playUrl(url: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Audio failed: ${url}`));
    currentAudio = audio;
    audio.play().catch(reject);
  });
}

/**
 * Plays native reference audio: the dedicated MP3 when available (slow MP3, or the normal MP3 slowed down),
 * otherwise the browser's English TTS voice at the requested rate.
 */
export async function playReference(opts: { text: string; normalUrl?: string; slowUrl?: string; rate: 1 | 0.6 }) {
  markHumanInteraction();
  stopPlayback();
  const { text, normalUrl, slowUrl, rate } = opts;
  try {
    if (rate !== 1 && slowUrl) return await playUrl(slowUrl, 1);
    if (normalUrl) return await playUrl(normalUrl, rate);
  } catch {
    // Fall through to TTS when the MP3 is missing or blocked.
  }
  await speakText(text, rate === 1 ? 0.95 : 0.6);
}
