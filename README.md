# TH Master: Domina la TH en inglés

Minimalist, ultra-fast, programmatic-SEO micro-app that teaches **Spanish speakers** to pronounce the English **TH**
sounds (/θ/ *thirty*, /ð/ *weather*). All voice evaluation runs **100% client-side**, and the site is a static export
on Firebase Hosting. Monthly cost: **$0**.

The full product and architecture spec is in [MASTER_PROMPT_PRONUNCIATION_APP.md](./MASTER_PROMPT_PRONUNCIATION_APP.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000, works offline with lib/fallback-words.ts
npm test           # unit tests for scoring engines, audio math, progress, seed data
npm run build      # static export → out/
```

The microphone requires a secure context (`localhost` or HTTPS).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack). |
| `npm run build` | Static export (`output: 'export'`) into `out/`. |
| `npm start` | Serves `out/` locally (`npx serve`). |
| `npm run lint` / `npm run typecheck` | ESLint / route typegen + `tsc`. |
| `npm test` | Node test runner (`node --test` via `tsx`). |
| `npm run seed` | Content pipeline: Gemini, Cloud TTS, Cloud Storage, Firestore (see below). |
| `npm run deploy` | Build + `firebase deploy --only hosting`. |

## Architecture

```text
app/                       Routes (all statically prerendered)
  pronunciar/[word]/       SSG word pages: generateStaticParams + generateMetadata + JSON-LD
  privacidad|terminos|cookies|contacto/   AdSense-compliance pages
  sitemap.ts, robots.ts, ads.txt/route.ts
components/trainer/        PronunciationTrainer (4 phases), MouthAnatomySVG, WaveformCanvas,
                           SyllableChunker, ShadowingChallenge, FeedbackBadge
components/seo/            WordSeoArticle (below the fold), JsonLdSchema (FAQPage + LearningResource)
components/ads/            SafeAdSlot (gated, CLS-safe), GatedScripts (AdSense + GA4 loader)
hooks/                     useVoiceEvaluator, useProgressStore, useSentenceShadowing, useHumanGate
lib/                       evaluation.ts (scoring engines), audio-analysis.ts (shared with seeder),
                           fallback-words.ts (10 MVP words), words.ts (Firestore/fallback repo),
                           firebase-admin.ts, firebase-client.ts (App Check), human-gate.ts, progress.ts
scripts/seed-words.ts      Offline content seeder
tests/                     Unit tests
```

### Dual-engine evaluation (`hooks/useVoiceEvaluator.ts` + `lib/evaluation.ts`)

- **Engine A: phonetic trap matcher.** `SpeechRecognition` (`en-US`, `interimResults`, `maxAlternatives: 5`).
  Alternatives are checked against the word plus `acceptedTranscripts` (for example `"30"` or homophones like
  *whether*), then against `commonMispronunciations`. A trap returns its specific Spanish correction tip.
- **Engine B: acoustic friction analyzer.** `AnalyserNode` FFT frames measure power in the word's
  `targetFrequencyHz` band (4–8 kHz for /θ/) against a sub-500 Hz band and vowel formants. The analyzer detects:
  - friction duration at the TH position (initial or final)
  - abrupt plosive onsets (Spanish /t/ or /d/)
  - closure gaps for medial /ð/ ("wedder")
  - envelope correlation with the 48-bar reference waveform, plus duration alignment

  This engine works alone on iOS Safari and in-app browsers.
- **Combined score:** 60% speech + 40% acoustic when both engines are available. A detected trap caps the score
  at 55. Passing is ≥ 80%, which records mastery and shows the next-word CTA. Scores are estimates, not
  certification of pronunciation quality.
- **Recognition celebration:** a small confetti burst celebrates a final first-choice transcript matching the
  whole target or an accepted equivalent (such as "30"), regardless of score. It fires once per word per trainer
  visit and respects reduced motion. Retries still show the recognition message and a separate practice tip.
  Lower-ranked matches, trap-first results, interim-only transcripts and acoustic-only attempts do not trigger it.

Detector thresholds live in `ACOUSTIC_CONFIG` in [lib/evaluation.ts](./lib/evaluation.ts). They were validated
with synthetic signals (unit tests plus an in-browser synthetic microphone). Tune them with real recordings before
launch.

### Anti-bot and AdSense protection

[lib/human-gate.ts](./lib/human-gate.ts) only allows ads and analytics after a **trusted** pointer, touch, key or
wheel event, or a trainer action, **and** only when no bot signals are found:

- `navigator.webdriver`
- headless user agent
- no `audioinput` devices
- failed App Check token, when reCAPTCHA v3 is configured

The AdSense library, GA4 and `adsbygoogle.push` are injected only after that gate passes. The
`google-adsense-account` meta tag is always present so AdSense can verify the site.

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional for local development.

- **AdSense:** set `NEXT_PUBLIC_ADSENSE_CLIENT` and the slot IDs. `ads.txt` is generated from the client ID.
- **Site URL:** set `NEXT_PUBLIC_SITE_URL` for canonical URLs, the sitemap and JSON-LD.
- **Firestore as source of truth at build time:** set `WORDS_SOURCE=firestore` plus `GOOGLE_APPLICATION_CREDENTIALS`
  or `FIREBASE_SERVICE_ACCOUNT_JSON`. Invalid or missing data falls back to the offline seed.

## Content seeder (`npm run seed`)

```bash
npm run seed                          # 10 MVP words: Gemini 2.5 Flash, TTS, Storage, Firestore
npm run seed -- thumb thirsty         # new words
npm run seed -- --content=fallback    # keep curated offline content; only generate audio and waveforms
npm run seed -- --dry-run             # write JSON + MP3 to scripts/.seed-output, no GCP writes
```

The seeder needs `GEMINI_API_KEY`, `GCS_BUCKET_NAME` and Google credentials with Text-to-Speech, Storage and
Firestore access. For each word it:

1. Gets structured JSON from Gemini (`responseJsonSchema`).
2. Synthesizes `[slug]-normal.mp3` at 1.0x and `[slug]-slow.mp3` with SSML `<prosody rate="60%">`, plus LINEAR16 PCM.
3. Computes the 48-bar `referenceWaveform` from the PCM.
4. Uploads the MP3s with `Cache-Control: public, max-age=31536000, immutable`. Stored URLs carry a `?v=<hash>`
   query to bust caches.
5. Validates the document and upserts `words/{slug}`.

Until real MP3s exist, the trainer falls back to the browser's English TTS voice at 1.0x and 0.6x.

## Deploy (Firebase Hosting + Cloudflare)

1. `cp .firebaserc.example .firebaserc` and set your project ID.
2. Deploy the rules: `firebase deploy --only firestore:rules,storage`. Both are read-only for the public, and writes
   happen only through the Admin SDK.
3. Deploy the site: `npm run deploy`. [firebase.json](./firebase.json) sets `cleanUrls`, immutable caching for
   `/_next/static`, a strict CSP that allows only Google ads, analytics and Firebase origins, and
   `Permissions-Policy: microphone=(self)`.
4. Cloudflare: add the custom domain to Firebase Hosting, then proxy DNS through Cloudflare. Use SSL mode
   **Full (strict)**, enable the WAF managed rules and Bot Fight Mode, and allow-list verified bots so Googlebot and
   the AdSense crawler can still fetch pages.

## Implementation notes

- `cacheComponents` (the scaffold default in Next 16) is disabled. This MVP is a pure static export.
  `dynamicParams = false` restricts routes to known slugs.
- `WordDocument` gained one optional field, `acceptedTranscripts`, so digits ("30") and homophones
  (*whether*/*weather*, *threw*/*through*) are not marked wrong.
- In the spec's word list, the typo "bread,ann" for *breath* was interpreted as the traps *bread*, *breathe* and
  *bret*.
