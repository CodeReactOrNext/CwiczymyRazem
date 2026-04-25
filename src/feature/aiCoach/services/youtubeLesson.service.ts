import { db } from "utils/firebase/client/firebase.utils";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import type {
  YouTubeLesson,
  YouTubeLessonStatus,
  ScraperConfig,
} from "../types/youtubeLesson.types";
import { DEFAULT_SCRAPER_CONFIG } from "../types/youtubeLesson.types";

const LESSONS_COLLECTION = "youtubeLessons";
const ADMIN_CONFIG_COLLECTION = "adminConfig";
const SCRAPER_CONFIG_DOC = "youtubeScraper";

const firebaseGetScraperConfig = async (): Promise<ScraperConfig> => {
  const configRef = doc(db, ADMIN_CONFIG_COLLECTION, SCRAPER_CONFIG_DOC);
  const snap = await getDoc(configRef);
  if (!snap.exists()) return DEFAULT_SCRAPER_CONFIG;
  return snap.data() as ScraperConfig;
};

const firebaseSaveScraperConfig = async (config: ScraperConfig) => {
  const configRef = doc(db, ADMIN_CONFIG_COLLECTION, SCRAPER_CONFIG_DOC);
  await setDoc(configRef, config);
};

export const firebaseGetLessonsByStatus = async (
  status: YouTubeLessonStatus,
  limitCount = 50
): Promise<YouTubeLesson[]> => {
  const lessonsRef = collection(db, LESSONS_COLLECTION);
  const q = query(
    lessonsRef,
    where("status", "==", status),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as YouTubeLesson);
};

export const firebaseGetLessonsByIds = async (
  videoIds: string[]
): Promise<YouTubeLesson[]> => {
  if (!videoIds.length) return [];
  const lessons: YouTubeLesson[] = [];
  for (const videoId of videoIds) {
    const ref = doc(db, LESSONS_COLLECTION, videoId);
    const snap = await getDoc(ref);
    if (snap.exists()) lessons.push(snap.data() as YouTubeLesson);
  }
  return lessons;
};

export const firebaseUpdateLesson = async (
  videoId: string,
  data: Partial<YouTubeLesson>
) => {
  const ref = doc(db, LESSONS_COLLECTION, videoId);
  await updateDoc(ref, data as Record<string, unknown>);
};

export const firebaseGetLessonStats = async () => {
  const lessonsRef = collection(db, LESSONS_COLLECTION);
  const [rawSnap, indexedSnap, rejectedSnap] = await Promise.all([
    getDocs(query(lessonsRef, where("status", "==", "raw"))),
    getDocs(query(lessonsRef, where("status", "==", "indexed"))),
    getDocs(query(lessonsRef, where("status", "==", "rejected"))),
  ]);
  return {
    raw: rawSnap.size,
    indexed: indexedSnap.size,
    rejected: rejectedSnap.size,
    total: rawSnap.size + indexedSnap.size + rejectedSnap.size,
  };
};
