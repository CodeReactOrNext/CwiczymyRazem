import { createAsyncThunk } from "@reduxjs/toolkit";
import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { doc, increment, runTransaction, updateDoc } from "firebase/firestore";
import posthog from "posthog-js";
import type { RootState } from "store/store";
import type { DailyQuest, DailyQuestTaskType } from "types/api.types";
import { getLocalDateKey } from "utils/converter";
import { auth, db } from "utils/firebase/client/firebase.utils";

import { isSameQuest, mergeDailyQuests } from "./dailyQuest.merge";
import { claimQuestReward, completeQuestTask, generateDailyQuest, setDailyQuest } from "./userSlice";

/** Fame Points awarded for completing the full daily quest set. */
export const DAILY_QUEST_FAME_REWARD = 40;

/**
 * Quest syncs are serialized and coalesced. Finishing a session completes
 * several tasks in one burst, and firing a transaction per task would pile
 * concurrent writes onto the same document. A run that is already waiting reads
 * the store when it starts, so it covers every completion dispatched before it.
 */
let syncChain: Promise<void> = Promise.resolve();
let pendingSyncs = 0;

/**
 * A transaction needs the network, and with no connection it can sit unresolved
 * for a long time. Give up on it rather than letting it block every later sync —
 * the next one (a completed task, tab focus, coming back online) retries.
 */
const SYNC_TIMEOUT = 15_000;

const withTimeout = <T,>(promise: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Daily quest sync timed out")), SYNC_TIMEOUT);
    }),
  ]).finally(() => clearTimeout(timer));
};

const enqueueSync = (run: () => Promise<void>): Promise<void> => {
  if (pendingSyncs > 1) return syncChain;

  pendingSyncs += 1;
  syncChain = syncChain
    .catch(() => undefined)
    .then(run)
    .finally(() => {
      pendingSyncs -= 1;
    });

  return syncChain;
};

/**
 * Publishes the quest held in the store, merged with the one already stored.
 *
 * Never a blind overwrite. The quest lives in a single document field, so
 * writing the in-memory copy straight over it let any client holding an older
 * one — a tab left open since the morning, a second device, a write queued while
 * offline — push that copy back over newer progress, which is what made
 * completed tasks "reset" hours later. The transaction reads what is stored,
 * merges progress forward, and writes only when the result actually differs.
 *
 * It doubles as the pull direction: progress made on another device lands back
 * in the store, so mounting the widget or returning to a backgrounded tab shows
 * the real state instead of republishing a stale one.
 */
export const syncDailyQuestAction = createAsyncThunk(
  "user/syncDailyQuest",
  async (_, { dispatch, getState }) =>
    enqueueSync(async () => {
      const userId = auth.currentUser?.uid;
      // Read the store now, not when the sync was queued — an earlier run may
      // have been waiting while further tasks were completed.
      const state = getState() as RootState;
      const localQuest = state.user.currentUserStats?.dailyQuest ?? null;

      if (!userId || !state.user.currentUserStats) return;

      try {
        const userRef = doc(db, "users", userId);
        const today = getLocalDateKey();

        const merged = await withTimeout(runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(userRef);
          const remoteQuest = (snapshot.data()?.statistics?.dailyQuest ??
            null) as DailyQuest | null;
          const result = mergeDailyQuests(localQuest, remoteQuest, today);

          if (result && !isSameQuest(result, remoteQuest)) {
            transaction.update(userRef, { "statistics.dailyQuest": result });
          }

          return result;
        }));

        if (merged && !isSameQuest(merged, localQuest)) {
          dispatch(setDailyQuest(merged));
        }
      } catch (error) {
        // Swallowing this is what let the widget show tasks as completed while
        // the server never heard about them. The next sync (a completed task,
        // tab focus, coming back online) retries; the failure has to be visible.
        console.error("Failed to sync daily quest:", error);
        posthog.capture("daily_quest_sync_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })
);

export const updateQuestProgress = createAsyncThunk(
  "user/updateQuestProgress",
  async (payload: { type: DailyQuestTaskType; amount?: number; exerciseId?: string }, { dispatch, getState }) => {
    const questBefore = (getState() as RootState).user.currentUserStats?.dailyQuest;
    dispatch(completeQuestTask(payload));
    const questAfter = (getState() as RootState).user.currentUserStats?.dailyQuest;

    // Finishing a session fires this for every task type the session could
    // possibly satisfy, and today's set holds three of them. Only the ones that
    // moved something are worth a round trip.
    if (questBefore !== questAfter) {
      dispatch(syncDailyQuestAction());
    }
  }
);

export const initializeDailyQuestAction = createAsyncThunk(
  "user/initializeDailyQuest",
  async (_, { dispatch, getState }) => {
    const { exercisesAgregat } = await import("../../exercisePlan/data/exercisesAgregat");

    const state = getState() as RootState;
    const role = state.user.userInfo?.role;
    const isPremium = role === "pro" || role === "master" || role === "admin";
    const availableExercises = isPremium
      ? exercisesAgregat
      : exercisesAgregat.filter((e) => !e.premium);

    const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];

    dispatch(generateDailyQuest({
      randomExercise: {
        id: randomExercise.id,
        title: randomExercise.title
      }
    }));
    // generateDailyQuest is a no-op when today's quest is already in the store,
    // and the sync writes nothing when the merge changes nothing — so mounting
    // the widget costs a read, not an overwrite of whatever is stored.
    dispatch(syncDailyQuestAction());
  }
);

export const claimQuestRewardAction = createAsyncThunk(
  "user/claimQuestReward",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const stateBefore = getState() as RootState;
      const quest = stateBefore.user.currentUserStats?.dailyQuest;

      if (!quest || quest.isRewardClaimed) {
        return;
      }

      dispatch(claimQuestReward());
      dispatch(syncDailyQuestAction());

      const state = getState() as RootState;
      const userId = auth.currentUser?.uid;
      if (userId && state.user.currentUserStats) {
        const userRef = doc(db, "users", userId);

        await updateSeasonalPoints(userId, 10);

        await updateDoc(userRef, {
          "statistics.points": state.user.currentUserStats.points,
          "statistics.lvl": state.user.currentUserStats.lvl,
          "statistics.fame": increment(DAILY_QUEST_FAME_REWARD),
        });

        const { firebaseAddQuestLog } = await import("../../logs/services/addQuestLog.service");
        await firebaseAddQuestLog(userId);

        posthog.capture("daily_quest_claimed", {
          points: state.user.currentUserStats.points,
        });
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to claim reward");
    }
  }
);
