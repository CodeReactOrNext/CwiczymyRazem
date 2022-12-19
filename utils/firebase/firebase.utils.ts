import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import {
  statistics,
  StatisticsDataInterface,
} from "./userStatisticsInitialData";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_MESSAGEINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_APPID,
};

const firebaseApp = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",
});

export const firebaseSignInWithGooglePopup = () =>
  signInWithPopup(auth, provider);
export const auth = getAuth();
export const db = getFirestore(firebaseApp);

export const firebaseSignInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseCreateAccountWithEmail = (
  email: string,
  password: string
) => createUserWithEmailAndPassword(auth, email, password);

export const firebaseCreateUserDocumentFromAuth = async (userAuth: User) => {
  const userDocRef = doc(db, "users", userAuth.uid);
  const userSnapshot = await getDoc(userDocRef);
  if (!userSnapshot.exists()) {
    const { displayName, email } = userAuth;
    const createdAt = new Date();
    try {
      await setDoc(userDocRef, {
        displayName,
        email,
        createdAt,
        statistics,
        exercisesData: [],
      });
    } catch (error) {
      console.log(error);
    }
  }
  return userAuth.uid;
};

export const firebaseLogUserOut = async () => {
  return await signOut(auth);
};

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.statistics;
};

export const firebaseGetUserName = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.displayName;
};

export const firebaseSetUserExceriseRaprot = async (
  userAuth: string,
  raport: ReportDataInterface,
  date: Date
) => {
  const dateString = date.toISOString();
  const userDocRef = doc(db, "users", userAuth, "exerciseData", dateString);
  await setDoc(userDocRef, raport);
};

export const firebaseUpdateUserStats = async (
  userAuth: string,
  statistics: StatisticsDataInterface
) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  await updateDoc(userDocRef, { statistics });
};

export const firebaseUpdateUserCredentials = async (
  userAuth: string,
  newUserData: { displayName: string; email: string; password: string }
) => {
  const userDocRef = doc(db, "users", userAuth);
  const newName = newUserData.displayName;
  const userSnapshot = await getDoc(userDocRef);
  await updateDoc(userDocRef, { displayName: newName });
};

export const firebaseGetUserExceriseRaprot = async (userAuth: string) => {
  const userDocRef = await getDocs(
    collection(db, "users", userAuth, "exerciseData")
  );
  userDocRef.forEach((doc) => {
    console.log(doc.data().reportDate.toDate());
  });
};
