import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import {
  trackedGetDocs,
  trackedGetDoc,
  trackedUpdateDoc,
  trackedSetDoc,
  trackedAddDoc
} from "./firestoreTracking";
import { getStorage, } from "firebase/storage";

import { firebaseApp } from "./firebase.cofig";
import type {
  FirebaseUserDataInterface,
} from "./firebase.types";

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",
});

export const auth = getAuth();

export const firebaseSignInWithGooglePopup = () =>
  signInWithPopup(auth, provider);

export const firebaseSignInWithCredential = (credential: any) =>
  signInWithCredential(auth, credential);

export const db = getFirestore(firebaseApp);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => { });
}

export const storage = getStorage(firebaseApp);

export const firebaseSignInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseCreateAccountWithEmail = (
  email: string,
  password: string
) => createUserWithEmailAndPassword(auth, email, password);

export const firebaseLogUserOut = async () => {
  await signOut(auth);
};



const getDocumentAtIndex = async (sortBy: SortByType, index: number) => {
  try {
    // Get the document at the specified index
    const q = query(
      collection(db, "users"),
      orderBy(`statistics.${sortBy}`, "desc"),
      limit(1),
      ...(index > 0 ? [startAfter(index - 1)] : [])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs[0];
  } catch (error) {
    console.error("Error getting document at index:", error);
    return null;
  }
};

export const firebaseGetUserAvatarURL = async () => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data()!.avatar;
};


export const firebaseGetUsersExerciseReport = async (
  sortBy: SortByType,
  itemsPerPage: number,
  lastVisible?: any
) => {
  try {
    let q = query(
      collection(db, "users"),
      orderBy(`statistics.${sortBy}`, "desc"),
      limit(itemsPerPage)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await trackedGetDocs(q);

    const users = querySnapshot.docs.map((doc: any) => ({
      profileId: doc.id,
      ...doc.data(),
    })) as FirebaseUserDataInterface[];

    return {
      users,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: users.length === itemsPerPage,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const firebaseCheckUsersNameIsNotUnique = async (
  displayName: string
) => {
  const q = query(
    collection(db, "users"),
    where("displayName", "==", displayName),
    limit(1)
  );
  const snapshot = await trackedGetDocs(q);
  return !snapshot.empty;
};

export const firebaseGetUserDocument = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data();
  return userData;
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

export const firebaseGetCurrentUser = (): Promise<import("firebase/auth").User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (userAuth) => {
        unsubscribe();
        resolve(userAuth);
      },
      reject
    );
  });
};

export const firebaseUpdateUserDocument = async (
  key: string,
  value: string
) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await trackedUpdateDoc(userDocRef, { [key]: value });
};


export interface UserTooltipData {
  displayName: string;
  avatar: string | null;
  band: string;
  statistics: {
    totalPracticeTime: number;
    totalPoints: number;
    level: number;
    achievements: string[];
    actualDayWithoutBreak: number;
    currentLevelMaxPoints: number;
    dayWithoutBreak: number;
    habitCount: number;
    lastReportDate: string;
    lvl: number;
    maxPoints: number;
    points: number;
    sessionCount: number;
    time: {
      creativity: number;
      hearing: number;
      longestSession: number;
    };
  };
}

export const firebaseGetUserTooltipData = async (
  userId: string
): Promise<UserTooltipData | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await trackedGetDoc(userDocRef);

    if (!userSnapshot.exists()) return null;

    const userData = userSnapshot.data();

    return {
      displayName: userData.displayName,
      avatar: userData.avatar || null,
      band: userData.band,
      statistics: {
        totalPracticeTime:
          userData.statistics.time.creativity +
          userData.statistics.time.hearing +
          userData.statistics.time.technique +
          userData.statistics.time.theory || 0,
        totalPoints: userData.statistics.points || 0,
        level: userData.statistics.lvl || 0,
        achievements: userData.statistics.achievements || [],
        actualDayWithoutBreak: userData.statistics.actualDayWithoutBreak || 0,
        currentLevelMaxPoints: userData.statistics.currentLevelMaxPoints || 0,
        dayWithoutBreak: userData.statistics.dayWithoutBreak || 0,
        habitCount: userData.statistics.habitsCount || 0,
        lastReportDate: userData.statistics.lastReportDate || "",
        lvl: userData.statistics.lvl || 0,
        maxPoints: userData.statistics.maxPoints || 0,
        points: userData.statistics.points || 0,
        sessionCount: userData.statistics.sessionCount || 0,
        time: {
          creativity: userData.statistics.time?.creativity || 0,
          hearing: userData.statistics.time?.hearing || 0,
          longestSession: userData.statistics.time?.longestSession || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching user tooltip data:", error);
    return null;
  }
};

export const canUpgradeSkill = (
  skill: GuitarSkill,
  userSkills: UserSkills,
  cost: number = 1
): boolean => {
  if (!skill) return false;

  if (userSkills.availablePoints[skill.category] < cost) {
    return false;
  }

  return true;
};



export const updateGuitarStartDate = async (date: Date) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    guitarStartDate: Timestamp.fromDate(date),
  });
};
