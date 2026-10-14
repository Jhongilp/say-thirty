import type { App } from "firebase-admin/app";

/**
 * Lazily initializes the Firebase Admin SDK (build time / seeder only — never shipped to the browser).
 * Credentials: FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON) or GOOGLE_APPLICATION_CREDENTIALS (file path / ADC).
 */
export async function getAdminApp(): Promise<App> {
  const { getApps, initializeApp, cert, applicationDefault } = await import("firebase-admin/app");
  const existing = getApps();
  if (existing.length) return existing[0];

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = inline ? cert(JSON.parse(inline)) : applicationDefault();
  return initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.GCS_BUCKET_NAME || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export async function getAdminFirestore() {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(await getAdminApp());
}

export async function getAdminBucket() {
  const { getStorage } = await import("firebase-admin/storage");
  return getStorage(await getAdminApp()).bucket();
}

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}
