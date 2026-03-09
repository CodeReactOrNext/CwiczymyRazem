import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { SessionGrade, SessionRatingResponse } from "../types/summary.types";

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

export async function firebaseGetAllDailyRatings(userId: string): Promise<Record<string, SessionGrade>> {
  try {
    const col = collection(db, "users", userId, "aiRatings");
    const snap = await getDocs(col);
    const result: Record<string, SessionGrade> = {};
    snap.docs
      .filter(d => d.id.startsWith("daily-"))
      .forEach(d => {
        const date = d.id.replace("daily-", "");
        const rating = d.data().rating as SessionRatingResponse;
        if (rating?.grade) result[date] = rating.grade;
      });
    return result;
  } catch {
    return {};
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
