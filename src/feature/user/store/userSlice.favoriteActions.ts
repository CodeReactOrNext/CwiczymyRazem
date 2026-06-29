import { createAsyncThunk } from "@reduxjs/toolkit";
import { firebaseToggleFavoriteExercise, firebaseToggleFavoritePlan } from "feature/settings/services/settings.service";

import { setFavoriteExercise, setFavoritePlan } from "./userSlice";

/**
 * Toggles a plan/routine as favorite. Updates Redux immediately for a snappy
 * heart toggle, persists to the user's Firestore document, and reverts the
 * optimistic change if the write fails.
 */
export const toggleFavoritePlan = createAsyncThunk(
  "user/toggleFavoritePlan",
  async (
    { planId, isFavorite }: { planId: string; isFavorite: boolean },
    { dispatch }
  ) => {
    dispatch(setFavoritePlan({ planId, isFavorite }));
    try {
      await firebaseToggleFavoritePlan(planId, isFavorite);
    } catch (error) {
      dispatch(setFavoritePlan({ planId, isFavorite: !isFavorite }));
      throw error;
    }
  }
);

/**
 * Toggles an exercise as favorite — same optimistic-with-revert flow as
 * {@link toggleFavoritePlan}, but persisted to `favoriteExerciseIds`.
 */
export const toggleFavoriteExercise = createAsyncThunk(
  "user/toggleFavoriteExercise",
  async (
    { exerciseId, isFavorite }: { exerciseId: string; isFavorite: boolean },
    { dispatch }
  ) => {
    dispatch(setFavoriteExercise({ exerciseId, isFavorite }));
    try {
      await firebaseToggleFavoriteExercise(exerciseId, isFavorite);
    } catch (error) {
      dispatch(setFavoriteExercise({ exerciseId, isFavorite: !isFavorite }));
      throw error;
    }
  }
);
