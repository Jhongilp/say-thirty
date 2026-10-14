"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markHumanInteraction } from "@/lib/human-gate";
import { scoreShadowing, type ShadowingScore } from "@/lib/shadowing";

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionLike) | null;
}

export type ShadowingStatus = "idle" | "listening" | "done" | "error";

/** Phase 4: listens to a full sentence (continuous Web Speech API) and scores word coverage. */
export function useSentenceShadowing(sentence: string, targetWord: string, accepted: string[] = []) {
  const [status, setStatus] = useState<ShadowingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ShadowingScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const textRef = useRef("");
  const latest = useRef({ sentence, targetWord, accepted });

  useEffect(() => {
    latest.current = { sentence, targetWord, accepted };
  });

  const start = useCallback(() => {
    markHumanInteraction();
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Tu navegador no tiene reconocimiento de voz. Escucha la frase y repítela en voz alta.");
      setStatus("error");
      return;
    }
    recRef.current?.abort();
    textRef.current = "";
    setTranscript("");
    setScore(null);
    setError(null);

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += ` ${e.results[i][0]?.transcript ?? ""}`;
      textRef.current = text.trim();
      setTranscript(textRef.current);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Necesitamos permiso para usar el micrófono.");
      }
    };
    rec.onend = () => {
      recRef.current = null;
      const { sentence: s, targetWord: w, accepted: a } = latest.current;
      setScore(textRef.current ? scoreShadowing(s, textRef.current, w, a) : null);
      setStatus(textRef.current ? "done" : "error");
      if (!textRef.current) setError((prev) => prev ?? "No escuchamos la frase. Inténtalo otra vez, hablando con claridad.");
    };
    try {
      rec.start();
      recRef.current = rec;
      setStatus("listening");
      window.setTimeout(() => {
        if (recRef.current === rec) rec.stop();
      }, 12000);
    } catch {
      setError("No pudimos iniciar el reconocimiento de voz.");
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { status, transcript, score, error, start, stop };
}
