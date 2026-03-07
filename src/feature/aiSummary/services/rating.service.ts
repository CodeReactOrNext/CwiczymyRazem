import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { SessionRatingResponse } from "../types/summary.types";

const ratingDocRef = (userId: string, ratingId: string) =>
  doc(db, "users", userId, "aiRatings", ratingId);

export async function firebaseGetRating(
  userId: string,
  ratingId: string,
): Promise<SessionRatingResponse | null> {
  try {
    const snap = await getDoc(ratingDocRef(userId, ratingId));
    if (!snap.exists()) return null;
    return snap.data().rating as SessionRatingResponse;
  } catch {
    return null;
  }
}

export async function firebaseSaveRating(
  userId: string,
  ratingId: string,
  rating: SessionRatingResponse,
): Promise<void> {
  try {
    await setDoc(ratingDocRef(userId, ratingId), {
      rating,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save rating to Firebase:", err);
  }
}
