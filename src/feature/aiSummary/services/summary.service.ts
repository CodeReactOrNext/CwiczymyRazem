import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { DailySummaryResponse, WeeklySummaryResponse } from "../types/summary.types";

export interface SavedSummary {
  id: string;
  summary: WeeklySummaryResponse;
  savedAt: string;
}

export interface SavedDailySummary {
  id: string;
  summary: DailySummaryResponse;
  savedAt: string;
}

const summaryDocRef = (userId: string, summaryId: string) =>
  doc(db, "users", userId, "aiSummaries", summaryId);

async function firebaseGetAnySummary<T>(userId: string, summaryId: string): Promise<T | null> {
  try {
    const snap = await getDoc(summaryDocRef(userId, summaryId));
    if (!snap.exists()) return null;
    return snap.data().summary as T;
  } catch {
    return null;
  }
}

async function firebaseSaveAnySummary<T>(userId: string, summaryId: string, data: T): Promise<void> {
  try {
    await setDoc(summaryDocRef(userId, summaryId), {
      summary: data,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save summary to Firebase:", err);
  }
}

export const firebaseGetSummary = (userId: string, summaryId: string) =>
  firebaseGetAnySummary<WeeklySummaryResponse>(userId, summaryId);

export const firebaseSaveSummary = (userId: string, summaryId: string, summary: WeeklySummaryResponse) =>
  firebaseSaveAnySummary(userId, summaryId, summary);

export const firebaseGetDailySummary = (userId: string, summaryId: string) =>
  firebaseGetAnySummary<DailySummaryResponse>(userId, summaryId);

export const firebaseSaveDailySummary = (userId: string, summaryId: string, summary: DailySummaryResponse) =>
  firebaseSaveAnySummary(userId, summaryId, summary);

export async function firebaseGetAllDailySummaries(userId: string): Promise<SavedDailySummary[]> {
  try {
    const col = collection(db, "users", userId, "aiSummaries");
    const q = query(col, orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => d.id.startsWith("daily-"))
      .map((d) => ({
        id: d.id,
        summary: d.data().summary as DailySummaryResponse,
        savedAt: d.data().savedAt as string,
      }));
  } catch {
    return [];
  }
}

export async function firebaseGetAllSummaries(userId: string): Promise<SavedSummary[]> {
  try {
    const col = collection(db, "users", userId, "aiSummaries");
    const q = query(col, orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => d.id.startsWith("weekly-"))
      .map((d) => ({
        id: d.id,
        summary: d.data().summary as WeeklySummaryResponse,
        savedAt: d.data().savedAt as string,
      }));
  } catch {
    return [];
  }
}
