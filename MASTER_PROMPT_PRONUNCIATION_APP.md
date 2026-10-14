# MASTER PROMPT & ARCHITECTURAL SPECIFICATION: "TH-MASTER" (English Pronunciation Micro-App)

## 1. PROJECT VISION & BUSINESS GOAL
Build a minimalist, ultra-fast, SEO-programmatic web application designed for Spanish speakers to master difficult English phonetic sounds—starting specifically with the **"TH" sounds** (voiceless `/θ/` as in *thirty*, and voiced `/ð/` as in *weather*).
- **Monetization Model:** 100% Free for users. Monetized via **Google AdSense** (display ads) and organic viral retention.
- **Financial & Cost Constraint:** Server/Cloud operational cost must remain **$0.00 USD/month** on free tiers. All real-time voice evaluation and acoustic analysis MUST run 100% client-side in the user's browser. AI and TTS APIs are only executed offline/build-time via a content seeder script.
- **Target Audience & UI Language:** Native Spanish speakers learning or perfecting professional English. The UI, anatomical tips, and SEO metadata are in **Spanish**, teaching **English** pronunciation.

---

## 2. TECH STACK & INFRASTRUCTURE (100% Google Ecosystem, No Vercel)
- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS).
- **Rendering Strategy:** Static Site Generation (`output: 'export'` in `next.config.mjs`) for the MVP so all routes compile into ultra-fast static HTML/CSS/JS bundles. (Ready to transition to `output: 'standalone'` on Google Cloud Run / Firebase App Hosting when scaling past thousands of words).
- **Frontend Hosting:** **Firebase Hosting** (backed by Google Global CDN).
- **Database:** **Google Cloud Firestore** (NoSQL). Used as the Single Source of Truth during build-time (`generateStaticParams`) and optional client-side reads.
- **Media Storage:** **Google Cloud Storage** (or Firebase Storage) to store reference `.mp3` files (1.0x normal speed and 0.6x slow-motion speed).
- **Security & Anti-Bot Layer:** **Cloudflare** (DNS + WAF in front of Firebase Hosting) + **Firebase App Check (reCAPTCHA v3)** + Behavioral Proof-of-Humanity before rendering ads or triggering analytics events.
- **Client-Side Audio & Voice APIs:**
  - `Web Audio API` (`AudioContext`, `AnalyserNode`, FFT frequency analysis, real-time Canvas waveform rendering).
  - `Web Speech API` (`SpeechRecognition` / `webkitSpeechRecognition` with `interimResults: true` and `maxAlternatives: 5`).

---

## 3. THE 4-PHASE PEDAGOGICAL METHODOLOGY (CORE UX)
Every word page (`/pronunciar/[slug]`) implements a distraction-free, gamified 4-step interactive trainer *Above the Fold*:

### Phase 1: Visual & Auditory Diagnosis (Breaking Native Habits)
- **Interactive Sagittal Mouth SVG Component:** Instead of heavy videos per word, map each word to a reusable React SVG component based on its `phonemeType` (e.g., `th-unvoiced`, `th-voiced`, `consonant-cluster`). The SVG animates tongue placement (e.g., tongue tip slightly between upper and lower teeth) and airflow (continuous friction vs. plosive stop).
- **Audio Dual-Player:** Buttons to play the native reference audio at **1.0x (Normal)** and **0.6x (Slow-Mo)** alongside the IPA transcription (`/ˈθɜːrti/`).

### Phase 2: The Acoustic Mirror (Real-Time Waveform & Phonetic Trap Detector)
- **Pre-Computed Native Waveform:** The native `.mp3` amplitude peaks (array of 48 normalized floats `0.0 - 1.0`) are stored in Firestore and rendered instantly on an HTML5 `<canvas>`.
- **Live User Recording & Overlay:** When the user holds/clicks the microphone button, draw their voice waveform in real time over/below the native waveform.
- **Dual-Engine Evaluation (Client-Side, $0 Cost):**
  1. **Engine A — Phonetic Trap Matcher (`Web Speech API`):** Listen to the user's attempt with `lang = 'en-US'` and `maxAlternatives = 5`. Check if any alternative matches the target word (`"thirty"` or `"30"`). If not, check against the word's `commonMispronunciations` dictionary (e.g., `{"dirty": "Usaste una 'D' dental golpeando los dientes. Saca ligeramente la punta de la lengua y deja pasar aire continuo.", "tirty": "Sonó como una 'T' seca en español. No bloquees el aire; haz un siseo suave entre los dientes.", "tree": "Olvidaste la fricción inicial de la TH."}`).
  2. **Engine B — Acoustic Friction Fallback (`Web Audio API` FFT):** Crucial for **iOS Safari** and in-app browsers (Instagram/TikTok/WhatsApp) where `Web Speech API` may fail or cut off on single words. Using `AnalyserNode.getByteFrequencyData()`, measure high-frequency energy in the **4,000 Hz – 8,000 Hz** band (characteristic of `/θ/` fricatives) vs. low-frequency plosive spikes (`< 500 Hz`) during the onset of the word, plus total duration alignment against the native waveform.
- **Combined Scoring:** Output a clear visual score (`0 - 100%`) and an immediate, specific anatomical correction tip in Spanish.

### Phase 3: Dynamic Syllable Chunking (Slab Breakdown)
- Break complex words into phonetic slabs (e.g., `Thir` + `ty` or `Spec` + `if` + `i` + `cal` + `ly`).
- Allow the user to tap and practice each slab individually before unlocking the full-word badge.

### Phase 4: Real-Speed Context Challenge (Shadowing Express)
- Present a tongue-twister or realistic sentence containing the target word (e.g., *"I have thirty things to think about on Thursday"*).
- The user listens and repeats at natural rhythm to lock in muscle memory.

---

## 4. GAMIFICATION, RETENTION & ADSENSE COMPLIANCE

### LocalStorage Progress & Pageview Multiplier
- Do NOT require user login/registration.
- Store progress in `localStorage` (`th_master_progress`: mastered words, best score per word, daily streak).
- Display a sticky top progress bar: *"Reto Domina la TH: X de 10 palabras superadas 🔥"*.
- Upon scoring `>= 80%`, trigger a lightweight confetti effect and display a prominent CTA: **"¡Dominada! Siguiente reto: Thirteen ➡️"**, multiplying pageviews and legitimate ad impressions per session.

### AdSense "Anti-Thin Content" Architecture (Below the Fold)
To guarantee **Google AdSense approval** and dominate **Google Search (Programmatic SEO)**:
- **Above the Fold:** 100% clean, minimal interactive pronunciation tool.
- **Below the Fold (Scrollable Editorial Section):** Automatically rendered from the Firestore document for each word:
  1. **H2: ¿Cómo se pronuncia "[Word]" en inglés correctamente?** (Detailed anatomical guide in Spanish).
  2. **H2: Errores comunes de hispanohablantes: "[Word]" vs "[Phonetic Trap]"** (Comparison table with IPA and tongue position).
  3. **H2: Ejemplos y frases con "[Word]" en contexto real.**
  4. **H2: Preguntas Frecuentes (FAQ)** rendered with `FAQPage` JSON-LD Schema.org structured data + `LearningResource` JSON-LD Schema.
- **Mandatory Legal Pages:** Include `/privacidad`, `/terminos`, `/cookies`, and `/contacto` routes out of the box for AdSense compliance.

---

## 5. ANTI-BOT, SECURITY & ORGANIC TRAFFIC PROTECTION
Never buy cheap display traffic (Google Display Network) when monetizing with AdSense. Implement these technical safeguards in code:
1. **Human Interaction Gate for Ads & Analytics:** Do not initialize AdSense slots or fire "Active Learner" analytics events until the user performs a verified human micro-interaction (e.g., clicking "Escuchar audio", activating the microphone, or scrolling with natural pointer/touch events).
2. **Headless Browser & Bot Detection:** Check `navigator.webdriver` and missing audio input devices (`navigator.mediaDevices.enumerateDevices()`) to suppress ad rendering for automated scrapers/bots, protecting your AdSense account from Invalid Traffic (IVT) bans.
3. **Strict Content Security Policy (CSP) & Firebase Security Rules:** Lock Firestore rules to `allow read: if true; allow write: if false;` (writes only happen via the local Admin SDK seeder script).

---

## 6. DATA SCHEMA (FIRESTORE `words` COLLECTION)

```typescript
export interface MispronunciationFeedback {
  heardWord: string;        // e.g., "dirty", "tirty", "firty"
  errorType: string;        // e.g., "Oclusión Dental (/d/)"
  correctionTipEs: string;  // Specific actionable tip in Spanish
}

export interface SyllableChunk {
  label: string;            // e.g., "Thir-"
  ipa: string;              // e.g., "/ˈθɜːr/"
  hintEs: string;           // e.g., "Lengua entre los dientes + sonido ER"
}

export interface WordSEOArticle {
  whyIsItHardEs: string;    // 150-200 words explaining the phonetic clash with Spanish
  comparisonTitleEs: string;// e.g., "Diferencia entre Thirty (30) y Thirteen (13)"
  comparisonBodyEs: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface WordDocument {
  slug: string;             // URL slug: "thirty"
  word: string;             // Display word: "Thirty"
  translationEs: string;    // "Treinta (30)"
  ipa: string;              // "/ˈθɜːrti/"
  phoneticRespellingEs: string; // "ZÉR-ti (con lengua entre dientes)"
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  phonemeType: 'th-unvoiced' | 'th-voiced' | 'th-cluster' | 'ough-trap';
  targetFrequencyHz: [number, number]; // e.g., [4000, 8000] for /θ/ friction check
  anatomicalTipEs: string;
  audioNormalUrl: string;   // Cloud Storage URL (1.0x)
  audioSlowUrl: string;     // Cloud Storage URL (0.6x)
  referenceWaveform: number[]; // Array of 48 normalized floats [0.12, 0.45, ...]
  chunks: SyllableChunk[];
  commonMispronunciations: MispronunciationFeedback[];
  shadowingSentence: {
    english: string;
    spanish: string;
    ipa: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    article: WordSEOArticle;
  };
  orderIndex: number;       // 1 to 10 for MVP progression
}
```

---

## 7. THE INITIAL 10 MVP WORDS (SEED DATA)
Ensure the initial seed includes these 10 high-search-intent words:
1. `thirty` (Thirty - /ˈθɜːrti/ - Trap: *dirty, tirty, thirteen*)
2. `thirteen` (Thirteen - /ˌθɜːrˈtiːn/ - Trap: *thirty, dirteen*)
3. `through` (Through - /θruː/ - Trap: *true, drew, trough*)
4. `though` (Though - /ðoʊ/ - Trap: *dough, tough, thought*)
5. `thought` (Thought - /θɔːt/ - Trap: *taught, dot, fought*)
6. `weather` (Weather - /ˈweðər/ - Trap: *wedder, wetter*)
7. `whether` (Whether - /ˈweðər/ - Trap: *wedder, whiter*)
8. `bath` (Bath - /bæθ/ - Trap: *bat, bad, bass*)
9. `breath` (Breath - /breθ/ - Trap: *bread,ann, breathe*)
10. `strength` (Strength - /streŋθ/ - Trap: *strenth, strengt*)

---

## 8. AUTOMATED CONTENT SEEDER SCRIPT (`scripts/seed-words.ts`)
Create a standalone Node.js TypeScript script (`npm run seed`) using `firebase-admin`, `@google-cloud/text-to-speech`, and `@google/genai` (Gemini API):
1. Accepts an array of English target words.
2. Calls **Gemini 2.5 Flash** with Structured Outputs (`responseSchema`) to generate the complete `WordDocument` JSON (IPA, chunks, Spanish anatomical tips, common mispronunciations for Spanish speakers, and the 350-word SEO article + FAQs).
3. Calls **Google Cloud Text-to-Speech** (`en-US-Journey-D` or `en-US-Neural2-J`) to synthesize:
   - `[slug]-normal.mp3` (speakingRate: `1.0`)
   - `[slug]-slow.mp3` (SSML `<prosody rate="60%">`)
4. Computes the 48-bar normalized amplitude array (`referenceWaveform`) directly from the raw PCM/MP3 audio buffer in Node.js so the frontend never has to decode the MP3 just to draw the target wave.
5. Uploads both `.mp3` files to **Google Cloud Storage** (`gs://[BUCKET_NAME]/audio/`) with public read caching headers (`Cache-Control: public, max-age=31536000, immutable`).
6. Upserts the final `WordDocument` into **Cloud Firestore** collection `words/{slug}`.

---

## 9. PROJECT DIRECTORY STRUCTURE
```text
├── app/
│   ├── layout.tsx                 # Root layout, Spanish lang, sticky progress bar, AdSense script loader
│   ├── page.tsx                   # Landing page: "Domina la TH en Inglés" + 10-word interactive roadmap
│   ├── pronunciar/
│   │   └── [word]/
│   │       └── page.tsx           # SSG Dynamic Route (generateStaticParams + generateMetadata + JSON-LD)
│   ├── privacidad/page.tsx        # AdSense compliance
│   ├── terminos/page.tsx          # AdSense compliance
│   └── sitemap.ts                 # Dynamic XML sitemap generator for all words
├── components/
│   ├── trainer/
│   │   ├── PronunciationTrainer.tsx # Master interactive client component (Phases 1-4)
│   │   ├── MouthAnatomySVG.tsx      # Dynamic animated SVG (tongue, teeth, airflow)
│   │   ├── WaveformCanvas.tsx       # Dual HTML5 Canvas (Native reference vs Live user audio)
│   │   ├── SyllableChunker.tsx      # Interactive syllable breakdown buttons
│   │   └── FeedbackBadge.tsx        # Phonetic trap diagnosis & score display
│   ├── seo/
│   │   ├── WordSeoArticle.tsx       # Below-the-fold rich editorial content & comparison table
│   │   └── JsonLdSchema.tsx         # FAQPage & LearningResource structured data
│   └── ads/
│       └── SafeAdSlot.tsx           # Bot-protected, CLS-safe Google AdSense container
├── hooks/
│   ├── useVoiceEvaluator.ts       # Combines Web Speech API + Web Audio API FFT friction analyzer
│   └── useProgressStore.ts        # LocalStorage gamification hook
├── lib/
│   ├── firebase-client.ts         # Client SDK setup
│   ├── firebase-admin.ts          # Admin SDK for build-time SSG fetching
│   └── fallback-words.ts          # Local JSON seed of the 10 MVP words so `npm run dev` works offline immediately
├── scripts/
│   └── seed-words.ts              # Automated Gemini + GCP TTS + Storage + Firestore pipeline
├── firebase.json                  # Firebase Hosting static export configuration & caching headers
└── next.config.mjs                # Configured with `output: 'export'` and image optimization rules
```

---

## 10. STEP-BY-STEP IMPLEMENTATION INSTRUCTIONS FOR THE IDE AGENT
When executing this prompt in the IDE, follow this exact sequence:
1. **Initialize & Configure:** Set up Next.js (App Router, TypeScript, Tailwind CSS, `lucide-react`, `canvas-confetti`). Configure `next.config.mjs` with `output: 'export'`.
2. **Offline-First Seed Data (`lib/fallback-words.ts`):** Create the complete, rich dataset for the **10 MVP words** locally first so the entire application builds, renders, and works at `localhost:3000` immediately without waiting for GCP credentials.
3. **Build the Acoustic & Speech Hook (`hooks/useVoiceEvaluator.ts`):** Implement both `webkitSpeechRecognition` (with phonetic trap matching) and `AudioContext` + `AnalyserNode` (calculating real-time 48-bar user waveform + 4kHz–8kHz friction energy for iOS/Safari fallback).
4. **Build the Interactive Trainer UI (`components/trainer/*`):** Build `MouthAnatomySVG.tsx`, `WaveformCanvas.tsx`, and `PronunciationTrainer.tsx` with smooth, encouraging animations and instant visual feedback.
5. **Build the Dynamic Route & SEO (`app/pronunciar/[word]/page.tsx`):** Implement `generateStaticParams()`, `generateMetadata()`, `JsonLdSchema.tsx`, and `WordSeoArticle.tsx`.
6. **Build the Content Seeder (`scripts/seed-words.ts`) & `firebase.json`:** Provide the ready-to-run automation script for Gemini + Google Cloud TTS + Cloud Storage + Firestore, along with `firebase.json` configured for clean URLs and immutable caching.
