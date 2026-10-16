import { useId } from "react";
import type { MouthContrast, MouthPose } from "@/lib/mouth-coach";

const POSES: Record<MouthPose, { tip: [number, number]; dorsum: [number, number]; front: number }> = {
  rest: { tip: [85, 123], dorsum: [141, 116], front: 0 },
  interdental: { tip: [54, 109], dorsum: [135, 115], front: 1 },
  dentalStop: { tip: [77, 98], dorsum: [138, 105], front: 0 },
  labiodental: { tip: [92, 127], dorsum: [142, 120], front: 0 },
  retracted: { tip: [108, 100], dorsum: [150, 109], front: 0 },
  velar: { tip: [91, 125], dorsum: [179, 91], front: 0 },
};

interface Props {
  view: "front" | "side";
  motion: { from: MouthPose; to: MouthPose; amount: number };
  contrast: MouthContrast;
  airflow: boolean;
  voiced: boolean;
  moving: boolean;
  highlight: "tongue" | "air" | "throat";
}

/** Both views share the same pose interpolation and playback clock. */
export default function MouthAnatomySVG({ view, motion, contrast, airflow, voiced, moving, highlight }: Props) {
  const id = useId().replace(/:/g, "");
  const from = POSES[contrast === "none" ? motion.from : contrast];
  const to = POSES[contrast === "none" ? motion.to : contrast];
  const mix = (a: number, b: number) => a + (b - a) * motion.amount;
  const tx = mix(from.tip[0], to.tip[0]);
  const ty = mix(from.tip[1], to.tip[1]);
  const dx = mix(from.dorsum[0], to.dorsum[0]);
  const dy = mix(from.dorsum[1], to.dorsum[1]);
  const front = mix(from.front, to.front);
  const blocked = contrast === "dentalStop";
  const lip = contrast === "labiodental";
  const color = contrast === "none" ? "#0284c7" : "#e11d48";
  const animationStyle = { animationPlayState: moving ? "running" : "paused" } as const;
  const title = view === "front" ? "Vista frontal: lo que ves en el espejo" : "Corte lateral: lo que ocurre dentro";
  const detail = blocked ? "La lengua cierra el paso del aire detrás de los dientes."
    : lip ? "El labio inferior toca los dientes superiores: posición de F, no de TH."
      : "La punta de la lengua se acerca al borde de los dientes superiores con contacto suave.";

  return (
    <svg viewBox="0 0 280 220" role="img" aria-labelledby={`${id}-title ${id}-desc`}
      className="block h-auto w-full" data-mouth-view={view}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{detail} Esquema didáctico, no una medición de tu boca.</desc>
      <defs>
        <linearGradient id={`${id}-tongue`} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#fda4af" /><stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0 0 L10 5 L0 10Z" fill={color} />
        </marker>
      </defs>
      {view === "front" ? (
        <>
          <path d="M35 70 Q140 20 245 70 L245 155 Q140 202 35 155Z" fill="#fff1f2" />
          <path d="M44 108 Q140 43 236 108 Q140 180 44 108Z" fill="#881337" />
          <path d="M44 108 Q80 55 140 70 Q200 55 236 108 Q190 87 140 89 Q90 87 44 108Z" fill="#fda4af" stroke="#be123c" strokeWidth="1.5" />
          <g fill="white" stroke="#cbd5e1" strokeWidth="1.5">
            {[78, 103, 128, 153, 178].map((x) => <rect key={x} x={x} y="87" width="25" height="24" rx="4" />)}
            {[83, 107, 131, 155, 179].map((x) => <rect key={x} x={x} y="126" width="23" height="19" rx="4" />)}
          </g>
          <path d={`M97 134 Q140 ${112 - front * 26} 183 134 Q174 ${142 + front * 12} 140 ${143 + front * 13} Q106 ${142 + front * 12} 97 134Z`}
            fill={`url(#${id}-tongue)`} stroke="#be185d" strokeWidth={highlight === "tongue" ? 3 : 1.5}
            opacity={0.25 + front * 0.75} />
          <path d={lip
            ? "M44 108 Q90 145 115 110 Q140 103 165 110 Q190 145 236 108 Q205 174 140 164 Q75 174 44 108Z"
            : "M44 108 Q85 149 140 149 Q195 149 236 108 Q210 176 140 168 Q70 176 44 108Z"}
            fill="#fb7185" stroke={lip ? "#e11d48" : "#be123c"} strokeWidth={lip ? 3 : 1.5} />
          {highlight === "tongue" && <ellipse cx="140" cy={lip ? 111 : 121} rx="46" ry="25" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />}
          {airflow && !blocked && <path d="M120 156 L114 187 M140 157 L140 192 M160 156 L166 187"
            className="th-airflow" style={animationStyle} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="5 5" markerEnd={`url(#${id}-arrow)`} />}
          {blocked && <text x="140" y="192" textAnchor="middle" fill="#be123c" fontSize="12">Aire bloqueado: T / D</text>}
          {lip && <text x="140" y="208" textAnchor="middle" fill="#be123c" fontSize="12">F: labio contra dientes</text>}
          <text x="140" y="36" textAnchor="middle" fill="#475569" fontSize="12">{contrast === "none" ? "Labios relajados · contacto suave" : "Posición de contraste, no TH"}</text>
        </>
      ) : (
        <>
          <path d="M83 26 Q58 38 43 72 L59 81 L52 103 L58 133 Q52 173 117 184 L196 205 M233 202 L232 92 Q225 43 176 26"
            fill="#fff1f2" stroke="#94a3b8" strokeWidth="2" />
          <path d="M78 94 Q160 64 205 94 Q222 111 217 188 L202 192 Q166 153 78 137Z" fill="#ffe4e6" />
          <path d="M78 94 Q152 64 197 86 Q214 94 212 108" fill="none" stroke="#9f1239" strokeWidth="3" />
          <path d="M55 92 Q43 97 52 105 L65 101 M55 121 Q44 129 58 135 L70 128" fill="#fb7185" stroke="#be123c" />
          <path d="M66 91 L78 91 L77 108 Q71 112 64 106Z M67 139 L79 139 L78 121 Q70 117 65 122Z"
            fill="white" stroke="#94a3b8" strokeWidth="1.5" />
          <path d={`M203 190 C194 153 ${dx + 25} ${dy} ${dx} ${dy} C110 ${dy - 7} ${tx + 9} ${ty - 7} ${tx} ${ty} C${tx + 3} ${ty + 10} 112 145 144 153 Q180 166 203 190Z`}
            fill={`url(#${id}-tongue)`} stroke="#be185d" strokeWidth="1.5" data-tongue-path="true" />
          {lip && <path d="M55 133 Q52 114 65 107" fill="none" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />}
          {highlight === "tongue" && <circle cx={lip ? 65 : tx} cy={lip ? 107 : ty} r="16" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />}
          {airflow && (
            <path d={blocked ? "M216 173 Q220 105 168 96 L86 96" : "M216 173 Q220 105 168 99 Q112 95 62 112 L22 114"}
              className="th-airflow" style={animationStyle} stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="5 5"
              markerEnd={`url(#${id}-arrow)`} />
          )}
          {blocked && <path d="M77 87 L87 101 M87 87 L77 101" stroke="#e11d48" strokeWidth="3" />}
          <text x="140" y="62" fill="#475569" fontSize="12">Paladar</text>
          <path d="M37 65 L69 90" stroke="#64748b" fill="none" />
          <text x="10" y="59" fill="#475569" fontSize="12">Dientes</text>
          <text x="120" y="174" fill="#9d174d" fontSize="12">Lengua</text>
        </>
      )}
      {highlight === "throat" && (
        <g transform="translate(218 185)">
          <circle r="19" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
          {voiced
            ? <path d="M-13 0 L-8 -7 L-3 7 L3 -7 L8 7 L13 0" className="th-vibration" style={animationStyle} fill="none" stroke="#b45309" strokeWidth="2" />
            : <path d="M-11 0 H11" stroke="#64748b" strokeWidth="2" />}
        </g>
      )}
    </svg>
  );
}
