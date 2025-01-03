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
} from "firebase/firestore";
import {
  FirebaseDiscordEventsInteface,
  FirebaseEventsInteface,
  FirebaseLogsInterface,
  FirebaseUserDataInterface,
  FirebaseUserExceriseLog,
} from "./firebase.types";
import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
import { firebaseApp } from "./firebase.cofig";
import { shuffleUid } from "utils/user/shuffleUid";
import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";

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
  const logsArr: FirebaseLogsInterface[] = [];
  logsDoc.forEach((doc) => {
    const log = doc.data() as FirebaseLogsInterface;
    logsArr.push(log);
  });
  return logsArr;
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
