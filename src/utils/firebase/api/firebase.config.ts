import * as admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
      console.log("[Firebase Admin] Initialized with service account JSON");
      return;
    } catch (e) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  // Fallback: dummy init for build time
  console.warn("[Firebase Admin] No FIREBASE_SERVICE_ACCOUNT_JSON — using dummy credentials (calls will fail)");
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "dummy-project-id",
        clientEmail: "dummy@example.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7Uz9X9X9X9X9X\n-----END PRIVATE KEY-----\n",
      }),
      databaseURL: "https://dummy.firebaseio.com",
    });
  } catch {}
}

initializeFirebaseAdmin();

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

const getMessaging = () => {
  try {
    return admin.messaging();
  } catch {
    return {} as any;
  }
};

const firestore = getFirestore();
const auth = getAuth();
const messaging = getMessaging();
export { auth, firestore, messaging };
