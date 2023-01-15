import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROJECTID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATEKY!.replace(
        /\\n/g,
        "\n"
      ),
    }),
    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  });
}

const firestore = admin.firestore();
const auth = admin.auth();

export { firestore, auth };
