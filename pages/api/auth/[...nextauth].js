import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../../../utils/firebase/client/firebase.config.ts";

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_ID,
      clientSecret: process.env.DISCORD_SECRET,
    }),
  ],
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  },
  // adapter: FirestoreAdapter(firestore),
  adaper: FirestoreAdapter({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APIKEY,
    appId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APPID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_AUTHDOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROJECTID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_CONFIG_MESSAGEINGSENDERID,
  }),
};

export default NextAuth(authOptions);
