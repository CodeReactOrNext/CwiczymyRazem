import { AchievementList } from "data/achievements";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
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
  orderBy,
  limit,
  query,
} from "firebase/firestore";
import {
  FirebaseLogsInterface,
  FirebaseUserDataInterface,
} from "./firebase.types";
import {
  statistics,
  StatisticsDataInterface,
} from "./userStatisticsInitialData";
import { decodeUid } from "helpers/decodeUid";
import { encodeUid } from "helpers/encodeUid";
import { toast } from "react-toastify";

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
export const storage = getStorage(firebaseApp);

export const firebaseSignInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseCreateAccountWithEmail = (
  email: string,
  password: string
) => createUserWithEmailAndPassword(auth, email, password);

export const firebaseCreateUserDocumentFromAuth = async (userAuth: User) => {
  const encodedUid = encodeUid(userAuth.uid);
  const userDocRef = doc(db, "users", encodedUid);
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
  return encodedUid;
};

export const firebaseLogUserOut = async () => {
  return await signOut(auth);
};

export const firebaseGetUserData = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.statistics;
};

export const firebaseGetUserDocument = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  const userData = userSnapshot.data();
  return userData;
};

export const firebaseGetLogs = async () => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("data", "desc"), limit(20));
  const logsDoc = await getDocs(sortLogs);
  const logsArr: FirebaseLogsInterface[] = [];
  logsDoc.forEach((doc) => {
    const log = doc.data() as FirebaseLogsInterface;
    logsArr.push(log);
  });
  return logsArr;
};

export const firebaseGetUserName = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.displayName;
};

export const firebaseGetUserAvatarURL = async () => {
  const userDocRef = doc(db, "users", encodeUid(auth.currentUser?.uid!));
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.avatar;
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

export const firebaseAddLogReport = async (
  userAuth: string,
  data: string,
  points: number,
  newAchievements: AchievementList[],
  newLevel: { isNewLevel: boolean; level: number }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  await setDoc(logsDocRef, {
    data,
    userName,
    points,
    newAchievements,
    newLevel,
  });
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

export const firebaseGetUsersExceriseRaport = async () => {
  const usersDocRef = await getDocs(collection(db, "users"));

  const usersDataArr: FirebaseUserDataInterface[] = [];
  usersDocRef.forEach((doc) => {
    let currentUserData = doc.data() as FirebaseUserDataInterface;
    currentUserData.profileId = doc.id;
    usersDataArr.push(currentUserData);
  });
  return usersDataArr;
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

export const firebaseUploadAvatar = async (image: Blob) => {
  if (!image) return;
  const imageRef = ref(storage, `avatars/${encodeUid(auth.currentUser?.uid!)}`);
  const data = await uploadBytes(imageRef, image);
  const fullPath = data.metadata.fullPath;
  const avatarRef = ref(storage, fullPath);
  const avatarUrl = await getDownloadURL(avatarRef);
  await firebaseUpdateUserDocument("avatar", avatarUrl);
  return { avatar: avatarUrl };
};

export const firebaseUpdateUserDocument = async (
  key: string,
  value: string
) => {
  const userDocRef = doc(db, "users", encodeUid(auth.currentUser?.uid!));
  await updateDoc(userDocRef, { [key]: value });
};
