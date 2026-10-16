import { getThPositions, type EvaluationResult } from "./evaluation";
import type { WordDocument } from "./types";

export type CoachStep = "position" | "airflow" | "voicing" | "join";
export type MouthPose = "rest" | "interdental" | "dentalStop" | "labiodental" | "retracted" | "velar";
export type MouthContrast = "none" | "dentalStop" | "labiodental";
export interface CoachFocus {
  step: CoachStep;
  contrast: MouthContrast;
  tip: string;
}

export interface MouthLessonStep {
  id: CoachStep;
  title: string;
  instruction: string;
  practice: string;
  selfCheck: string;
}

export function usesVoicedTh(word: Pick<WordDocument, "ipa" | "phonemeType">): boolean {
  return word.ipa.includes("ð") || word.phonemeType === "th-voiced";
}

export function getMouthLesson(word: WordDocument): MouthLessonStep[] {
  const voiced = usesVoicedTh(word);
  const positions = getThPositions(word.word);
  const thChunk = word.chunks.find((c) => /[θð]/.test(c.ipa));
  const bridge = thChunk && thChunk.label.replace(/-/g, "").toLowerCase() !== "th" ? `«${thChunk.label}»` : `«${word.word}» lentamente`;
  const joining = positions.includes("initial")
    ? `Desde la TH, pasa sin pausa al resto de ${bridge}. Después di «${word.word}» una sola vez.`
    : positions.includes("final")
      ? `Di el inicio de «${word.word}» y lleva la punta de la lengua hacia los dientes para terminar con TH, sin añadir una vocal.`
      : `En «${word.word}», mantén la voz entre las vocales: acerca la lengua a los dientes para la TH y retírala sin un golpe.`;
  return [
    {
      id: "position", title: "Coloca la lengua",
      instruction: "Abre un poco la boca. Asoma apenas la punta de la lengua entre los dientes; tócala suavemente con el borde de los dientes superiores. No la muerdas.",
      practice: "Mírate en un espejo y copia la vista frontal. Mantén los labios relajados.",
      selfCheck: "He probado la posición en el espejo, sin apretar.",
    },
    {
      id: "airflow", title: "Deja pasar aire",
      instruction: "Con la lengua en esa posición, deja salir aire suave y continuo. No cierres el paso ni soples con fuerza.",
      practice: "Prueba el soplo durante un segundo. Acerca la mano a la boca para notar el aire; no necesitas decir la palabra todavía.",
      selfCheck: "He probado mantener un soplo suave, sin un golpe inicial.",
    },
    {
      id: "voicing", title: voiced ? "Añade vibración" : "Empieza sin voz",
      instruction: voiced
        ? "Mantén el aire y añade voz para /ð/. Toca suavemente tu garganta: debe vibrar. Recuerda la «d» suave de «cada», no una D golpeada."
        : "Para /θ/, deja salir solo aire. Toca suavemente tu garganta: durante la TH no debe vibrar, a diferencia de las vocales.",
      practice: voiced ? "Alterna un soplo sin voz y otro con voz. La lengua no necesita golpear los dientes." : "Alterna la TH sin voz con una vocal con voz para notar la diferencia.",
      selfCheck: voiced ? "He comparado el sonido con y sin vibración." : "He comparado la TH sin voz con una vocal con voz.",
    },
    {
      id: "join", title: "Une el movimiento",
      instruction: joining,
      practice: `${word.anatomicalTipEs} Escucha la palabra completa y repítela sin buscar una puntuación.`,
      selfCheck: `He practicado «${word.word}» completa, a mi ritmo.`,
    },
  ];
}

/** Schematic TH-to-neighbour transitions, not a phoneme-timed model of the complete word. */
export function getMouthMotion(word: WordDocument, step: CoachStep, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  let from: MouthPose = "interdental";
  let to: MouthPose = "interdental";
  let amount = 0;
  if (step === "position") {
    from = "rest";
    amount = Math.min(1, p * 2);
  } else if (step === "join") {
    const positions = getThPositions(word.word);
    const neighbour: MouthPose = word.word.toLowerCase().startsWith("thr") || word.word.toLowerCase().startsWith("thir")
      ? "retracted" : "rest";
    if (positions.includes("initial")) {
      to = neighbour;
      amount = Math.max(0, (p - 0.4) / 0.6);
    } else if (positions.includes("final")) {
      from = word.ipa.includes("ŋ") ? "velar" : "rest";
      amount = Math.min(1, p / 0.6);
    } else {
      from = "rest";
      amount = p < 0.5 ? p * 2 : (1 - p) * 2;
    }
  }
  return { from, to, amount };
}

export function getCoachFocus(result: EvaluationResult): CoachFocus | null {
  if (!result.acoustic.speechDetected && result.speech.kind === "none") return null;
  const error = result.speech.trap?.errorType ?? "";
  if (error.includes("/f/")) {
    return { step: "position", contrast: "labiodental", tip: "Compara lengua y labio: para TH, el labio inferior queda libre." };
  }
  if (/\/[dt]\//.test(error) || result.acoustic.issues.some((i) => i === "plosive" || i === "closure")) {
    return { step: "airflow", contrast: "dentalStop", tip: "Practica solo el paso del aire: suave y continuo, sin bloquearlo." };
  }
  if (result.acoustic.issues.includes("no-friction")) {
    return { step: "airflow", contrast: "none", tip: "Vuelve al soplo suave antes de repetir la palabra completa." };
  }
  return { step: "join", contrast: "none", tip: "Escucha, une el movimiento lentamente y vuelve a intentarlo cuando quieras." };
}
