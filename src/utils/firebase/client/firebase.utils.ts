import type { AchievementList } from "assets/achievements/achievementsData";
import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
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
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import type {
  SeasonDataInterface,
  StatisticsDataInterface,
} from "types/api.types";
import { formatDiscordMessage } from "utils/discord/formatDiscordMessage";
import { sendDiscordMessage } from "utils/firebase/client/discord.utils";
import { shuffleUid } from "utils/user/shuffleUid";

import { firebaseApp } from "./firebase.cofig";
import type {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsSongsStatuses,
  FirebaseUserDataInterface,
  FirebaseUserExceriseLog,
  Song,
  SongStatus,
} from "./firebase.types";

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

export const firebaseLogUserOut = async () => {
  await signOut(auth);
};

export const firebaseGetLogs = async () => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("data", "desc"), limit(20));
  const logsDoc = await getDocs(sortLogs);
  const logsArr: (FirebaseLogsInterface | FirebaseLogsSongsInterface)[] = [];
  logsDoc.forEach((doc) => {
    const log = doc.data() as
      | FirebaseLogsInterface
      | FirebaseLogsSongsInterface;
    logsArr.push(log);
  });
  return logsArr;
};

export const firebaseAddSongsLog = async (
  uid: string,
  data: string,
  songTitle: string,
  songArtist: string,
  status: FirebaseLogsSongsStatuses,
  difficulty_rate?: number | undefined
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  const logData = {
    data,
    uid,
    userName,
    songTitle,
    songArtist,
    status,
  };

  await setDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage({
      ...logData,
      difficulty_rate,
    });
    await sendDiscordMessage(discordMessage as any);
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
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

export const firebaseGetUserRaprotsLogs = async (userAuth: string) => {
  const userDocRef = doc(db, "users", userAuth);
  const exerciseDocRef = await getDocs(collection(userDocRef, "exerciseData"));
  const exerciseArr: FirebaseUserExceriseLog[] = [];
  exerciseDocRef.forEach((doc) => {
    const log = doc.data() as FirebaseUserExceriseLog;
    exerciseArr.push(log);
  });
  return exerciseArr;
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

export const getTotalUsersCount = async () => {
  const coll = collection(db, "users");
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
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
export const firebaseDeleteExercisePlan = async (id: string) => {
  const userAuth = auth.currentUser?.uid;
  if (userAuth) {
    const userDocRef = doc(db, "users", userAuth, "exercisePlan", id);
    await deleteDoc(userDocRef);
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

export const getDocumentAtIndex = async (sortBy: SortByType, index: number) => {
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

export const checkSongExists = async (title: string, artist: string) => {
  try {
    const songsRef = collection(db, "songs");
    const q = query(
      songsRef,
      where("title", "==", title),
      where("artist", "==", artist)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking for duplicate song:", error);
    throw error;
  }
};

export const addSong = async (
  title: string,
  artist: string,
  userId: string
) => {
  try {
    // Check for duplicate song first
    const exists = await checkSongExists(title, artist);
    if (exists) {
      throw new Error("song_already_exists");
    }

    const songsRef = collection(db, "songs");
    const newSong = {
      title,
      artist,
      createdAt: Timestamp.now(),
      createdBy: userId,
      difficulties: [],
    };

    const docRef = await addDoc(songsRef, newSong);
    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "added"
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding song:", error);
    throw error;
  }
};

export const rateSongDifficulty = async (
  songId: string,
  userId: string,
  rating: number,
  title: string,
  artist: string
) => {
  try {
    const songRef = doc(db, "songs", songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error("Song not found");
    }

    const song = songDoc.data() as Song;
    const difficulties = song.difficulties || [];

    // Remove existing rating by this user if it exists
    const filteredDifficulties = difficulties.filter(
      (d) => d.userId !== userId
    );

    // Add new rating
    const newDifficulties = [
      ...filteredDifficulties,
      {
        userId,
        rating,
        date: Timestamp.now(),
      },
    ];

    await updateDoc(songRef, {
      difficulties: newDifficulties,
    });
    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "difficulty_rate",
      rating
    );
  } catch (error) {
    console.error("Error rating song:", error);
    throw error;
  }
};

export const updateSongStatus = async (
  userId: string,
  songId: string,
  title: string,
  artist: string,
  status: SongStatus
) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = doc(userDocRef, "userSongs", songId);

  try {
    await setDoc(userSongsRef, {
      songId,
      status,
      title,
      artist,
      lastUpdated: Timestamp.now(),
    });

    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      status
    );
    return true;
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};

export const getUserSongs = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = collection(userDocRef, "userSongs");

  try {
    const userSongsSnapshot = await getDocs(userSongsRef);
    const songLists = {
      wantToLearn: [] as Song[],
      learning: [] as Song[],
      learned: [] as Song[],
      lastUpdated: Timestamp.now(),
    };

    // Get all songs and their statuses
    const userSongs = userSongsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.data().songId,
    }));

    // Organize songs by status
    userSongs.forEach((song: { status?: SongStatus } & { id: any }) => {
      if (song.status === "wantToLearn")
        songLists.wantToLearn.push(song as Song);
      if (song.status === "learning") songLists.learning.push(song as Song);
      if (song.status === "learned") songLists.learned.push(song as Song);
    });

    return songLists;
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};

// Helper function to get current status of a song for a user
export const getUserSongStatus = async (userId: string, songId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSongRef = doc(userDocRef, "userSongs", songId);

  try {
    const userSongDoc = await getDoc(userSongRef);
    if (!userSongDoc.exists()) return null;

    return userSongDoc.data().status as SongStatus;
  } catch (error) {
    console.error("Error getting song status:", error);
    throw error;
  }
};

export const removeUserSong = async (userId: string, songId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSongRef = doc(userDocRef, "userSongs", songId);
    const songRef = doc(db, "songs", songId);

    const songDoc = await getDoc(songRef);
    const songData = songDoc.exists() ? songDoc.data() : null;

    await deleteDoc(userSongRef);

    if (songData) {
      firebaseAddSongsLog(
        userId,
        new Date().toISOString(),
        songData.title,
        songData.artist,
        "removed" as SongStatus
      );
    }

    return true;
  } catch (error) {
    console.error("Error removing song:", error);
    throw error;
  }
};

export const firebaseGetLogsStream = (
  callback: (
    logs: (FirebaseLogsInterface | FirebaseLogsSongsInterface)[]
  ) => void
) => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("data", "desc"), limit(20));

  // Return the unsubscribe function
  return onSnapshot(sortLogs, (snapshot) => {
    const logsArr: (FirebaseLogsInterface | FirebaseLogsSongsInterface)[] = [];
    snapshot.forEach((doc) => {
      const log = doc.data() as
        | FirebaseLogsInterface
        | FirebaseLogsSongsInterface;
      logsArr.push(log);
    });
    callback(logsArr);
  });
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

export const getCurrentSeason = async () => {
  try {
    const now = new Date();
    const seasonId = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const seasonRef = doc(db, "seasons", seasonId);
    const seasonDoc = await getDoc(seasonRef);

    if (!seasonDoc.exists()) {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const seasonData = {
        seasonId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
        name: `Season ${seasonId}`,
      };

      await setDoc(seasonRef, seasonData);
      return seasonData;
    }

    return { seasonId, ...seasonDoc.data() };
  } catch (error) {
    throw error;
  }
};

// Get all available seasons
export const getAvailableSeasons = async () => {
  const seasonsRef = collection(db, "seasons");
  const seasonsSnapshot = await getDocs(seasonsRef);
  const seasons: SeasonDataInterface[] = [];

  seasonsSnapshot.forEach((doc) => {
    seasons.push(doc.data() as SeasonDataInterface);
  });

  return seasons.sort((a, b) => b.startDate.localeCompare(a.startDate));
};

// Get seasonal leaderboard
export const getSeasonalLeaderboard = async (
  seasonId: string,
  sortBy: SortByType,
  page: number,
  itemsPerPage: number
) => {
  console.log("🔵 getSeasonalLeaderboard called:", { seasonId, sortBy, page });
  try {
    const seasonalUsersRef = collection(db, "seasons", seasonId, "users");

    // First get total count
    const totalSnapshot = await getCountFromServer(seasonalUsersRef);
    const total = totalSnapshot.data().count;
    console.log("✅ Total users in season:", total);

    if (total === 0) {
      console.log("⚠️ No users found in season");
      return { users: [], totalUsers: 0 };
    }

    // Create query - sort by the field directly as it's at root level
    const q = query(
      seasonalUsersRef,
      orderBy(sortBy, "desc"),
      limit(itemsPerPage)
    );

    // Get documents
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("Processing user data:", data); // Debug log

      // Transform the data to match FirebaseUserDataInterface
      return {
        profileId: doc.id,
        displayName: data.displayName || "",
        avatar: data.avatar || "",
        statistics: {
          points: data.points || 0,
          sessionCount: data.sessionCount || 0,
          time: {
            creativity: data.time?.creativity || 0,
            hearing: data.time?.hearing || 0,
            technique: data.time?.technique || 0,
            theory: data.time?.theory || 0,
            longestSession: data.time?.longestSession || 0,
          },
          achievements: data.achievements || [],
          lvl: data.lvl || 1,
          lastReportDate: data.lastReportDate || "",
        },
      };
    });

    console.log("✅ Users fetched:", {
      count: users.length,
      firstUser: users[0]?.profileId,
      firstUserStats: {
        points: users[0]?.statistics.points,
        time: users[0]?.statistics.time,
      },
    });

    return {
      users,
      totalUsers: total,
    };
  } catch (error) {
    throw error;
  }
};

// Update user's seasonal stats when they submit a report
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

  // Update only the seasonal stats
  const updatedSeasonData = {
    ...currentSeasonData,
    // Add only the points gained in this session
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

export const awardSeasonalBadges = async (seasonId: string) => {
  const seasonRef = doc(db, "seasons", seasonId);
  const seasonDoc = await getDoc(seasonRef);

  if (!seasonDoc.exists() || !seasonDoc.data().isActive) return;

  const usersRef = collection(db, "seasons", seasonId, "users");
  const topUsers = await getDocs(
    query(usersRef, orderBy("statistics.points", "desc"), limit(3))
  );

  const winners = topUsers.docs.map((doc) => doc.id);
  const badges = ["season_first", "season_second", "season_third"];

  for (let i = 0; i < winners.length; i++) {
    const userRef = doc(db, "users", winners[i]);
    await updateDoc(userRef, {
      "statistics.achievements": arrayUnion(`${seasonId}_${badges[i]}`),
    });
  }

  await updateDoc(seasonRef, {
    isActive: false,
    winners: {
      first: winners[0],
      second: winners[1],
      third: winners[2],
    },
  });
};

export const firebaseAddLogReport = async (
  uid: string,
  data: string,
  newAchievements: AchievementList[],
  newLevel: { isNewLevel: boolean; level: number },
  points: number,
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  const logData = {
    data,
    uid,
    userName,
    newAchievements,
    newLevel,
    points,
    timestamp: new Date().toISOString(),
    timeSumary,
  };

  await setDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage(logData);
    await sendDiscordMessage(discordMessage as any);
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};

export const updateGuitarStartDate = async (date: Date) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    guitarStartDate: Timestamp.fromDate(date),
  });
};
