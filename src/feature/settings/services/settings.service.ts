import { statisticsInitial as statistics } from "constants/userStatisticsInitialData";
import {
  getAuth,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isAnyEmailEnabled } from "lib/email/consent";
import type {
  EmailConsent,
  EmailNotificationPreferences,
} from "types/api.types";
import { db, firebaseUpdateUserDocument, storage } from "utils/firebase/client/firebase.utils";
import { shuffleUid } from "utils/user/shuffleUid";

const auth = getAuth();


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

/**
 * Rest days live in `statistics` rather than beside the other preferences
 * because the streak is computed wherever the stats are read — someone else's
 * profile and tooltip included — and they have to count it the same way.
 */
export const firebaseUpdateStreakRestDays = async (enabled: boolean) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, { "statistics.streakRestDays": enabled });
};

/**
 * Saving the toggles in Settings is also an answer to "may we email you?" —
 * any one left on is a yes — so the consent record is written with them.
 * Returns that record as the client keeps it.
 */
export const firebaseUpdateEmailNotifications = async (
  preferences: EmailNotificationPreferences
): Promise<EmailConsent> => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  const emailConsent: EmailConsent = {
    granted: isAnyEmailEnabled(preferences),
    source: "settings",
  };
  await updateDoc(userDocRef, {
    emailNotifications: preferences,
    emailConsent: { ...emailConsent, updatedAt: serverTimestamp() },
  });
  return emailConsent;
};

/**
 * The prompt's answer. The toggles are left alone, so an email turned off
 * before the question existed stays off after a yes.
 */
export const firebaseAnswerEmailConsent = async (
  granted: boolean
): Promise<EmailConsent> => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  const emailConsent: EmailConsent = { granted, source: "prompt" };
  await updateDoc(userDocRef, {
    emailConsent: { ...emailConsent, updatedAt: serverTimestamp() },
  });
  return emailConsent;
};

export const firebaseToggleFavoritePlan = async (
  planId: string,
  isFavorite: boolean
) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    favoritePlanIds: isFavorite ? arrayUnion(planId) : arrayRemove(planId),
  });
};

export const firebaseToggleFavoriteExercise = async (
  exerciseId: string,
  isFavorite: boolean
) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    favoriteExerciseIds: isFavorite ? arrayUnion(exerciseId) : arrayRemove(exerciseId),
  });
};

export const firebaseToggleFavoriteSong = async (
  songId: string,
  isFavorite: boolean
) => {
  const userDocRef = doc(db, "users", auth.currentUser?.uid!);
  await updateDoc(userDocRef, {
    favoriteSongIds: isFavorite ? arrayUnion(songId) : arrayRemove(songId),
  });
};

