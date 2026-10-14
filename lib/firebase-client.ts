"use client";

import type { FirebaseApp } from "firebase/app";
import type { AppCheck } from "firebase/app-check";
import type { WordDocument } from "./types";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let appPromise: Promise<FirebaseApp | null> | null = null;
let appCheck: AppCheck | null = null;

/**
 * Lazily initializes the Firebase Web SDK plus App Check (reCAPTCHA v3).
 * Nothing is downloaded until a feature actually needs Firebase, keeping the trainer bundle small.
 */
export function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === "undefined" || !isFirebaseConfigured) return Promise.resolve(null);
  appPromise ??= (async () => {
    const { initializeApp, getApps } = await import("firebase/app");
    const app = getApps()[0] ?? initializeApp(config);
    if (recaptchaSiteKey) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
    return app;
  })();
  return appPromise;
}

/** Optional client-side read of a word document (e.g. to pick up content updates between deploys). */
export async function fetchWordClient(slug: string): Promise<WordDocument | null> {
  const app = await getFirebaseApp();
  if (!app) return null;
  const { getFirestore, doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(getFirestore(app), "words", slug));
  return snap.exists() ? (snap.data() as WordDocument) : null;
}

/** Returns true when App Check issues a valid reCAPTCHA v3 token (an extra proof-of-humanity signal). */
export async function verifyAppCheck(): Promise<boolean | null> {
  const app = await getFirebaseApp();
  if (!app || !appCheck) return null;
  try {
    const { getToken } = await import("firebase/app-check");
    const token = await getToken(appCheck, false);
    return Boolean(token.token);
  } catch {
    return false;
  }
}
