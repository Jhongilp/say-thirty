/**
 * TH Master content seeder — run locally with `npm run seed` (never deployed).
 *
 *   npm run seed                                  # the 10 MVP words, content from Gemini
 *   npm run seed -- thirsty thumb                  # custom words (appended after the MVP order)
 *   npm run seed -- --content=fallback             # reuse lib/fallback-words.ts content, only TTS + upload
 *   npm run seed -- --dry-run                      # write JSON + MP3s to scripts/.seed-output, no GCP writes
 *
 * Pipeline per word: Gemini 2.5 Flash (structured JSON) → Cloud TTS (1.0x MP3, 0.6x SSML MP3, LINEAR16 PCM)
 * → 48-bar waveform from PCM → Cloud Storage upload (immutable cache) → Firestore upsert `words/{slug}`.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { computeWaveformPeaks, decodeWavPcm16 } from "../lib/audio-analysis";
import { FALLBACK_WORDS } from "../lib/fallback-words";
import { getAdminBucket, getAdminFirestore } from "../lib/firebase-admin";
import type { PhonemeType, WordDocument } from "../lib/types";
import { validateWordDocument } from "../lib/word-validation";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const MVP_WORDS = ["thirty", "thirteen", "through", "though", "thought", "weather", "whether", "bath", "breath", "strength"];
const FREQUENCY_BANDS: Record<PhonemeType, [number, number]> = {
  "th-unvoiced": [4000, 8000],
  "th-voiced": [3000, 7000],
  "th-cluster": [4000, 8000],
  "ough-trap": [4000, 8000],
};
const OUTPUT_DIR = path.join(process.cwd(), "scripts", ".seed-output");
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const contentArg = args.find((a) => a.startsWith("--content="))?.split("=")[1] ?? "gemini";
const dryRun = flags.has("--dry-run");
const words = args.filter((a) => !a.startsWith("--"));
const targetWords = words.length ? words : MVP_WORDS;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
}

const slugify = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ------------------------------------------------------------------ */
/* 1–2. Gemini structured content                                      */
/* ------------------------------------------------------------------ */

type GeneratedContent = Omit<WordDocument, "slug" | "audioNormalUrl" | "audioSlowUrl" | "referenceWaveform" | "orderIndex" | "targetFrequencyHz">;

const str = { type: "string" };
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    word: { ...str, description: "Display word, capitalized (e.g. 'Thirty')" },
    translationEs: { ...str, description: "Spanish translation, e.g. 'Treinta (30)'" },
    ipa: { ...str, description: "General American IPA between slashes, e.g. /ˈθɜːrti/" },
    phoneticRespellingEs: { ...str, description: "Spanish-friendly respelling with stress in caps, e.g. 'ZÉR-ti (con lengua entre dientes)'" },
    difficulty: { type: "string", enum: ["Básico", "Intermedio", "Avanzado"] },
    phonemeType: { type: "string", enum: ["th-unvoiced", "th-voiced", "th-cluster", "ough-trap"] },
    anatomicalTipEs: { ...str, description: "1–2 sentence actionable tongue/teeth/airflow instruction in Spanish" },
    chunks: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: { label: str, ipa: str, hintEs: str },
        required: ["label", "ipa", "hintEs"],
      },
    },
    commonMispronunciations: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          heardWord: { ...str, description: "Lowercase English word/token a speech recognizer would output for the mistake" },
          errorType: { ...str, description: "Short Spanish label including the substituted IPA, e.g. 'Oclusión dental (/d/)'" },
          correctionTipEs: str,
        },
        required: ["heardWord", "errorType", "correctionTipEs"],
      },
    },
    acceptedTranscripts: {
      type: "array",
      items: str,
      description: "Lowercase transcripts that count as correct: homophones, digits (e.g. '30'), common spellings",
    },
    shadowingSentence: {
      type: "object",
      properties: { english: str, spanish: str, ipa: str },
      required: ["english", "spanish", "ipa"],
    },
    seo: {
      type: "object",
      properties: {
        metaTitle: { ...str, description: "Spanish, max 65 characters" },
        metaDescription: { ...str, description: "Spanish, 140–160 characters" },
        h1: { ...str, description: "Spanish, e.g. 'Cómo pronunciar «Thirty» en inglés'" },
        article: {
          type: "object",
          properties: {
            whyIsItHardEs: { ...str, description: "150–200 words in Spanish on the phonetic clash with Spanish" },
            comparisonTitleEs: str,
            comparisonBodyEs: { ...str, description: "80–120 words in Spanish comparing the word with its main trap" },
            faqs: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: { type: "object", properties: { question: str, answer: str }, required: ["question", "answer"] },
            },
          },
          required: ["whyIsItHardEs", "comparisonTitleEs", "comparisonBodyEs", "faqs"],
        },
      },
      required: ["metaTitle", "metaDescription", "h1", "article"],
    },
  },
  required: [
    "word",
    "translationEs",
    "ipa",
    "phoneticRespellingEs",
    "difficulty",
    "phonemeType",
    "anatomicalTipEs",
    "chunks",
    "commonMispronunciations",
    "acceptedTranscripts",
    "shadowingSentence",
    "seo",
  ],
};

function buildPrompt(word: string): string {
  return `You are an expert English phonetician and SEO copywriter creating content for "TH Master", a free web app
that teaches NATIVE SPANISH SPEAKERS to pronounce difficult English sounds (starting with TH: /θ/ and /ð/).

Target English word: "${word}"

Rules:
- All learner-facing text (translations, tips, hints, SEO, FAQs) MUST be in neutral Spanish (Spain + Latin America). Use «» quotes.
- IPA must be General American, between slashes.
- Explain anatomy concretely: tongue tip position relative to the teeth, continuous vs. blocked airflow, voiced vs. voiceless.
  You may reference the Castilian «z» for /θ/ and the soft intervocalic Spanish «d» (as in «cada») for /ð/.
- "chunks": split the word into practicable phonetic slabs (syllables, or sub-syllabic blocks for one-syllable words like "Th-" + "-rough").
- "commonMispronunciations": the REAL errors Spanish speakers make, expressed as what an en-US speech recognizer would transcribe
  (e.g. "dirty"/"tirty" for "thirty"). Never include correct homophones there; put those in "acceptedTranscripts".
- "shadowingSentence": a natural sentence or tongue twister containing the word, ideally with other TH words.
- SEO article: about 350 words total, original, helpful, not keyword-stuffed (Google AdSense quality standards).`;
}

async function generateWithGemini(ai: GoogleGenAI, word: string): Promise<GeneratedContent> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(word),
        config: { responseMimeType: "application/json", responseJsonSchema: RESPONSE_SCHEMA, temperature: 0.4 },
      });
      const text = response.text;
      if (!text) throw new Error("Empty Gemini response");
      return JSON.parse(text) as GeneratedContent;
    } catch (error) {
      lastError = error;
      console.warn(`  ⚠ Gemini attempt ${attempt} failed for "${word}":`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* 3–4. Text-to-Speech + waveform                                      */
/* ------------------------------------------------------------------ */

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

async function synthesize(tts: TextToSpeechClient, word: string) {
  const voice = {
    languageCode: "en-US",
    name: process.env.TTS_VOICE || "en-US-Neural2-J",
  };
  const text = word.toLowerCase();
  const [[normal], [slow], [pcm]] = await Promise.all([
    tts.synthesizeSpeech({ input: { text }, voice, audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 } }),
    tts.synthesizeSpeech({
      input: { ssml: `<speak><prosody rate="60%">${escapeXml(text)}</prosody></speak>` },
      voice,
      audioConfig: { audioEncoding: "MP3" },
    }),
    tts.synthesizeSpeech({ input: { text }, voice, audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, speakingRate: 1.0 } }),
  ]);
  const toBuffer = (c: Uint8Array | string | null | undefined) => {
    if (!c) throw new Error(`TTS returned no audio for "${word}"`);
    return typeof c === "string" ? Buffer.from(c, "base64") : Buffer.from(c);
  };
  const normalMp3 = toBuffer(normal.audioContent);
  const slowMp3 = toBuffer(slow.audioContent);
  const { samples, sampleRate } = decodeWavPcm16(new Uint8Array(toBuffer(pcm.audioContent)));
  return { normalMp3, slowMp3, referenceWaveform: computeWaveformPeaks(samples, sampleRate) };
}

/* ------------------------------------------------------------------ */
/* 5. Cloud Storage                                                    */
/* ------------------------------------------------------------------ */

async function uploadAudio(fileName: string, data: Buffer): Promise<string> {
  const bucket = await getAdminBucket();
  const file = bucket.file(`audio/${fileName}`);
  await file.save(data, { resumable: false, contentType: "audio/mpeg", metadata: { cacheControl: CACHE_CONTROL } });
  try {
    await file.makePublic();
  } catch {
    // Buckets with uniform bucket-level access need `allUsers: Storage Object Viewer` granted once instead.
  }
  // The content hash busts CDN/browser caches when audio is regenerated (files are cached as immutable).
  const version = createHash("sha256").update(data).digest("hex").slice(0, 10);
  return `https://storage.googleapis.com/${bucket.name}/audio/${encodeURIComponent(fileName)}?v=${version}`;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(`TH Master seeder · ${targetWords.length} word(s) · content=${contentArg}${dryRun ? " · DRY RUN" : ""}`);
  const ai = contentArg === "gemini" ? new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") }) : null;
  const tts = new TextToSpeechClient();
  try {
    // Fail fast (once) on missing/invalid Google credentials instead of per word.
    await tts.initialize();
  } catch (error) {
    throw new Error(
      `Cloud Text-to-Speech client could not authenticate. Check GOOGLE_APPLICATION_CREDENTIALS / gcloud ADC. (${error instanceof Error ? error.message : error})`,
    );
  }
  const db = dryRun ? null : await getAdminFirestore();
  if (dryRun) await mkdir(OUTPUT_DIR, { recursive: true });

  const failures: string[] = [];
  for (const [i, raw] of targetWords.entries()) {
    const slug = slugify(raw);
    console.log(`\n▶ ${slug}`);
    try {
      const fallback = FALLBACK_WORDS.find((w) => w.slug === slug);
      const mvpIndex = MVP_WORDS.indexOf(slug);
      const orderIndex = mvpIndex !== -1 ? mvpIndex + 1 : MVP_WORDS.length + i + 1;

      let content: GeneratedContent;
      if (contentArg === "fallback") {
        if (!fallback) throw new Error(`No offline content for "${slug}" in lib/fallback-words.ts`);
        content = fallback;
      } else {
        content = await generateWithGemini(ai!, raw);
        console.log("  ✓ Gemini content");
      }

      const { normalMp3, slowMp3, referenceWaveform } = await synthesize(tts, raw);
      console.log("  ✓ TTS audio + 48-bar waveform");

      let audioNormalUrl: string;
      let audioSlowUrl: string;
      if (dryRun) {
        await writeFile(path.join(OUTPUT_DIR, `${slug}-normal.mp3`), normalMp3);
        await writeFile(path.join(OUTPUT_DIR, `${slug}-slow.mp3`), slowMp3);
        audioNormalUrl = `${slug}-normal.mp3`;
        audioSlowUrl = `${slug}-slow.mp3`;
      } else {
        [audioNormalUrl, audioSlowUrl] = await Promise.all([
          uploadAudio(`${slug}-normal.mp3`, normalMp3),
          uploadAudio(`${slug}-slow.mp3`, slowMp3),
        ]);
        console.log("  ✓ Uploaded to Cloud Storage");
      }

      const doc: WordDocument = {
        ...content,
        acceptedTranscripts: content.acceptedTranscripts ?? [],
        slug,
        targetFrequencyHz: FREQUENCY_BANDS[content.phonemeType] ?? [4000, 8000],
        audioNormalUrl,
        audioSlowUrl,
        referenceWaveform,
        orderIndex,
      };
      const errors = validateWordDocument(doc);
      if (errors.length) throw new Error(`Invalid document: ${errors.join("; ")}`);

      if (dryRun) {
        await writeFile(path.join(OUTPUT_DIR, `${slug}.json`), JSON.stringify(doc, null, 2));
        console.log(`  ✓ Wrote scripts/.seed-output/${slug}.json`);
      } else {
        await db!.collection("words").doc(slug).set(doc);
        console.log(`  ✓ Upserted Firestore words/${slug}`);
      }
    } catch (error) {
      failures.push(slug);
      console.error(`  ✗ ${slug}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nDone. ${targetWords.length - failures.length} ok, ${failures.length} failed${failures.length ? `: ${failures.join(", ")}` : ""}.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
