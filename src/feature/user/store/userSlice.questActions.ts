import { createAsyncThunk } from "@reduxjs/toolkit";
import { doc, updateDoc } from "firebase/firestore";
import posthog from "posthog-js";
import type { RootState } from "store/store";
import type { DailyQuestTaskType } from "types/api.types";
import { auth, db } from "utils/firebase/client/firebase.utils";
import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";

import { claimQuestReward, completeQuestTask, generateDailyQuest } from "./userSlice";

const saveDailyQuestAction = createAsyncThunk(
  "user/saveDailyQuest",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const dailyQuest = state.user.currentUserStats?.dailyQuest;
      const userId = auth.currentUser?.uid;

      if (!userId || !dailyQuest) {
        return;
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        "statistics.dailyQuest": dailyQuest
      });

      return dailyQuest;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save daily quest"
      );
    }
  }
);

export const updateQuestProgress = createAsyncThunk(
  "user/updateQuestProgress",
  async (payload: { type: DailyQuestTaskType; amount?: number; exerciseId?: string }, { dispatch }) => {
    dispatch(completeQuestTask(payload));
    dispatch(saveDailyQuestAction());
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
    dispatch(saveDailyQuestAction());
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
      dispatch(saveDailyQuestAction());

      const state = getState() as RootState;
      const userId = auth.currentUser?.uid;
      if (userId && state.user.currentUserStats) {
        const userRef = doc(db, "users", userId);

        await updateSeasonalPoints(userId, 30);

        await updateDoc(userRef, {
          "statistics.points": state.user.currentUserStats.points,
          "statistics.lvl": state.user.currentUserStats.lvl,
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
