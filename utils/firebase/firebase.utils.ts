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
  updateProfile,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
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
import { FirebaseUserDataInterface } from "./firebase.types";
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
    const { displayName } = userAuth;
    const createdAt = new Date();
    try {
      await setDoc(userDocRef, {
        displayName,
        createdAt,
        statistics,
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

export const firebaseGetUserName = async () => {
  const displayName = auth.currentUser?.displayName;
  return displayName as string;
};

export const firebaseSetUserExerciseRaprot = async (
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

  await updateDoc(userDocRef, { statistics });
};

export const firebaseUpdateUserDisplayName = async (
  userAuth: string,
  newDisplayName: string
) => {
  const userDocRef = doc(db, "users", userAuth);
  if (auth.currentUser) {
    updateProfile(auth.currentUser, { displayName: newDisplayName })
      .then(() => {
        console.log("Updated Name!");
      })
      .catch((error) => console.log(error));
  }
  await updateDoc(userDocRef, { displayName: newDisplayName });
};

export const firebaseUpdateUserEmail = async (newEmail: string) => {
  if (auth.currentUser) {
    return updateEmail(auth.currentUser, newEmail);
  }
};
export const firebaseUpdateUserPassword = async (newPassword: string) => {
  if (auth.currentUser) {
    return updatePassword(auth.currentUser, newPassword);
  }
};

export const firebaseGetUsersExceriseRaprot = async () => {
  const usersDocRef = await getDocs(collection(db, "users"));
  const userStatsArr: FirebaseUserDataInterface[] = [];
  usersDocRef.forEach((doc) => {
    const currentUserStats = doc.data() as FirebaseUserDataInterface;
    userStatsArr.push(currentUserStats);
  });
  return userStatsArr;
};

export const firebaseGetUserProviderData = async () => {
  const providerData = auth.currentUser?.providerData[0];
  if (providerData) {
    return providerData;
  }
  return {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    phoneNumber: null,
    photoURL: null,
  };
};

export const firebaseReauthenticateUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = auth.currentUser;
  if (user && email) {
    const credential = EmailAuthProvider.credential(email, password);

    return await reauthenticateWithCredential(user, credential);
  }
  return null;
};
