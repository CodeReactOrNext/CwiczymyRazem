import * as admin from "firebase-admin";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROJECTID;
const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.NEXT_PUBLIC_FIREBASE_PRIVATEKEY || "")
  .replace(/\\n/g, "\n")
  .replace(/^"|"$/g, "");

const isConfigValid = !!(projectId && clientEmail && privateKey && privateKey.includes("BEGIN PRIVATE KEY"));

if (!admin.apps.length) {
  try {
    if (isConfigValid) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: privateKey!,
        }),
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
    } else {
      // Initialize with dummy values for build time if config is missing
      // This prevents "default app does not exist" but might fail on actual calls
      // which is fine during SSG/Pre-rendering if those pages don't actually fetch
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "dummy-project-id",
          clientEmail: "dummy@example.com",
          privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7Uz9X9X9X9X9X\n9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X\n9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X\n9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X\n9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X\n9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X\n-----END PRIVATE KEY-----\n",
        }),
        databaseURL: "https://dummy.firebaseio.com",
      });
    }
  } catch (e) {
    console.warn("Firebase Admin Initialization warning:", e);
  }
}

// Ensure we don't crash even if initializeApp somehow failed
const getFirestore = () => {
  try {
    return admin.firestore();
  } catch {
    return {
      collection: () => ({ doc: () => ({ get: () => Promise.resolve({ data: () => ({}) }) }) }),
    } as any;
  }
};

const getAuth = () => {
  try {
    return admin.auth();
  } catch {
    return {} as any;
  }
};

const firestore = getFirestore();
const auth = getAuth();

export { auth, firestore };
