import {
  normalizeDefaultViewMode,
  useTablatureSettings,
} from "feature/exercisePlan/views/PracticeSession/components/tablatureSettings";
import { useCallback, useReducer } from "react";

export type PlaybackState = {
  isAudioMuted: boolean;
  isMetronomeMuted: boolean;
  speedMultiplier: number;
  showAlphaTabScore: boolean;
  selectedGpTrackIdx: number;
};

type PlaybackAction =
  | { type: "SET_AUDIO_MUTED"; payload: boolean | ((prev: boolean) => boolean) }
  | {
      type: "SET_METRONOME_MUTED";
      payload: boolean | ((prev: boolean) => boolean);
    }
  | {
      type: "SET_SPEED_MULTIPLIER";
      payload: number | ((prev: number) => number);
    }
  | {
      type: "SET_SHOW_ALPHATAB_SCORE";
      payload: boolean | ((prev: boolean) => boolean);
    }
  | { type: "TOGGLE_ALPHATAB_SCORE" }
  | { type: "SET_SELECTED_GP_TRACK_IDX"; payload: number }
  | { type: "RESET_FOR_EXERCISE"; payload: Partial<PlaybackState> };

// Seeds the view flags from the "Default view" setting (Settings → Tablature). Read via
// getState() rather than the hook: only the value at mount time is needed, and calling a
// hook here would subscribe the whole reducer to every unrelated tablature-setting change.
function createInitialState(): PlaybackState {
  const { defaultViewMode } = useTablatureSettings.getState();
  return {
    isAudioMuted: true,
    isMetronomeMuted: false,
    speedMultiplier: 1,
    showAlphaTabScore: normalizeDefaultViewMode(defaultViewMode) === "notation",
    selectedGpTrackIdx: 0,
  };
}

function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "SET_AUDIO_MUTED":
      return {
        ...state,
        isAudioMuted:
          typeof action.payload === "function"
            ? action.payload(state.isAudioMuted)
            : action.payload,
      };
    case "SET_METRONOME_MUTED":
      return {
        ...state,
        isMetronomeMuted:
          typeof action.payload === "function"
            ? action.payload(state.isMetronomeMuted)
            : action.payload,
      };
    case "SET_SPEED_MULTIPLIER":
      return {
        ...state,
        speedMultiplier:
          typeof action.payload === "function"
            ? action.payload(state.speedMultiplier)
            : action.payload,
      };
    case "SET_SHOW_ALPHATAB_SCORE": {
      const next =
        typeof action.payload === "function"
          ? action.payload(state.showAlphaTabScore)
          : action.payload;
      return { ...state, showAlphaTabScore: next };
    }
    case "TOGGLE_ALPHATAB_SCORE": {
      const nextShow = !state.showAlphaTabScore;
      return {
        ...state,
        showAlphaTabScore: nextShow,
        isAudioMuted: nextShow ? false : state.isAudioMuted,
      };
    }
    case "SET_SELECTED_GP_TRACK_IDX":
      return { ...state, selectedGpTrackIdx: action.payload };
    case "RESET_FOR_EXERCISE":
      return {
        ...state,
        isMetronomeMuted: false,
        speedMultiplier: 1,
        selectedGpTrackIdx: 0,
        ...action.payload,
      };
    default:
      return state;
  }
}

export function usePlaybackReducer() {
  const [state, dispatch] = useReducer(
    playbackReducer,
    undefined,
    createInitialState,
  );

  const setIsAudioMuted = useCallback(
    (payload: boolean | ((prev: boolean) => boolean)) =>
      dispatch({ type: "SET_AUDIO_MUTED", payload }),
    [],
  );
  const setIsMetronomeMuted = useCallback(
    (payload: boolean | ((prev: boolean) => boolean)) =>
      dispatch({ type: "SET_METRONOME_MUTED", payload }),
    [],
  );
  const setSpeedMultiplier = useCallback(
    (payload: number | ((prev: number) => number)) =>
      dispatch({ type: "SET_SPEED_MULTIPLIER", payload }),
    [],
  );
  const setShowAlphaTabScore = useCallback(
    (payload: boolean | ((prev: boolean) => boolean)) =>
      dispatch({ type: "SET_SHOW_ALPHATAB_SCORE", payload }),
    [],
  );
  const toggleAlphaTabScore = useCallback(
    () => dispatch({ type: "TOGGLE_ALPHATAB_SCORE" }),
    [],
  );
  const setSelectedGpTrackIdx = useCallback(
    (payload: number) =>
      dispatch({ type: "SET_SELECTED_GP_TRACK_IDX", payload }),
    [],
  );
  const resetForExercise = useCallback(
    (payload: Partial<PlaybackState>) =>
      dispatch({ type: "RESET_FOR_EXERCISE", payload }),
    [],
  );

  return {
    ...state,
    dispatch,
    setIsAudioMuted,
    setIsMetronomeMuted,
    setSpeedMultiplier,
    setShowAlphaTabScore,
    toggleAlphaTabScore,
    setSelectedGpTrackIdx,
    resetForExercise,
  };
}
