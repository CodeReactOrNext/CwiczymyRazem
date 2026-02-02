import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_MESSAGEINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APPID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DATABASEURL,
};

// Safety check for build environment without valid API key
const isConfigValid = !!firebaseConfig.apiKey;

export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(isConfigValid ? firebaseConfig : { ...firebaseConfig, apiKey: "dummy-key-for-build" });

export const messaging = async () => {
  const { getMessaging, isSupported } = await import("firebase/messaging");
  const supported = await isSupported();
  if (supported) {
    return getMessaging(firebaseApp);
  }
  return null;
};
