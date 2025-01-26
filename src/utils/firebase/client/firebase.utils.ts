import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
import type { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import { getCurrentSeason } from "feature/leadboard/services/getCurrentSeason";
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
  updateEmail,
  updatePassword,
  updateProfile,
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
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import type {
  StatisticsDataInterface,
} from "types/api.types";
import { shuffleUid } from "utils/user/shuffleUid";

import { firebaseApp } from "./firebase.cofig";
import type {
  FirebaseEventsInteface,
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

export const firebaseGetEvents = async () => {
  const eventsDocRef = collection(db, "events");
  const eventsDoc = await getDocs(eventsDocRef);
  const eventsArr: FirebaseEventsInteface[] = [];
  eventsDoc.forEach((doc) => {
    const event = doc.data() as FirebaseEventsInteface;
    eventsArr.push(event);
  });
  return eventsArr;
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

export const firebaseRestartUserStats = async () => {
  if (auth.currentUser) {
    const userDocRef = doc(db, "users", auth.currentUser?.uid!);
    await updateDoc(userDocRef, { statistics });
  }
};

export const firebaseUpdateUserDisplayName = async (
  userAuth: string,
  newDisplayName: string
) => {
  const userDocRef = doc(db, "users", userAuth);
  if (auth.currentUser) {
    updateProfile(auth.currentUser, { displayName: newDisplayName }).catch(
      (error) => new Error(error)
    );
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

export const firebaseUploadAvatar = async (image: Blob) => {
  if (!image) return;
  const imageRef = ref(
    storage,
    `avatars/${shuffleUid(auth.currentUser?.uid!)}`
  );
  const data = await uploadBytes(imageRef, image);
  const fullPath = data.metadata.fullPath;
  const avatarRef = ref(storage, fullPath);
  const avatarUrl = await getDownloadURL(avatarRef);
  await firebaseUpdateUserDocument("avatar", avatarUrl);
  return { avatar: avatarUrl };
};

export const firebaseUpdateBand = async (band: string) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, { band: band });
};

export const firebaseUpdateYouTubeLink = async (youtubeLink: string) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, { youTubeLink: youtubeLink });
};

export const firebaseUpdateSoundCloudLink = async (soundCloudLink: string) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, { soundCloudLink: soundCloudLink });
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
        habitCount: userData.habitsCount || 0,
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


export const updateSeasonalStats = async (
  userId: string,
  stats: StatisticsDataInterface,
  sessionTime: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  pointsGained: number
) => {
  const season = await getCurrentSeason();
  const userSeasonRef = doc(db, "seasons", season.seasonId, "users", userId);
  const userSeasonDoc = await getDoc(userSeasonRef);

  // Get user data to ensure we have displayName and avatar
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const currentSeasonData = userSeasonDoc.exists()
    ? userSeasonDoc.data()
    : {
        points: 0,
        sessionCount: 0,
        time: {
          creativity: 0,
          hearing: 0,
          technique: 0,
          theory: 0,
          longestSession: 0,
        },
        achievements: [],
      };

  const updatedSeasonData = {
    ...currentSeasonData,
    points: (currentSeasonData.points || 0) + pointsGained,
    sessionCount: (currentSeasonData.sessionCount || 0) + 1,
    time: {
      creativity:
        (currentSeasonData.time?.creativity || 0) +
        (sessionTime.creativityTime || 0),
      hearing:
        (currentSeasonData.time?.hearing || 0) + (sessionTime.hearingTime || 0),
      technique:
        (currentSeasonData.time?.technique || 0) +
        (sessionTime.techniqueTime || 0),
      theory:
        (currentSeasonData.time?.theory || 0) + (sessionTime.theoryTime || 0),
      longestSession: Math.max(
        currentSeasonData.time?.longestSession || 0,
        sessionTime.sumTime || 0
      ),
    },
    achievements: stats.achievements || [],
    lvl: stats.lvl || 1,
    lastReportDate: stats.lastReportDate || new Date().toISOString(),
    displayName: userData?.displayName || "Unknown User",
    avatar: userData?.avatar || "",
    seasonId: season.seasonId,
  };

  console.log("Updating seasonal stats:", {
    currentPoints: currentSeasonData.points || 0,
    pointsGained,
    newTotalPoints: updatedSeasonData.points,
    sessionTime,
  });

  await setDoc(userSeasonRef, updatedSeasonData, { merge: true });
};

export const firebaseUpdateUserStats = async (
  userAuth: string,
  statistics: StatisticsDataInterface,
  sessionTime: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  pointsGained: number
) => {
  const userDocRef = doc(db, "users", userAuth);
  await Promise.all([
    updateDoc(userDocRef, { statistics }),
    updateSeasonalStats(userAuth, statistics, sessionTime, pointsGained),
  ]);
};




export const updateGuitarStartDate = async (date: Date) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    guitarStartDate: Timestamp.fromDate(date),
  });
};
