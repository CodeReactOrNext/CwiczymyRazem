import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  updateDoc,
  getDocs,
  collection,
  orderBy,
  limit,
  query,
  setDoc,
  deleteDoc,
  getCountFromServer,
  startAfter,
  addDoc,
  arrayRemove,
  arrayUnion,
  where,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsSongsStatuses,
  FirebaseUserDataInterface,
  FirebaseUserExceriseLog,
  Song,
  SongStatus,
} from "./firebase.types";
import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
import { firebaseApp } from "./firebase.cofig";
import { shuffleUid } from "utils/user/shuffleUid";
import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import { SortByType } from "feature/leadboard/view/LeadboardView";

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
  status: FirebaseLogsSongsStatuses
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  await setDoc(logsDocRef, {
    data,
    uid,
    userName,
    songTitle,
    songArtist,
    status,
  });
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

export const addSong = async (
  title: string,
  artist: string,
  userId: string
) => {
  try {
    const songsRef = collection(db, "songs");
    const newSong = {
      title,
      artist,
      difficulties: [],
      learningUsers: [],
      createdAt: Timestamp.now(),
      createdBy: userId,
    };

    const docRef = await addDoc(songsRef, newSong);
    firebaseAddSongsLog(userId, new Date().toString(), title, artist, "added");
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
      new Date().toString(),
      title,
      artist,
      "difficulty_rate"
    );
  } catch (error) {
    console.error("Error rating song:", error);
    throw error;
  }
};

export const getSongs = async (
  sortBy: "title" | "artist" | "avgDifficulty" | "learners",
  sortDirection: "asc" | "desc",
  searchQuery: string,
  page: number,
  limitNumber: number
) => {
  try {
    let q = query(collection(db, "songs"));

    // Apply search if provided
    if (searchQuery) {
      q = query(
        q,
        where("title", ">=", searchQuery),
        where("title", "<=", searchQuery + "\uf8ff")
      );
    }

    // Apply sorting
    if (sortBy !== "avgDifficulty" && sortBy !== "learners") {
      q = query(q, orderBy(sortBy, sortDirection));
    }

    // Apply pagination
    q = query(
      q,
      limit(limitNumber ?? 15),
      startAfter((page - 1) * limitNumber)
    );

    const snapshot = await getDocs(q);
    const songs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];

    // Handle custom sorting
    if (sortBy === "avgDifficulty") {
      songs.sort((a, b) => {
        const avgA =
          a.difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
          (a.difficulties.length || 1);
        const avgB =
          b.difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
          (b.difficulties.length || 1);
        return sortDirection === "asc" ? avgA - avgB : avgB - avgA;
      });
    } else if (sortBy === "learners") {
      songs.sort((a, b) => {
        return sortDirection === "asc"
          ? (a.learningUsers?.length || 0) - (b.learningUsers?.length || 0)
          : (b.learningUsers?.length || 0) - (a.learningUsers?.length || 0);
      });
    }

    return songs;
  } catch (error) {
    console.error("Error getting songs:", error);
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
  const db = getFirestore();
  const userDocRef = doc(db, "users", userId);
  const songRef = doc(db, "songs", songId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      const songDoc = await transaction.get(songRef);

      if (!songDoc.exists()) {
        throw new Error("Song not found");
      }

      const userData = userDoc.data();
      const songLists = userData?.songLists || {
        wantToLearn: [],
        learning: [],
        learned: [],
        lastUpdated: Timestamp.now(),
      };

      // Remove song from all lists first
      const allLists: SongStatus[] = ["wantToLearn", "learning", "learned"];
      let oldStatus: SongStatus | null = null;

      for (const list of allLists) {
        const index = songLists[list].indexOf(songId);
        if (index > -1) {
          oldStatus = list;
          songLists[list].splice(index, 1);
        }
      }

      // Add to new status list
      songLists[status].push(songId);
      songLists.lastUpdated = Timestamp.now();

      // Update song status counts
      const songData = songDoc.data();
      const statusCounts = songData.statusCounts || {
        wantToLearn: 0,
        learning: 0,
        learned: 0,
      };

      if (oldStatus) {
        statusCounts[oldStatus]--;
      }
      statusCounts[status]++;

      // Update both documents
      transaction.update(userDocRef, { songLists });
      transaction.update(songRef, { statusCounts });
      firebaseAddSongsLog(userId, new Date().toString(), title, artist, status);
    });

    return true;
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};

export const getUserSongs = async (userId: string) => {
  const db = getFirestore();
  const userDocRef = doc(db, "users", userId);

  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const songLists = userDoc.data().songLists || {
      wantToLearn: [],
      learning: [],
      learned: [],
      lastUpdated: Timestamp.now(),
    };

    // Get all unique song IDs
    const allSongIds = [
      ...new Set([
        ...songLists.wantToLearn,
        ...songLists.learning,
        ...songLists.learned,
      ]),
    ];

    // Fetch all songs in parallel
    const songDocs = await Promise.all(
      allSongIds.map((id) => getDoc(doc(db, "songs", id)))
    );

    const songs = songDocs.reduce((acc, doc) => {
      if (doc.exists()) {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Song;
      }
      return acc;
    }, {} as Record<string, Song>);

    // Return organized lists with full song objects
    return {
      wantToLearn: songLists.wantToLearn.map((id) => songs[id]).filter(Boolean),
      learning: songLists.learning.map((id) => songs[id]).filter(Boolean),
      learned: songLists.learned.map((id) => songs[id]).filter(Boolean),
      lastUpdated: songLists.lastUpdated,
    };
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};

// Helper function to get current status of a song for a user
export const getUserSongStatus = async (userId: string, songId: string) => {
  const db = getFirestore();
  const userDocRef = doc(db, "users", userId);

  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return null;

    const songLists = userDoc.data().songLists;
    if (!songLists) return null;

    if (songLists.wantToLearn.includes(songId)) return "wantToLearn";
    if (songLists.learning.includes(songId)) return "learning";
    if (songLists.learned.includes(songId)) return "learned";

    return null;
  } catch (error) {
    console.error("Error getting song status:", error);
    throw error;
  }
};
