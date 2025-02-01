import type { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import type { SortByType } from "feature/leadboard/types";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
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

export const db = getFirestore(firebaseApp);
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


export const firebaseGetUsersExceriseRaport = async (
  sortBy: SortByType,
  page: number,
  itemsPerPage: number
) => {
  try {
    let q;

    if (page === 1) {
      // First page query
      q = query(
        collection(db, "users"),
        orderBy(`statistics.${sortBy}`, "desc"),
        limit(itemsPerPage)
      );
    } else {
      // Get the last document from the previous page
      const lastVisibleDoc = await getDocumentAtIndex(
        sortBy,
        (page - 1) * itemsPerPage
      );

      if (!lastVisibleDoc) {
        throw new Error("Could not find the reference document");
      }

      // Query after the last document
      q = query(
        collection(db, "users"),
        orderBy(`statistics.${sortBy}`, "desc"),
        startAfter(lastVisibleDoc),
        limit(itemsPerPage)
      );
    }

    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => ({
      profileId: doc.id,
      ...doc.data(),
    })) as FirebaseUserDataInterface[];

    return {
      users,
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
  const usersDocRef = await getDocs(collection(db, "users"));
  const usersDataArr: FirebaseUserDataInterface[] = [];
  usersDocRef.forEach((doc) => {
    let currentUserData = doc.data() as FirebaseUserDataInterface;
    currentUserData.profileId = doc.id;
    usersDataArr.push(currentUserData);
  });
  return usersDataArr.some((user) => user.displayName === displayName);
};

export const firebaseGetUserDocument = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const userSnapshot = await getDoc(userDocRef);
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

export const firebaseDeleteExercisePlan = async (id: string) => {
  const userAuth = auth.currentUser?.uid;
  if (userAuth) {
    const userDocRef = doc(db, "users", userAuth, "exercisePlan", id);
    await deleteDoc(userDocRef);
  }
};

export const firebaseUploadExercisePlan = async (
  exercise: exercisePlanInterface,
  id?: string
) => {
  const userAuth = auth.currentUser?.uid;
  const exerciseId = new Date().toISOString();
  if (id && userAuth) {
    firebaseDeleteExercisePlan(id);
  }
  if (userAuth) {
    const userDocRef = doc(db, "users", userAuth, "exercisePlan", exerciseId);
    await setDoc(userDocRef, exercise);
    return;
  }
};



export const firebaseGetExercisePlan = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const exercisePlanDocRef = await getDocs(
    collection(userDocRef, "exercisePlan")
  );
  const exercisePlanArr: exercisePlanInterface[] = [];
  exercisePlanDocRef.forEach((doc) => {
    const log = doc.data() as exercisePlanInterface;
    exercisePlanArr.push({ ...log, id: doc.id });
  });
  return exercisePlanArr;
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

export const firebaseGetCurrentUser = async () => {
  return auth.currentUser;
};

export const firebaseUpdateUserDocument = async (
  key: string,
  value: string
) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, { [key]: value });
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
    const userSnapshot = await getDoc(userDocRef);

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
  userSkills: UserSkills
): boolean => {
  if (!skill) return false;

  const pointsCost = 1;

  if (userSkills.availablePoints[skill.category] < pointsCost) {
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
