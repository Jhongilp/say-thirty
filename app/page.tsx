import type { Metadata } from "next";
import { Ear, Mic, Puzzle, Repeat } from "lucide-react";
import WordRoadmap from "@/components/layout/WordRoadmap";
import { SITE, absoluteUrl } from "@/lib/site";
import { getWordNav } from "@/lib/words";

export const metadata: Metadata = {
  title: { absolute: "Domina la TH en Inglés: pronunciación con micrófono gratis | TH Master" },
  description:
    "Reto gratuito de 10 palabras para dominar la TH inglesa (thirty, though, weather, strength…). Graba tu voz y recibe corrección instantánea en español.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { icon: Ear, title: "1. Diagnóstico", text: "Mira en un corte anatómico dónde va tu lengua y escucha el audio nativo normal y a cámara lenta." },
  { icon: Mic, title: "2. Espejo acústico", text: "Graba tu voz: comparamos tu onda con la nativa y detectamos si suena a «dirty» en vez de «thirty»." },
  { icon: Puzzle, title: "3. Sílabas", text: "Divide las palabras difíciles en bloques y practica cada uno hasta desbloquear la insignia." },
  { icon: Repeat, title: "4. Contexto real", text: "Repite una frase completa a velocidad natural para fijar la memoria muscular." },
];

export default async function HomePage() {
  const words = await getWordNav();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    inLanguage: "es",
    description: SITE.description,
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }} />
      <section className="text-center">
        <p className="mx-auto inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Gratis · Sin registro · Funciona en tu móvil
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
          Domina la <span className="text-indigo-600">TH</span> en Inglés
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Deja de decir «dirty» cuando quieres decir «thirty». Entrena tu lengua con tu micrófono y recibe una corrección anatómica
          instantánea, pensada para hispanohablantes.
        </p>
      </section>

      <section aria-labelledby="roadmap-title" className="mt-10">
        <h2 id="roadmap-title" className="sr-only">
          Las 10 palabras del reto
        </h2>
        <div className="text-center">
          <WordRoadmap words={words} />
        </div>
      </section>

      <section aria-labelledby="method-title" className="mt-16">
        <h2 id="method-title" className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          El método de 4 fases
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon className="size-7 text-indigo-600" />
              <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prose-th mx-auto mt-16 max-w-3xl">
        <h2>¿Por qué la TH es tan difícil para los hispanohablantes?</h2>
        <p>
          El inglés tiene dos sonidos escritos con «th»: la <strong>TH sorda /θ/</strong> de <em>thirty</em>, <em>think</em> o{" "}
          <em>bath</em>, y la <strong>TH sonora /ð/</strong> de <em>though</em>, <em>the</em> o <em>weather</em>. Ninguno de los dos existe
          en el español de América, así que el cerebro los reemplaza automáticamente por los sonidos más parecidos que conoce: la «T», la
          «D», la «S» o incluso la «F».
        </p>
        <p>
          La diferencia clave es el <strong>flujo de aire</strong>. La «T» y la «D» españolas son oclusivas: la lengua se apoya detrás de los
          dientes y bloquea el aire durante un instante. Las dos TH inglesas son fricativas: la punta de la lengua asoma entre los dientes y
          el aire pasa rozando de forma continua. Si vives en España tienes ventaja, porque la «Z» de «zapato» es exactamente la /θ/
          inglesa.
        </p>
        <h3>¿Cómo evalúa TH Master tu pronunciación?</h3>
        <p>
          Todo el análisis ocurre en tu navegador. Usamos dos motores a la vez: el reconocimiento de voz del navegador, que nos dice si tu
          «thirty» se entendió como «dirty» o «tirty», y un analizador acústico que mide la energía de alta frecuencia (4.000–8.000 Hz)
          característica del soplo de la TH. El segundo motor funciona incluso en iPhone o dentro de Instagram y TikTok, donde el
          reconocimiento de voz suele fallar.
        </p>
        <h3>¿Necesito registrarme?</h3>
        <p>
          No. Tu progreso, tu mejor puntuación y tu racha diaria se guardan únicamente en tu dispositivo. Tu voz nunca se graba ni se sube a
          nuestros servidores.
        </p>
      </section>
    </main>
  );
}
