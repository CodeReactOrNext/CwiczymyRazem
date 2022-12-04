import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { User } from "firebase/auth";

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

export const signInWithGooglePopup = () => signInWithPopup(auth, provider);
export const auth = getAuth();
export const db = getFirestore();

export const createUserDocumentFromAuth = async (userAuth: User) => {
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
        statistics: {
          time: {
            technique: 0,
            theory: 0,
            hearing: 0,
            creativity: 0,
            longestSession: 0,
          },
          lvl: 0,
          points: 0,
          sesionCount: 0,
          habitsCount: 0,
          dayWithoutBreak: 0,
          achivments: [],
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  return userAuth.uid;
};

export const getUserData = async (userAuth: User) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return JSON.parse(userSnapshot.data().statistics);
};

// export const setUserDataSkills = async (userAuth, data) => {
//   console.log(data);

//   const userDocRef = doc(db, "users", userAuth);
//   const skillsData = JSON.stringify(data);

//   await updateDoc(userDocRef, {
//     skillsData,
//   });
// };
