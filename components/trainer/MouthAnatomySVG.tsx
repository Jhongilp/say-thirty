import type { PhonemeType } from "@/lib/types";

type Pose = "rest" | "interdental" | "dentalStop" | "retracted" | "velar";

interface PoseGeometry {
  dorsum: [number, number];
  blade: [number, number];
  tip: [number, number];
}

const POSES: Record<Pose, PoseGeometry> = {
  rest: { dorsum: [132, 110], blade: [92, 112], tip: [70, 117] },
  interdental: { dorsum: [130, 106], blade: [84, 104], tip: [47, 106] },
  dentalStop: { dorsum: [128, 101], blade: [86, 95], tip: [65, 95] },
  retracted: { dorsum: [142, 101], blade: [108, 92], tip: [93, 95] },
  velar: { dorsum: [172, 87], blade: [112, 108], tip: [71, 117] },
};

/** All poses share the same path commands so they can be morphed with SMIL `<animate>` (works in Safari). */
function tonguePath(pose: Pose): string {
  const { dorsum: [dx, dy], blade: [bx, by], tip: [tx, ty] } = POSES[pose];
  return [
    "M 192 176",
    `C 188 140, ${dx + 24} ${dy}, ${dx} ${dy}`,
    `C ${bx} ${by - 2}, ${tx + 10} ${ty - 7}, ${tx} ${ty}`,
    `C ${tx + 3} ${ty + 9}, 84 128, 104 133`,
    "C 140 140, 170 150, 192 176 Z",
  ].join(" ");
}

function sequenceFor(phonemeType: PhonemeType, word: string, mode: "english" | "spanish"): Pose[] {
  if (mode === "spanish") return ["dentalStop"];
  const w = word.toLowerCase();
  switch (phonemeType) {
    case "th-cluster":
      return w.startsWith("th") ? ["interdental", "interdental", "retracted", "retracted"] : ["velar", "velar", "interdental", "interdental"];
    case "ough-trap":
      return ["interdental", "interdental", "rest", "rest"];
    default:
      return ["interdental"];
  }
}

export interface MouthAnatomySVGProps {
  phonemeType: PhonemeType;
  word: string;
  /** `spanish` shows the native-habit error (tongue behind the teeth, airflow blocked). */
  mode?: "english" | "spanish";
  className?: string;
}

/** Sagittal (side-view) cross-section of the mouth showing tongue placement, airflow and voicing. */
export default function MouthAnatomySVG({ phonemeType, word, mode = "english", className }: MouthAnatomySVGProps) {
  const sequence = sequenceFor(phonemeType, word, mode);
  const voiced = phonemeType === "th-voiced";
  const blocked = mode === "spanish";
  const animated = sequence.length > 1;
  const morphValues = [...sequence, sequence[0]].map(tonguePath).join("; ");

  return (
    <svg
      viewBox="0 0 240 200"
      role="img"
      aria-label={
        blocked
          ? "Hábito del español: la lengua toca detrás de los dientes y bloquea el aire."
          : `Posición correcta para la TH ${voiced ? "sonora" : "sorda"}: la punta de la lengua asoma entre los dientes y el aire pasa de forma continua.`
      }
      className={className}
    >
      <defs>
        <linearGradient id="mouth-cavity" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="100%" stopColor="#fce7f3" />
        </linearGradient>
        <marker id="air-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={blocked ? "#ef4444" : "#0ea5e9"} />
        </marker>
      </defs>

      {/* Face profile, nasal cavity and throat */}
      <path
        d="M 60 20 C 40 30, 30 48, 22 62 L 34 70 C 36 76, 40 80, 44 84 C 36 88, 34 94, 40 99 C 34 104, 32 112, 40 122 C 38 132, 46 150, 70 160 C 100 172, 140 176, 168 184 L 168 200 M 210 200 L 210 96 C 210 60, 190 30, 150 20"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M 66 86 C 100 72, 150 66, 186 84 C 196 90, 202 98, 204 110 L 204 200 L 180 200 C 176 176, 120 150, 66 128 Z" fill="url(#mouth-cavity)" />

      {/* Hard and soft palate */}
      <path d="M 64 88 C 70 82, 78 80, 88 79 C 120 74, 160 72, 184 84 C 192 89, 196 96, 196 104" fill="none" stroke="#be185d" strokeWidth="3" strokeLinecap="round" />

      {/* Lips */}
      <path d="M 44 84 C 36 88, 34 94, 40 99 C 46 98, 52 94, 54 90 Z" fill="#fb7185" />
      <path d="M 40 112 C 34 116, 36 122, 42 124 C 50 124, 56 120, 58 114 Z" fill="#fb7185" />

      {/* Teeth */}
      <path d="M 54 86 L 64 86 L 63 102 C 60 104, 56 104, 53 102 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M 55 124 L 65 124 L 64 110 C 61 108, 57 108, 54 110 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Tongue */}
      <path d={tonguePath(sequence[0])} fill="#f472b6" stroke="#db2777" strokeWidth="1.5">
        {animated && <animate attributeName="d" dur="2.6s" repeatCount="indefinite" values={morphValues} calcMode="spline" keySplines={sequence.map(() => "0.4 0 0.2 1").join("; ")} />}
      </path>

      {/* Vocal folds + voicing vibration */}
      <g transform="translate(196 176)">
        <rect x="-10" y="-3" width="20" height="6" rx="3" fill="#e2e8f0" stroke="#64748b" />
        {voiced && (
          <path className="th-vibration" d="M -14 -10 l 4 -4 l 4 4 l 4 -4 l 4 4 l 4 -4 l 4 4 l 4 -4" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        )}
      </g>

      {/* Airflow */}
      {blocked ? (
        <>
          <path className="th-airflow" d="M 200 168 C 200 130, 180 100, 140 96 L 72 96" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#air-arrow)" />
          <g transform="translate(64 95)" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
            <line x1="-6" y1="-6" x2="6" y2="6" />
            <line x1="6" y1="-6" x2="-6" y2="6" />
          </g>
        </>
      ) : (
        <path className="th-airflow" d="M 200 168 C 200 128, 180 98, 136 98 C 100 98, 72 100, 56 104 L 14 106" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#air-arrow)" />
      )}

      {/* Labels */}
      <g fontSize="8" fill="#475569" fontFamily="system-ui, sans-serif">
        <text x="118" y="66">Paladar</text>
        <text x="128" y="150">Lengua</text>
        <text x="58" y="72">Dientes</text>
        <text x="234" y="196" textAnchor="end">{voiced ? "Cuerdas vocales: vibran" : "Cuerdas vocales: sin voz"}</text>
        {!blocked && <text x="2" y="98" fill="#0369a1">Aire</text>}
        {blocked && <text x="22" y="140" fill="#b91c1c">¡Aire bloqueado!</text>}
      </g>
    </svg>
  );
}
