import { logger } from "feature/logger/Logger";
import { collection, doc, limit, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedGetDocs,
  trackedSetDoc,
} from "utils/firebase/client/firestoreTracking";

export interface BpmProgressData {
  completedBpms: number[];
  exerciseTitle: string;
  exerciseCategory: string;
  lastUpdated: Timestamp;
  micHighScore?: number;
  micHighScoreAccuracy?: number;
  earTrainingHighScore?: number;
  clickHighScore?: number;
  clickHighScoreAccuracy?: number;
  /** Fastest clean scale-tree record run — see `updateScaleRecordBpm`. */
  recordBpm?: number;
  recordBpmAccuracy?: number;
  /** Key the record was set in; the shape is the same in every key. */
  recordBpmRoot?: string;
  /**
   * Last time the exercise was played through to a finish, whatever it scored.
   * The only mark the open exercises ever get — improv prompts, play-alongs, ear
   * quizzes and the mic-less drills have nothing to score, so without this they
   * would read as never attempted forever. See `markExerciseCompleted`.
   */
  completedAt?: Timestamp;
  /** How many times the exercise has been finished, counted alongside `completedAt`. */
  completionCount?: number;
}

const BPM_PROGRESS_SUBCOLLECTION = "exerciseBpmProgress";

export const getExerciseBpmProgress = async (
  userId: string,
  exerciseId: string
): Promise<BpmProgressData | null> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as BpmProgressData;
  } catch (error) {
    logger.error(error, { context: "getExerciseBpmProgress" });
    return null;
  }
};

export const toggleBpmStage = async (
  userId: string,
  exerciseId: string,
  bpm: number,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<number[]> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    // Spread what's already there: this doc also holds the high scores and the
    // completion stamp, and ticking a tempo checkbox must not wipe them.
    const existing = snapshot.exists() ? snapshot.data() : {};
    const completedBpms: number[] = [...(existing.completedBpms || [])];

    const index = completedBpms.indexOf(bpm);
    if (index > -1) {
      completedBpms.splice(index, 1);
    } else {
      completedBpms.push(bpm);
      completedBpms.sort((a, b) => a - b);
    }

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms,
      exerciseTitle,
      exerciseCategory,
      lastUpdated: Timestamp.now(),
    });

    return completedBpms;
  } catch (error) {
    logger.error(error, { context: "toggleBpmStage" });
    throw error;
  }
};

/**
 * Records a tempo as cleared, and only that — unlike `toggleBpmStage`, replaying
 * a stage that was already passed leaves it passed (a retaken exam must never
 * take progress away).
 */
export const addBpmStage = async (
  userId: string,
  exerciseId: string,
  bpm: number,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<number[]> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    const existing = snapshot.exists() ? snapshot.data() : {};
    const completedBpms: number[] = [...(existing.completedBpms || [])];
    if (completedBpms.includes(bpm)) return completedBpms;

    completedBpms.push(bpm);
    completedBpms.sort((a, b) => a - b);

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms,
      exerciseTitle,
      exerciseCategory,
      lastUpdated: Timestamp.now(),
    });

    return completedBpms;
  } catch (error) {
    logger.error(error, { context: "addBpmStage" });
    throw error;
  }
};

/**
 * Records that the exercise was played through, independent of any score.
 *
 * Roughly a fifth of the catalogue can't be scored at all — improvisation
 * prompts, play-alongs, ear quizzes, the `disableMic` phrasing drills — and
 * before this stamp existed nothing was ever written for them, so they stayed
 * unticked in the skill tree however many times a player did them. Merges into
 * the doc, so a completion never costs a player a high score or a cleared tempo.
 */
export const markExerciseCompleted = async (
  userId: string,
  exerciseId: string,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);
    const previousCount = snapshot.exists()
      ? (snapshot.data().completionCount ?? 0)
      : 0;
    const now = Timestamp.now();

    await trackedSetDoc(
      docRef,
      {
        exerciseTitle,
        exerciseCategory,
        completedAt: now,
        completionCount: previousCount + 1,
        lastUpdated: now,
      },
      { merge: true }
    );
  } catch (error) {
    logger.error(error, { context: "markExerciseCompleted" });
  }
};

export const updateMicHighScore = async (
  userId: string,
  exerciseId: string,
  score: number,
  accuracy: number,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<{ isNewRecord: boolean; previousScore: number }> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    const existing = snapshot.exists() ? snapshot.data() : {};
    const currentHighScore = existing.micHighScore || 0;

    if (score <= currentHighScore) return { isNewRecord: false, previousScore: currentHighScore };

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms: existing.completedBpms || [],
      exerciseTitle,
      exerciseCategory,
      micHighScore: score,
      micHighScoreAccuracy: accuracy,
      lastUpdated: Timestamp.now(),
    });
    return { isNewRecord: true, previousScore: currentHighScore };
  } catch (error) {
    logger.error(error, { context: "updateMicHighScore" });
    return { isNewRecord: false, previousScore: 0 };
  }
};

export const updateEarTrainingHighScore = async (
  userId: string,
  exerciseId: string,
  score: number,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<{ isNewRecord: boolean; previousScore: number }> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    const existing = snapshot.exists() ? snapshot.data() : {};
    const currentHighScore = existing.earTrainingHighScore || 0;

    if (score <= currentHighScore) return { isNewRecord: false, previousScore: currentHighScore };

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms: existing.completedBpms || [],
      exerciseTitle,
      exerciseCategory,
      earTrainingHighScore: score,
      lastUpdated: Timestamp.now(),
    });
    return { isNewRecord: true, previousScore: currentHighScore };
  } catch (error) {
    logger.error(error, { context: "updateEarTrainingHighScore" });
    return { isNewRecord: false, previousScore: 0 };
  }
};

export const updateClickHighScore = async (
  userId: string,
  exerciseId: string,
  score: number,
  accuracy: number,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<{ isNewRecord: boolean; previousScore: number }> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    const existing = snapshot.exists() ? snapshot.data() : {};
    const currentHighScore = existing.clickHighScore || 0;

    if (score <= currentHighScore) return { isNewRecord: false, previousScore: currentHighScore };

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms: existing.completedBpms || [],
      exerciseTitle,
      exerciseCategory,
      clickHighScore: score,
      clickHighScoreAccuracy: accuracy,
      lastUpdated: Timestamp.now(),
    });
    return { isNewRecord: true, previousScore: currentHighScore };
  } catch (error) {
    logger.error(error, { context: "updateClickHighScore" });
    return { isNewRecord: false, previousScore: 0 };
  }
};

/**
 * Scale-tree record run: keeps the fastest tempo the exercise has been played
 * cleanly at, above the tempo the tree itself asks for. Slower runs are ignored,
 * so a bad attempt can never cost a player their record.
 */
export const updateScaleRecordBpm = async (
  userId: string,
  exerciseId: string,
  bpm: number,
  accuracy: number,
  rootNote: string,
  exerciseTitle: string,
  exerciseCategory: string
): Promise<{ isNewRecord: boolean; previousBpm: number }> => {
  try {
    const docRef = doc(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION,
      exerciseId
    );
    const snapshot = await trackedGetDoc(docRef);

    const existing = snapshot.exists() ? snapshot.data() : {};
    const previousBpm = existing.recordBpm || 0;

    if (bpm <= previousBpm) return { isNewRecord: false, previousBpm };

    await trackedSetDoc(docRef, {
      ...existing,
      completedBpms: existing.completedBpms || [],
      exerciseTitle,
      exerciseCategory,
      recordBpm: bpm,
      recordBpmAccuracy: accuracy,
      recordBpmRoot: rootNote,
      lastUpdated: Timestamp.now(),
    });
    return { isNewRecord: true, previousBpm };
  } catch (error) {
    logger.error(error, { context: "updateScaleRecordBpm" });
    return { isNewRecord: false, previousBpm: 0 };
  }
};

// --- Leaderboard ---

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  /**
   * Tempo the standing score was played at, speed multiplier included. Absent on
   * entries written before tempo was recorded, and on exercises with no metronome —
   * there the score says nothing about speed, so no number beats a made-up one.
   */
  bpm?: number;
  updatedAt: Timestamp;
}

export const saveLeaderboardEntry = async (
  userId: string,
  exerciseId: string,
  score: number,
  displayName: string,
  avatar: string,
  bpm?: number
): Promise<void> => {
  try {
    const docRef = doc(db, "exerciseLeaderboards", exerciseId, "entries", userId);
    const snapshot = await trackedGetDoc(docRef);

    if (snapshot.exists()) {
      const existing = snapshot.data() as LeaderboardEntry;
      if (score <= existing.score) return;
    }

    // The tempo belongs to the score being written, never carried over from the
    // entry it replaces: a beaten record's BPM is not this record's BPM.
    await trackedSetDoc(docRef, {
      userId,
      displayName,
      avatar,
      score,
      ...(bpm ? { bpm } : {}),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logger.error(error, { context: "saveLeaderboardEntry" });
  }
};

export const getExerciseLeaderboard = async (
  exerciseId: string,
  limitCount = 20
): Promise<LeaderboardEntry[]> => {
  try {
    const colRef = collection(db, "exerciseLeaderboards", exerciseId, "entries");
    const q = query(colRef, orderBy("score", "desc"), limit(limitCount));
    const snapshot = await trackedGetDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), userId: d.id }) as LeaderboardEntry);
  } catch (error) {
    logger.error(error, { context: "getExerciseLeaderboard" });
    return [];
  }
};

export const getAllBpmProgress = async (
  userId: string
): Promise<Map<string, BpmProgressData>> => {
  try {
    const colRef = collection(
      db,
      "users",
      userId,
      BPM_PROGRESS_SUBCOLLECTION
    );
    const snapshot = await trackedGetDocs(colRef);

    const result = new Map<string, BpmProgressData>();
    snapshot.docs.forEach((d) => {
      result.set(d.id, d.data() as BpmProgressData);
    });
    return result;
  } catch (error) {
    logger.error(error, { context: "getAllBpmProgress" });
    return new Map();
  }
};
