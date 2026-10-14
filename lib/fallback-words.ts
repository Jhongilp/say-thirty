import type { WordDocument } from "./types";
import { WAVEFORM_BARS } from "./types";

/**
 * Builds a smooth 48-bar amplitude envelope from phoneme segments `[amplitude, relativeLength]`.
 * Used only for the offline dataset; `npm run seed` replaces it with peaks computed from real TTS audio.
 */
function wave(segments: Array<[number, number]>): number[] {
  const total = segments.reduce((s, [, len]) => s + len, 0);
  const raw: number[] = [];
  for (const [amp, len] of segments) {
    const count = Math.max(1, Math.round((len / total) * WAVEFORM_BARS));
    for (let i = 0; i < count; i++) {
      const shape = Math.sin(((i + 0.5) / count) * Math.PI) * 0.35 + 0.65;
      raw.push(amp * shape);
    }
  }
  while (raw.length < WAVEFORM_BARS) raw.push(raw[raw.length - 1] * 0.6);
  raw.length = WAVEFORM_BARS;
  const smooth = raw.map((v, i) => (raw[i - 1] ?? v) * 0.25 + v * 0.5 + (raw[i + 1] ?? v) * 0.25);
  const max = Math.max(...smooth);
  return smooth.map((v, i) => Math.round(Math.min(1, (v / max) * (0.94 + 0.06 * Math.cos(i * 1.7))) * 1000) / 1000);
}

const UNVOICED_BAND: [number, number] = [4000, 8000];
const VOICED_BAND: [number, number] = [3000, 7000];

const TIP_THETA =
  "Saca ligeramente la punta de la lengua entre los dientes superiores e inferiores y sopla aire continuo sin voz, como la «Z» de España en «zapato».";
const TIP_ETH =
  "Coloca la punta de la lengua entre los dientes y haz vibrar la voz mientras dejas pasar el aire: es una «D» muy suave y continua, como en «cada».";

export const FALLBACK_WORDS: WordDocument[] = [
  {
    slug: "thirty",
    word: "Thirty",
    translationEs: "Treinta (30)",
    ipa: "/ˈθɜːrti/",
    phoneticRespellingEs: "ZÉR-ti (con la lengua entre los dientes)",
    difficulty: "Básico",
    phonemeType: "th-unvoiced",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs: TIP_THETA,
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.14, 5], [1, 17], [0.22, 4], [0.72, 12], [0.18, 3]]),
    chunks: [
      { label: "Thir-", ipa: "/ˈθɜːr/", hintEs: "Lengua entre los dientes + sopla + sonido «er» con la lengua recogida." },
      { label: "-ty", ipa: "/ti/", hintEs: "Una «t» suave (en EE. UU. casi una «r» rápida) y una «i» corta." },
    ],
    commonMispronunciations: [
      {
        heardWord: "dirty",
        errorType: "Oclusión dental (/d/)",
        correctionTipEs:
          "Usaste una «D» dental golpeando los dientes. Saca ligeramente la punta de la lengua y deja pasar aire continuo.",
      },
      {
        heardWord: "tirty",
        errorType: "Oclusión dental (/t/)",
        correctionTipEs:
          "Sonó como una «T» seca en español. No bloquees el aire; haz un siseo suave entre los dientes.",
      },
      {
        heardWord: "thirteen",
        errorType: "Acento en la sílaba equivocada",
        correctionTipEs:
          "Sonó a «thirteen» (13). En «thirty» el acento va en la PRIMERA sílaba: «THIR-ty», y la segunda es corta.",
      },
      {
        heardWord: "forty",
        errorType: "Sustitución labiodental (/f/)",
        correctionTipEs: "Usaste los labios como en la «F». Los labios quedan relajados: es la lengua la que toca los dientes.",
      },
    ],
    acceptedTranscripts: ["30", "thirty"],
    shadowingSentence: {
      english: "I have thirty things to think about on Thursday.",
      spanish: "Tengo treinta cosas en qué pensar el jueves.",
      ipa: "/aɪ hæv ˈθɜːrti θɪŋz tə θɪŋk əˈbaʊt ɑːn ˈθɜːrzdeɪ/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Thirty» (30) en inglés: guía con audio y micrófono",
      metaDescription:
        "Aprende a pronunciar «thirty» /ˈθɜːrti/ sin que suene a «dirty». Escucha el audio nativo, graba tu voz y recibe corrección instantánea gratis.",
      h1: "Cómo pronunciar «Thirty» en inglés",
      article: {
        whyIsItHardEs:
          "«Thirty» es una de las palabras que más delata a un hispanohablante. El problema empieza en la primera letra: la TH sorda /θ/ no existe en el español de América, así que el cerebro la sustituye por el sonido más cercano que conoce, normalmente una «T» o una «D» dental. El resultado es «tirty» o, peor aún, «dirty» (sucio), algo muy incómodo en una reunión de trabajo cuando hablas de precios o fechas. La /θ/ es una consonante fricativa: el aire no se detiene nunca, sino que pasa rozando entre la punta de la lengua y el borde de los dientes superiores. En español, la «T» y la «D» son oclusivas: la lengua se pega detrás de los dientes y bloquea el aire por un instante. Ese bloqueo es justamente lo que hay que eliminar. Además, la vocal /ɜːr/ con «R» inglesa no existe en español, y el acento recae siempre en la primera sílaba. Si vives en España, tienes ventaja: la «Z» de «zapato» es exactamente el mismo sonido que la TH de «thirty».",
        comparisonTitleEs: "Diferencia entre Thirty (30) y Thirteen (13)",
        comparisonBodyEs:
          "Ambas empiezan con la misma /θ/, pero se distinguen por el acento y la vocal final. «Thirty» se dice «THIR-ty», con fuerza en la primera sílaba y una «i» corta al final. «Thirteen» se dice «thir-TEEN», con el acento en la segunda sílaba y una «ii» larga seguida de «n». En EE. UU., la «t» de «thirty» suele sonar como una «r» suave y rápida («thir-dy»), mientras que la de «thirteen» siempre es una «t» clara porque inicia la sílaba tónica.",
        faqs: [
          {
            question: "¿Cómo se pronuncia «thirty» en inglés americano?",
            answer:
              "Se pronuncia /ˈθɜːrti/: pon la lengua entre los dientes y sopla para la TH, di «er» con la lengua recogida y termina con una «ti» corta. El acento va en la primera sílaba.",
          },
          {
            question: "¿Por qué cuando digo «thirty» me entienden «dirty»?",
            answer:
              "Porque usas una «D» oclusiva en lugar de la fricativa /θ/. Si tu lengua golpea detrás de los dientes, el aire se corta y suena a «dirty». Deja la lengua entre los dientes y mantén el aire fluyendo.",
          },
          {
            question: "¿La TH de «thirty» suena como la Z de España?",
            answer:
              "Sí. La /θ/ de «thirty» es el mismo sonido que la «Z» o la «C» suave del español peninsular («zapato», «cielo»). Si no eres de España, imita ese sonido como referencia.",
          },
        ],
      },
    },
    orderIndex: 1,
  },
  {
    slug: "thirteen",
    word: "Thirteen",
    translationEs: "Trece (13)",
    ipa: "/ˌθɜːrˈtiːn/",
    phoneticRespellingEs: "zer-TÍIN (lengua entre dientes, acento al final)",
    difficulty: "Básico",
    phonemeType: "th-unvoiced",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs: TIP_THETA,
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.14, 5], [0.72, 12], [0.2, 4], [1, 18], [0.45, 5]]),
    chunks: [
      { label: "Thir-", ipa: "/ˌθɜːr/", hintEs: "Lengua entre los dientes, soplo suave y «er» corto (sílaba débil)." },
      { label: "-teen", ipa: "/ˈtiːn/", hintEs: "«T» clara con aire + «ii» larga + «n». Aquí va la fuerza." },
    ],
    commonMispronunciations: [
      {
        heardWord: "thirty",
        errorType: "Acento en la sílaba equivocada",
        correctionTipEs:
          "Sonó a «thirty» (30). Carga la fuerza en la segunda sílaba y alarga la vocal: «thir-TEEEN», terminando en «n».",
      },
      {
        heardWord: "dirteen",
        errorType: "Oclusión dental (/d/)",
        correctionTipEs: "Golpeaste con una «D». Empieza con la lengua entre los dientes y deja salir un soplo continuo antes de la vocal.",
      },
      {
        heardWord: "tirteen",
        errorType: "Oclusión dental (/t/)",
        correctionTipEs: "Sonó a una «T» española. No apoyes la lengua detrás de los dientes: asómala entre ellos y sopla.",
      },
      {
        heardWord: "fourteen",
        errorType: "Sustitución labiodental (/f/)",
        correctionTipEs: "Usaste el labio inferior como en la «F». Relaja los labios y usa solo la punta de la lengua contra los dientes.",
      },
    ],
    acceptedTranscripts: ["13", "thirteen"],
    shadowingSentence: {
      english: "Thirteen thin thieves thought about the theater.",
      spanish: "Trece ladrones delgados pensaron en el teatro.",
      ipa: "/ˌθɜːrˈtiːn θɪn θiːvz θɔːt əˈbaʊt ðə ˈθiːətər/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Thirteen» (13) en inglés sin confundirlo con 30",
      metaDescription:
        "Pronuncia «thirteen» /ˌθɜːrˈtiːn/ correctamente: TH con la lengua entre los dientes y acento en «-teen». Practica con tu micrófono gratis.",
      h1: "Cómo pronunciar «Thirteen» en inglés",
      article: {
        whyIsItHardEs:
          "«Thirteen» combina dos retos para los hispanohablantes. El primero es la TH sorda /θ/, un sonido fricativo que no existe en el español latinoamericano y que solemos reemplazar por «T» o «D», produciendo «tirteen» o «dirteen». El segundo reto es el acento: en inglés, los números del 13 al 19 llevan la fuerza en la terminación «-teen», mientras que las decenas (30, 40, 50) la llevan en la primera sílaba. Si no marcas bien esa diferencia, tu interlocutor no sabrá si dijiste 13 o 30, un error costoso al dar precios, horarios o cantidades. La vocal de «-teen» es una /iː/ larga, más tensa y prolongada que la «i» española, y termina con una «n» clara. Para lograrlo, prepara la lengua entre los dientes, sopla un instante sin voz, di una sílaba débil «thir» y luego empuja la voz hacia «TEEN». Si lo dices en voz alta varias veces seguidas, notarás que el ritmo es parecido a una pregunta corta.",
        comparisonTitleEs: "Thirteen (13) vs. Thirty (30): el acento lo cambia todo",
        comparisonBodyEs:
          "La TH inicial es idéntica en ambos números. La diferencia está en el acento y la duración: «thir-TEEN» tiene la sílaba fuerte al final, con una «ii» larga y la «n» final. «THIR-ty» tiene la fuerza al inicio y termina con una «i» breve. Un truco: al decir «thirteen», sube ligeramente el tono en «teen»; al decir «thirty», deja caer el tono después de «thir».",
        faqs: [
          {
            question: "¿Dónde va el acento en «thirteen»?",
            answer:
              "En la segunda sílaba: «thir-TEEN». En frases rápidas el acento puede moverse al inicio («THIRteen people»), pero aislado siempre va al final.",
          },
          {
            question: "¿Cómo diferencio «thirteen» de «thirty» al hablar?",
            answer:
              "Alarga y acentúa «-teen» y pronuncia la «n» final en «thirteen». En «thirty» acentúa la primera sílaba y termina con una «i» corta.",
          },
          {
            question: "¿La TH de «thirteen» es sorda o sonora?",
            answer: "Es sorda (/θ/): no vibran las cuerdas vocales. Solo sale aire entre la lengua y los dientes.",
          },
        ],
      },
    },
    orderIndex: 2,
  },
  {
    slug: "through",
    word: "Through",
    translationEs: "A través de",
    ipa: "/θruː/",
    phoneticRespellingEs: "ZRÚU (lengua entre dientes y R inglesa)",
    difficulty: "Intermedio",
    phonemeType: "th-cluster",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs:
      "Empieza con la punta de la lengua entre los dientes soplando aire (/θ/) y, sin cortar el aire, retírala hacia atrás para la «R» inglesa sin tocar el paladar. Termina redondeando los labios en una «uu» larga.",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.14, 6], [0.5, 6], [1, 20], [0.4, 6]]),
    chunks: [
      { label: "Th-", ipa: "/θ/", hintEs: "Solo el soplo: lengua entre los dientes, sin voz." },
      { label: "-r-", ipa: "/r/", hintEs: "Retira la lengua hacia atrás sin tocar el paladar (nada de «rr» vibrante)." },
      { label: "-ough", ipa: "/uː/", hintEs: "«Uu» larga con los labios redondeados. La «gh» es muda." },
    ],
    commonMispronunciations: [
      {
        heardWord: "true",
        errorType: "Oclusión dental (/t/)",
        correctionTipEs:
          "Sonó a «true» (verdadero). No golpees con la lengua detrás de los dientes: empieza con un soplo entre los dientes antes de la «R».",
      },
      {
        heardWord: "drew",
        errorType: "Oclusión dental sonora (/d/)",
        correctionTipEs: "Sonó a «drew». La TH de «through» no tiene voz: sopla sin vibrar las cuerdas vocales y sin golpe de lengua.",
      },
      {
        heardWord: "trough",
        errorType: "Vocal incorrecta + oclusión",
        correctionTipEs:
          "Leíste la «ough» como «of». En «through» suena como una «uu» larga, y la TH es un soplo, no una «T».",
      },
    ],
    acceptedTranscripts: ["through", "threw", "thru"],
    shadowingSentence: {
      english: "We walked through the forest three times on Thursday.",
      spanish: "Caminamos a través del bosque tres veces el jueves.",
      ipa: "/wi wɔːkt θruː ðə ˈfɔːrɪst θriː taɪmz ɑːn ˈθɜːrzdeɪ/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Through» en inglés (y no decir «true»)",
      metaDescription:
        "Guía para pronunciar «through» /θruː/: TH + R inglesa sin cortar el aire. Escucha audio nativo lento y evalúa tu pronunciación gratis.",
      h1: "Cómo pronunciar «Through» en inglés",
      article: {
        whyIsItHardEs:
          "«Through» es una trampa doble para los hispanohablantes. Primero, la ortografía engaña: siete letras para solo tres sonidos, /θ/, /r/ y /uː/. La terminación «-ough» es famosa por sonar distinto en cada palabra (though, thought, tough, through), y aquí suena como una «uu» larga, con la «gh» completamente muda. Segundo, empieza con un grupo consonántico, /θr/, que no existe en español. Nuestra tendencia es convertirlo en «tr» o «dr», que sí existen («tren», «drama»), y el resultado es «true» (verdadero) o «drew» (dibujó). Para evitarlo hay que mantener el aire fluyendo: la lengua empieza entre los dientes soplando y luego se desliza hacia atrás, curvándose sin tocar el paladar para la «R» inglesa. No hay ningún golpe ni vibración de la «rr» española. Finalmente, redondea los labios como si fueras a silbar y alarga la vocal. Practicar primero «th» sola, luego «thr» y finalmente la palabra completa es la forma más rápida de automatizar el movimiento.",
        comparisonTitleEs: "Through vs. True vs. Threw",
        comparisonBodyEs:
          "«Through» /θruː/ y «threw» /θruː/ son homófonos: suenan idénticos y ambos empiezan con soplo entre los dientes. «True» /truː/ empieza con una «T» oclusiva: la lengua se pega a los alvéolos y bloquea el aire. Si tu «through» suena a «true», es porque la lengua está tocando detrás de los dientes en lugar de asomar entre ellos.",
        faqs: [
          {
            question: "¿Se pronuncia la «gh» en «through»?",
            answer: "No. La «gh» es muda. «Through» se pronuncia /θruː/, con solo tres sonidos: TH, R y una U larga.",
          },
          {
            question: "¿«Through» y «threw» se pronuncian igual?",
            answer: "Sí, son homófonos. Ambos se pronuncian /θruː/. El significado se deduce por el contexto.",
          },
          {
            question: "¿Cómo pronuncio la «R» después de la TH?",
            answer:
              "Retira la lengua desde los dientes hacia atrás y curva la punta sin tocar el paladar. No la hagas vibrar como la «rr» española.",
          },
        ],
      },
    },
    orderIndex: 3,
  },
  {
    slug: "though",
    word: "Though",
    translationEs: "Aunque / Sin embargo",
    ipa: "/ðoʊ/",
    phoneticRespellingEs: "DÓU (D suave con la lengua entre dientes)",
    difficulty: "Intermedio",
    phonemeType: "th-voiced",
    targetFrequencyHz: VOICED_BAND,
    anatomicalTipEs: TIP_ETH,
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.3, 6], [1, 22], [0.55, 10]]),
    chunks: [
      { label: "Th-", ipa: "/ð/", hintEs: "Lengua entre los dientes y voz vibrando: siente el cosquilleo." },
      { label: "-ough", ipa: "/oʊ/", hintEs: "Diptongo «ou»: empieza en «o» y cierra los labios hacia «u»." },
    ],
    commonMispronunciations: [
      {
        heardWord: "dough",
        errorType: "Oclusión dental (/d/)",
        correctionTipEs:
          "Sonó a «dough» (masa). No golpees la lengua contra los dientes: déjala asomar entre ellos y haz vibrar la voz sin cortar el aire.",
      },
      {
        heardWord: "tough",
        errorType: "Oclusión sorda + vocal incorrecta",
        correctionTipEs:
          "Sonó a «tough» (duro). La TH de «though» lleva voz (vibración) y la «ough» suena «ou», no «af».",
      },
      {
        heardWord: "thought",
        errorType: "Sonoridad y vocal incorrectas",
        correctionTipEs:
          "Sonó a «thought». En «though» la TH vibra (con voz), la vocal es «ou» y no hay «t» final.",
      },
      {
        heardWord: "doe",
        errorType: "Oclusión dental (/d/)",
        correctionTipEs: "Escuchamos una «D» golpeada. Suaviza el inicio como en la «d» de «cada»: lengua entre los dientes y aire continuo.",
      },
    ],
    acceptedTranscripts: ["though", "tho", "although"],
    shadowingSentence: {
      english: "Even though the weather was cold, they went to the beach.",
      spanish: "Aunque el clima estaba frío, fueron a la playa.",
      ipa: "/ˈiːvən ðoʊ ðə ˈweðər wəz koʊld ðeɪ went tə ðə biːtʃ/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Though» en inglés: la TH sonora /ð/",
      metaDescription:
        "Aprende a pronunciar «though» /ðoʊ/ sin que suene a «dough». TH sonora, la «gh» muda y el diptongo «ou». Practica con tu voz gratis.",
      h1: "Cómo pronunciar «Though» en inglés",
      article: {
        whyIsItHardEs:
          "«Though» utiliza la otra TH del inglés: la sonora /ð/. A diferencia de la /θ/ de «thirty», aquí las cuerdas vocales vibran mientras el aire pasa entre la lengua y los dientes. Los hispanohablantes tendemos a convertirla en una «D» fuerte, como la de «dedo» al inicio de palabra, y el resultado es «dough» (masa de pan). Lo curioso es que el español ya tiene un sonido muy parecido: la «d» suave entre vocales, como en «cada», «nada» o «hablado». En esas palabras, tu lengua apenas roza los dientes y el aire nunca se detiene. Esa es la clave: llevar esa «d» suave al inicio de la palabra y sacar un poquito más la lengua. Además, la ortografía «-ough» aquí suena como el diptongo /oʊ/, que empieza en una «o» y termina cerrando los labios hacia «u». La «gh» es completamente muda. Como «though» es una palabra muy frecuente en conversación («I like it, though»), dominarla mejora muchísimo tu fluidez general.",
        comparisonTitleEs: "Though vs. Dough vs. Thought",
        comparisonBodyEs:
          "«Though» /ðoʊ/ empieza con TH sonora y continua; «dough» /doʊ/ empieza con una «D» oclusiva que bloquea el aire por un instante. «Thought» /θɔːt/ usa la TH sorda (sin voz), una vocal abierta «oo» y termina en «t». Fíjate en la vibración: pon los dedos en la garganta; con «though» debes sentirla desde el primer instante.",
        faqs: [
          {
            question: "¿La TH de «though» es igual a la de «think»?",
            answer:
              "No. «Though» usa la TH sonora /ð/ (con vibración de las cuerdas vocales) y «think» usa la TH sorda /θ/ (solo aire).",
          },
          {
            question: "¿Cómo se pronuncia «although»?",
            answer: "/ɔːlˈðoʊ/: «ol-DHOU», con el acento en la segunda sílaba y la misma TH sonora de «though».",
          },
          {
            question: "¿Qué truco hay para la TH sonora?",
            answer:
              "Di «cada» en español y fíjate en la «d» suave. Ahora saca un poco la lengua entre los dientes y di «though» con esa misma suavidad.",
          },
        ],
      },
    },
    orderIndex: 4,
  },
  {
    slug: "thought",
    word: "Thought",
    translationEs: "Pensamiento / Pensé",
    ipa: "/θɔːt/",
    phoneticRespellingEs: "ZÓOT (lengua entre dientes y «o» abierta)",
    difficulty: "Intermedio",
    phonemeType: "th-unvoiced",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs: TIP_THETA,
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.14, 6], [1, 22], [0.35, 4], [0.12, 5]]),
    chunks: [
      { label: "Th-", ipa: "/θ/", hintEs: "Soplo sin voz con la lengua entre los dientes." },
      { label: "-ough-", ipa: "/ɔː/", hintEs: "Vocal larga y abierta, entre «o» y «a». La «gh» es muda." },
      { label: "-t", ipa: "/t/", hintEs: "«T» final suave; casi se corta sin soltar aire." },
    ],
    commonMispronunciations: [
      {
        heardWord: "taught",
        errorType: "Oclusión dental (/t/)",
        correctionTipEs:
          "Sonó a «taught» (enseñó). En lugar de una «T» seca, empieza con la lengua entre los dientes y un soplo continuo.",
      },
      {
        heardWord: "dot",
        errorType: "Oclusión dental (/d/) + vocal corta",
        correctionTipEs: "Sonó a «dot». No golpees con «D»: sopla la TH y alarga la vocal abierta «ooo».",
      },
      {
        heardWord: "fought",
        errorType: "Sustitución labiodental (/f/)",
        correctionTipEs:
          "Sonó a «fought» (peleó). No uses el labio inferior: la TH se hace con la lengua contra el borde de los dientes superiores.",
      },
      {
        heardWord: "sought",
        errorType: "Sustitución alveolar (/s/)",
        correctionTipEs: "Sonó a «sought». La «S» se hace detrás de los dientes; para la TH, la lengua debe asomar entre ellos.",
      },
    ],
    acceptedTranscripts: ["thought"],
    shadowingSentence: {
      english: "I thought about you the whole time.",
      spanish: "Pensé en ti todo el tiempo.",
      ipa: "/aɪ θɔːt əˈbaʊt juː ðə hoʊl taɪm/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Thought» en inglés: evita decir «taught»",
      metaDescription:
        "Pronuncia «thought» /θɔːt/ como un nativo: TH sorda, vocal abierta y «gh» muda. Audio a velocidad normal y lenta + evaluación con micrófono.",
      h1: "Cómo pronunciar «Thought» en inglés",
      article: {
        whyIsItHardEs:
          "«Thought», el pasado de «think» y también el sustantivo «pensamiento», es una palabra que usarás constantemente. Para un hispanohablante presenta tres dificultades. La primera es la TH sorda /θ/: como no existe en el español de América, se sustituye por «T», y entonces «I thought» se convierte en «I taught» («yo enseñé»), cambiando por completo el significado. La segunda es la vocal /ɔː/, una «o» larga y muy abierta que en inglés americano se acerca a la «a» («thaat»). No es la «o» cerrada del español. La tercera es la ortografía: «-ought» parece tener muchos sonidos, pero la «gh» es muda y solo se pronuncia la «t» final, que en conversación rápida suele quedar retenida, sin soltar aire. Para dominarla, practica primero el soplo /θ/ aislado durante un segundo, luego añádele la vocal abierta y por último corta con la «t». Si eres de España, la «Z» de «zorro» te da exactamente la posición correcta para empezar.",
        comparisonTitleEs: "Thought vs. Taught: mismo sonido final, distinto inicio",
        comparisonBodyEs:
          "«Thought» /θɔːt/ y «taught» /tɔːt/ comparten la vocal y la «t» final. Solo cambia la primera consonante: en «thought» la lengua asoma entre los dientes y el aire fluye (fricativa); en «taught» la lengua se pega detrás de los dientes y bloquea el aire (oclusiva). Esa única diferencia cambia «pensé» por «enseñé».",
        faqs: [
          {
            question: "¿Cómo se pronuncia «thought» en inglés americano?",
            answer:
              "/θɔːt/, aunque muchos estadounidenses dicen /θɑːt/, casi «thaat». Empieza con soplo entre los dientes, vocal abierta y una «t» suave.",
          },
          {
            question: "¿Por qué me entienden «taught» cuando digo «thought»?",
            answer:
              "Porque estás usando una «T» oclusiva. Saca un poco la punta de la lengua entre los dientes y sopla antes de la vocal.",
          },
          {
            question: "¿La «gh» de «thought» suena?",
            answer: "No. Es completamente muda. Solo suenan la TH, la vocal y la «t» final.",
          },
        ],
      },
    },
    orderIndex: 5,
  },
  {
    slug: "weather",
    word: "Weather",
    translationEs: "Clima / Tiempo atmosférico",
    ipa: "/ˈweðər/",
    phoneticRespellingEs: "UÉ-dher (D suave con la lengua entre dientes)",
    difficulty: "Intermedio",
    phonemeType: "th-voiced",
    targetFrequencyHz: VOICED_BAND,
    anatomicalTipEs:
      "Entre las dos vocales, deja la punta de la lengua entre los dientes y mantén la voz vibrando sin cortar el aire. Es una «d» muy suave y continua, como en «cada» o «nada».",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.45, 6], [1, 12], [0.4, 5], [0.75, 14], [0.3, 4]]),
    chunks: [
      { label: "Wea-", ipa: "/ˈwe/", hintEs: "Labios redondeados para la «w» y una «e» corta y abierta." },
      { label: "-ther", ipa: "/ðər/", hintEs: "Lengua entre los dientes con voz + «er» relajado con R inglesa." },
    ],
    commonMispronunciations: [
      {
        heardWord: "wedder",
        errorType: "Oclusión intervocálica (/d/)",
        correctionTipEs:
          "Sonó como «wedder»: golpeaste con una «D». Deja la lengua suelta entre los dientes y mantén la vibración de una vocal a la otra.",
      },
      {
        heardWord: "wetter",
        errorType: "Oclusión sorda (/t/)",
        correctionTipEs: "Sonó a «wetter» (más mojado). No cortes el aire: la TH de «weather» es continua y con voz.",
      },
      {
        heardWord: "whither",
        errorType: "Vocal incorrecta",
        correctionTipEs: "La primera vocal es una «e» abierta, no una «i». Abre un poco más la boca: «WE-ther».",
      },
    ],
    acceptedTranscripts: ["weather", "whether"],
    shadowingSentence: {
      english: "Whether the weather is cold or hot, we'll weather the weather.",
      spanish: "Haga frío o calor, aguantaremos el clima.",
      ipa: "/ˈweðər ðə ˈweðər ɪz koʊld ɔːr hɑːt wiːl ˈweðər ðə ˈweðər/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Weather» en inglés (y no decir «wedder»)",
      metaDescription:
        "Aprende la pronunciación de «weather» /ˈweðər/ con la TH sonora entre vocales. Audio nativo, guía anatómica y evaluación con micrófono gratis.",
      h1: "Cómo pronunciar «Weather» en inglés",
      article: {
        whyIsItHardEs:
          "«Weather» es una palabra cotidiana que casi todos los hispanohablantes pronuncian como «wedder». El motivo es que la TH sonora /ð/ aparece entre dos vocales, y nuestro cerebro la interpreta como una «D» normal. En realidad, el español tiene una ventaja escondida: entre vocales, nuestra «d» ya es suave y fricativa (piensa en «cada» o «hablado»). Lo que ocurre es que, al pronunciar en inglés, solemos poner más tensión y la convertimos en una «D» oclusiva que corta el aire. Para la /ð/, la lengua debe asomar ligeramente entre los dientes y la voz no se interrumpe en ningún momento: el sonido fluye de la «e» a la «er» como un zumbido continuo. Además, la primera vocal es una /e/ corta y abierta, y la sílaba final /ər/ es una vocal relajada con la «R» inglesa, sin vibración. El acento siempre va en la primera sílaba: «WEA-ther». Practicar despacio, sintiendo el cosquilleo de la lengua contra los dientes, es la clave para que suene natural.",
        comparisonTitleEs: "Weather vs. Whether vs. Wetter",
        comparisonBodyEs:
          "«Weather» (clima) y «whether» (si / ya sea) se pronuncian exactamente igual en casi todo el mundo angloparlante: /ˈweðər/. «Wetter» (más mojado) usa una «t» que en EE. UU. suena como una «r» rápida. La diferencia clave es la continuidad: con /ð/ el sonido nunca se detiene; con «d» o «t» la lengua toca los alvéolos y hay un mini corte.",
        faqs: [
          {
            question: "¿«Weather» y «whether» suenan igual?",
            answer:
              "Sí, en la gran mayoría de acentos son homófonos: /ˈweðər/. Solo algunos hablantes escoceses o del sur de EE. UU. aspiran la «wh» de «whether».",
          },
          {
            question: "¿Por qué mi «weather» suena a «wedder»?",
            answer:
              "Porque tu lengua toca detrás de los dientes y corta el aire. Deja la lengua entre los dientes y mantén la voz fluyendo entre las dos vocales.",
          },
          {
            question: "¿Cómo pregunto por el clima en inglés?",
            answer:
              "«What's the weather like today?» /wʌts ðə ˈweðər laɪk təˈdeɪ/. Fíjate en que «the» también lleva la TH sonora.",
          },
        ],
      },
    },
    orderIndex: 6,
  },
  {
    slug: "whether",
    word: "Whether",
    translationEs: "Si (condicional) / Ya sea",
    ipa: "/ˈweðər/",
    phoneticRespellingEs: "UÉ-dher (igual que «weather»)",
    difficulty: "Intermedio",
    phonemeType: "th-voiced",
    targetFrequencyHz: VOICED_BAND,
    anatomicalTipEs:
      "Redondea los labios para la «w», abre en una «e» corta y, sin cortar la voz, asoma la lengua entre los dientes para la /ð/ antes de terminar en «er».",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.4, 6], [1, 12], [0.38, 5], [0.72, 14], [0.28, 4]]),
    chunks: [
      { label: "Whe-", ipa: "/ˈwe/", hintEs: "La «h» es muda en casi todos los acentos: suena «ue»." },
      { label: "-ther", ipa: "/ðər/", hintEs: "TH sonora (vibración) + «er» relajado." },
    ],
    commonMispronunciations: [
      {
        heardWord: "wedder",
        errorType: "Oclusión intervocálica (/d/)",
        correctionTipEs:
          "Sonó a «wedder». No apoyes la lengua detrás de los dientes: asómala entre ellos y deja la voz vibrando sin cortes.",
      },
      {
        heardWord: "whiter",
        errorType: "Vocal y consonante incorrectas",
        correctionTipEs:
          "Sonó a «whiter» (más blanco). La vocal es una «e» corta, no «ai», y la consonante es una TH sonora, no una «t».",
      },
      {
        heardWord: "wetter",
        errorType: "Oclusión sorda (/t/)",
        correctionTipEs: "Sonó a «wetter». Cambia la «t» por una TH con voz: lengua entre los dientes y zumbido continuo.",
      },
    ],
    acceptedTranscripts: ["whether", "weather"],
    shadowingSentence: {
      english: "I don't know whether they'll gather together this weekend.",
      spanish: "No sé si se reunirán este fin de semana.",
      ipa: "/aɪ doʊnt noʊ ˈweðər ðeɪl ˈɡæðər təˈɡeðər ðɪs ˈwiːkend/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Whether» en inglés: guía con audio",
      metaDescription:
        "Pronuncia «whether» /ˈweðər/ correctamente: «h» muda, TH sonora y «er» relajado. Diferencia con «weather» y práctica con micrófono gratis.",
      h1: "Cómo pronunciar «Whether» en inglés",
      article: {
        whyIsItHardEs:
          "«Whether» confunde a los hispanohablantes por dos motivos. El primero es ortográfico: la combinación «wh» invita a pronunciar una «j» o una «h» aspirada, cuando en casi todos los acentos actuales la «h» es muda y la palabra empieza simplemente con «ue». El segundo motivo es la TH sonora /ð/ en medio de la palabra. Como aparece entre dos vocales, el cerebro hispanohablante la reemplaza por una «D», y así nace el clásico «wedder». Para pronunciarla bien, mantén la voz vibrando sin interrupción mientras la punta de la lengua asoma ligeramente entre los dientes; el aire debe pasar rozando, nunca bloquearse. Piensa en la «d» suave de «nada» y exagérala un poco sacando la lengua. Como «whether» suena idéntica a «weather», practicar una te sirve para la otra. Es una palabra clave en inglés formal y profesional («whether or not», «regardless of whether»), así que pronunciarla bien da una impresión inmediata de dominio del idioma.",
        comparisonTitleEs: "Whether vs. Weather: misma pronunciación, distinto significado",
        comparisonBodyEs:
          "Ambas se pronuncian /ˈweðər/. «Whether» es una conjunción («I don't know whether he'll come»: no sé si vendrá) y «weather» es el clima («The weather is nice»). Solo el contexto las distingue. Lo importante es que ninguna de las dos lleva una «D» golpeada: ambas usan la TH sonora continua.",
        faqs: [
          {
            question: "¿Se pronuncia la «h» de «whether»?",
            answer: "En la mayoría de acentos modernos, no. «Whether» suena igual que «weather»: /ˈweðər/.",
          },
          {
            question: "¿Cuándo uso «whether» en lugar de «if»?",
            answer:
              "Ambas significan «si» en preguntas indirectas, pero «whether» es más formal y obligatoria antes de «or not» y después de preposiciones.",
          },
          {
            question: "¿La TH de «whether» lleva voz?",
            answer: "Sí. Es la TH sonora /ð/: las cuerdas vocales vibran mientras la lengua está entre los dientes.",
          },
        ],
      },
    },
    orderIndex: 7,
  },
  {
    slug: "bath",
    word: "Bath",
    translationEs: "Baño / Bañera",
    ipa: "/bæθ/",
    phoneticRespellingEs: "BÁZ (termina sacando la lengua y soplando)",
    difficulty: "Básico",
    phonemeType: "th-unvoiced",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs:
      "Al final de la palabra, no cortes el sonido: después de la vocal, saca la punta de la lengua entre los dientes y sopla un soplo suave y audible, como la «Z» de España.",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.3, 3], [1, 22], [0.16, 11]]),
    chunks: [
      { label: "Ba-", ipa: "/bæ/", hintEs: "«B» + una vocal abierta entre «a» y «e» (boca bien abierta)." },
      { label: "-th", ipa: "/θ/", hintEs: "Termina con la lengua entre los dientes soplando. ¡Que se oiga el aire!" },
    ],
    commonMispronunciations: [
      {
        heardWord: "bat",
        errorType: "Oclusión final (/t/)",
        correctionTipEs:
          "Sonó a «bat» (murciélago / bate). No cierres con una «T»: deja salir el aire entre la lengua y los dientes al final.",
      },
      {
        heardWord: "bad",
        errorType: "Oclusión final sonora (/d/)",
        correctionTipEs: "Sonó a «bad» (malo). El final no lleva voz ni golpe: es un soplo sin voz con la lengua entre los dientes.",
      },
      {
        heardWord: "bass",
        errorType: "Sustitución alveolar (/s/)",
        correctionTipEs:
          "Sonó a una «S». Para la «S» la lengua está detrás de los dientes; para la TH, debe asomar entre ellos.",
      },
    ],
    acceptedTranscripts: ["bath", "baths"],
    shadowingSentence: {
      english: "After a long day, I take a hot bath with both hands free.",
      spanish: "Después de un día largo, me doy un baño caliente con ambas manos libres.",
      ipa: "/ˈæftər ə lɔːŋ deɪ aɪ teɪk ə hɑːt bæθ wɪð boʊθ hændz friː/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Bath» en inglés: la TH al final de la palabra",
      metaDescription:
        "Pronuncia «bath» /bæθ/ sin que suene a «bat» o «bad». Aprende la TH final, escucha el audio nativo y graba tu voz para recibir feedback.",
      h1: "Cómo pronunciar «Bath» en inglés",
      article: {
        whyIsItHardEs:
          "«Bath» parece fácil, pero esconde una trampa que delata a muchos hispanohablantes: la TH al final de la palabra. En español casi ninguna palabra termina en un sonido fricativo como /θ/, y nuestra tendencia es cerrar con una consonante oclusiva que conocemos bien, como «T» o «D». El resultado es «bat» (murciélago o bate) o «bad» (malo). También es común sustituirla por una «S», diciendo «bass». Para pronunciar correctamente «bath», tras la vocal debes llevar la punta de la lengua entre los dientes y dejar salir un soplo de aire suave pero audible, sin voz. Ese soplo puede durar más de lo que crees: los nativos lo mantienen un instante. La vocal también es un desafío: en inglés americano es /æ/, una «a» muy abierta que suena entre «a» y «e», con la boca bien abierta y la lengua baja. En inglés británico se dice /bɑːθ/, con una «a» larga. Ambas versiones son correctas; lo importante es que el final suene a TH.",
        comparisonTitleEs: "Bath vs. Bat vs. Bad: la importancia del final",
        comparisonBodyEs:
          "Las tres palabras comparten el inicio «ba-». «Bath» /bæθ/ termina en un soplo continuo con la lengua entre los dientes. «Bat» /bæt/ termina con una «t» que corta el aire. «Bad» /bæd/ termina con una «d» sonora, y además alarga ligeramente la vocal. Si tu «bath» se corta de golpe, suena a «bat».",
        faqs: [
          {
            question: "¿Cómo se pronuncia «bath» en inglés británico?",
            answer: "/bɑːθ/, con una «a» larga y abierta, «baaz». En inglés americano es /bæθ/, con la «a» abierta y corta.",
          },
          {
            question: "¿Cuál es la diferencia entre «bath» y «bathe»?",
            answer:
              "«Bath» /bæθ/ es el sustantivo (baño) y termina en TH sorda. «Bathe» /beɪð/ es el verbo (bañarse) y termina en TH sonora con el diptongo «ei».",
          },
          {
            question: "¿Cómo pronuncio el plural «baths»?",
            answer: "/bæθs/ o /bæðz/. Ambos son correctos; muchos nativos simplifican el final.",
          },
        ],
      },
    },
    orderIndex: 8,
  },
  {
    slug: "breath",
    word: "Breath",
    translationEs: "Aliento / Respiración",
    ipa: "/breθ/",
    phoneticRespellingEs: "BRÉZ (termina con soplo entre los dientes)",
    difficulty: "Intermedio",
    phonemeType: "th-unvoiced",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs:
      "Di «bre» con una «R» inglesa sin vibrar y una «e» corta. Termina llevando la lengua entre los dientes y soplando aire sin voz: el final debe sonar como un suspiro suave.",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.3, 3], [0.55, 5], [1, 16], [0.16, 11]]),
    chunks: [
      { label: "Brea-", ipa: "/bre/", hintEs: "«B» + R inglesa (sin vibrar) + «e» corta." },
      { label: "-th", ipa: "/θ/", hintEs: "Lengua entre los dientes y soplo sin voz al final." },
    ],
    commonMispronunciations: [
      {
        heardWord: "bread",
        errorType: "Oclusión final sonora (/d/)",
        correctionTipEs:
          "Sonó a «bread» (pan). No cierres con «D»: deja salir un soplo de aire con la lengua entre los dientes.",
      },
      {
        heardWord: "breathe",
        errorType: "Vocal larga + TH sonora",
        correctionTipEs:
          "Sonó al verbo «breathe» /briːð/. El sustantivo «breath» tiene una «e» corta y la TH final sin voz.",
      },
      {
        heardWord: "bret",
        errorType: "Oclusión final (/t/)",
        correctionTipEs: "Cerraste con una «T». La TH final es continua: sopla entre la lengua y los dientes sin cortar.",
      },
      {
        heardWord: "breast",
        errorType: "Sustitución alveolar (/s/ + /t/)",
        correctionTipEs:
          "Sonó a «breast». Evita la «S» y la «T» finales: solo un soplo con la lengua entre los dientes.",
      },
    ],
    acceptedTranscripts: ["breath"],
    shadowingSentence: {
      english: "Take a deep breath and think three times before you speak.",
      spanish: "Respira hondo y piensa tres veces antes de hablar.",
      ipa: "/teɪk ə diːp breθ ænd θɪŋk θriː taɪmz bɪˈfɔːr juː spiːk/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Breath» en inglés (vs. «breathe» y «bread»)",
      metaDescription:
        "Pronuncia «breath» /breθ/ correctamente: «e» corta y TH final sin voz. Diferencia con «breathe» y «bread». Práctica guiada con micrófono.",
      h1: "Cómo pronunciar «Breath» en inglés",
      article: {
        whyIsItHardEs:
          "«Breath» reúne tres obstáculos para los hispanohablantes en una sola sílaba. Primero, el grupo «br» seguido de una «R» inglesa: en español, la «r» después de «b» es una vibración rápida, mientras que en inglés la lengua se curva hacia atrás sin tocar el paladar. Segundo, la vocal: aunque se escribe «ea», suena como una «e» corta, no como «ii». Si la alargas, terminas diciendo «breathe» (el verbo respirar), que además cambia la TH final a sonora. Tercero, y lo más importante, la TH sorda /θ/ al final. En español no estamos acostumbrados a terminar palabras con un soplo fricativo, así que cerramos con «D» o «T», produciendo «bread» (pan) o «bret». Para lograr un final nativo, después de la «e» lleva la lengua entre los dientes y deja escapar el aire sin voz durante un instante, como un suspiro. Pedir «a breath of fresh air» y que te entiendan «a bread of fresh air» es un error muy común que se corrige con unos minutos de práctica consciente.",
        comparisonTitleEs: "Breath vs. Breathe vs. Bread",
        comparisonBodyEs:
          "«Breath» /breθ/ (sustantivo): «e» corta y TH final sorda, solo aire. «Breathe» /briːð/ (verbo): «ii» larga y TH final sonora, con vibración. «Bread» /bred/ (pan): misma vocal que «breath», pero termina en una «d» que corta el aire. Practica las tres seguidas para entrenar el oído.",
        faqs: [
          {
            question: "¿Cuál es la diferencia entre «breath» y «breathe»?",
            answer:
              "«Breath» es el sustantivo (aliento) y se pronuncia /breθ/. «Breathe» es el verbo (respirar) y se pronuncia /briːð/, con vocal larga y TH sonora.",
          },
          {
            question: "¿Por qué «breath» se escribe con «ea» pero suena «e»?",
            answer:
              "Es una irregularidad histórica del inglés. Pasa lo mismo en «bread», «head» o «weather»: la «ea» suena como una «e» corta.",
          },
          {
            question: "¿Cómo se dice «respira hondo» en inglés?",
            answer: "«Take a deep breath» /teɪk ə diːp breθ/. Asegúrate de terminar «breath» con soplo entre los dientes.",
          },
        ],
      },
    },
    orderIndex: 9,
  },
  {
    slug: "strength",
    word: "Strength",
    translationEs: "Fuerza / Fortaleza",
    ipa: "/streŋθ/",
    phoneticRespellingEs: "STRÉNGZ (sin «e» inicial; termina con soplo entre dientes)",
    difficulty: "Avanzado",
    phonemeType: "th-cluster",
    targetFrequencyHz: UNVOICED_BAND,
    anatomicalTipEs:
      "No añadas una «e» al inicio: empieza directamente con «s». Al final, desde la posición de «ng» (lengua atrás), lleva la punta de la lengua entre los dientes y sopla aire sin voz para la /θ/.",
    audioNormalUrl: "",
    audioSlowUrl: "",
    referenceWaveform: wave([[0.18, 6], [0.22, 2], [0.5, 4], [1, 14], [0.6, 6], [0.14, 9]]),
    chunks: [
      { label: "Str-", ipa: "/str/", hintEs: "Sin «e» delante: «s» siseante + «t» + R inglesa." },
      { label: "-eng-", ipa: "/eŋ/", hintEs: "«E» corta + «ng» nasal con la parte de atrás de la lengua (sin «g» fuerte)." },
      { label: "-th", ipa: "/θ/", hintEs: "Punta de la lengua entre los dientes y soplo final sin voz." },
    ],
    commonMispronunciations: [
      {
        heardWord: "strenth",
        errorType: "Omisión de la nasal velar (/ŋ/)",
        correctionTipEs:
          "Perdiste el sonido «ng». Antes de la TH, levanta la parte de atrás de la lengua hacia el paladar como en «tengo».",
      },
      {
        heardWord: "strengt",
        errorType: "Oclusión final (/t/)",
        correctionTipEs: "Terminaste con una «T». Cambia el golpe final por un soplo continuo con la lengua entre los dientes.",
      },
      {
        heardWord: "estrength",
        errorType: "Vocal epentética (/e/)",
        correctionTipEs:
          "Añadiste una «e» al inicio, algo muy típico del español. Empieza directamente con un siseo «sss» antes de la «tr».",
      },
      {
        heardWord: "strings",
        errorType: "Vocal y final incorrectos",
        correctionTipEs:
          "Sonó a «strings». La vocal es una «e» corta y el final es /θ/: lengua entre los dientes y soplo, no «s».",
      },
    ],
    acceptedTranscripts: ["strength"],
    shadowingSentence: {
      english: "Your strength is your strongest asset, so use it every day.",
      spanish: "Tu fuerza es tu mayor activo, así que úsala todos los días.",
      ipa: "/jɔːr streŋθ ɪz jɔːr ˈstrɔːŋɡɪst ˈæset soʊ juːz ɪt ˈevri deɪ/",
    },
    seo: {
      metaTitle: "Cómo pronunciar «Strength» en inglés: la palabra más difícil",
      metaDescription:
        "Domina «strength» /streŋθ/: sin «e» inicial, «ng» nasal y TH final. Guía paso a paso con audio lento y evaluación de tu voz gratis.",
      h1: "Cómo pronunciar «Strength» en inglés",
      article: {
        whyIsItHardEs:
          "«Strength» es considerada una de las palabras más difíciles del inglés para cualquier estudiante, y para los hispanohablantes lo es todavía más. Tiene una sola vocal rodeada de seis sonidos consonánticos: /s/, /t/ y /r/ al inicio, y /ŋ/ y /θ/ al final. En español ninguna palabra empieza con «s» seguida de consonante, por eso añadimos instintivamente una «e» y decimos «estrength». Al final, la combinación de la nasal velar /ŋ/ (el sonido de «ng», con la parte trasera de la lengua tocando el paladar blando) y la TH sorda /θ/ (con la punta de la lengua entre los dientes) exige un movimiento rápido de toda la lengua hacia adelante. Muchos estudiantes eliminan la «ng» («strenth») o convierten la TH en «T» («strengt»). Algunos nativos incluso añaden una /k/ casi imperceptible: /streŋkθ/. La mejor estrategia es dividir la palabra en bloques: practica «sss-tr», luego «eng» y por último el soplo «th». Cuando cada bloque salga solo, únelos lentamente hasta alcanzar la velocidad natural.",
        comparisonTitleEs: "Strength vs. Strenth vs. Estrength",
        comparisonBodyEs:
          "La versión correcta /streŋθ/ conserva la nasal «ng» y termina en soplo. «Strenth» pierde la «ng» y suena incompleta. «Estrength» añade una vocal al inicio, un acento muy marcado del español. Para corregirlo, sostén un «sssss» antes de empezar la palabra y nunca abras la boca para una «e» inicial.",
        faqs: [
          {
            question: "¿Por qué «strength» es tan difícil de pronunciar?",
            answer:
              "Porque concentra seis consonantes alrededor de una sola vocal, incluyendo grupos que no existen en español: «str» al inicio y «ngth» al final.",
          },
          {
            question: "¿Se pronuncia la «g» de «strength»?",
            answer:
              "No como una «g» fuerte. «Ng» representa un solo sonido nasal /ŋ/. Algunos nativos añaden una ligera /k/, pero no es obligatorio.",
          },
          {
            question: "¿Cómo evito decir «estrength»?",
            answer:
              "Empieza con un siseo largo «ssss» y pasa directo a «tr». Practica primero «sss-trength» exagerando la «s» inicial.",
          },
        ],
      },
    },
    orderIndex: 10,
  },
];
