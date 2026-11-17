import { generateRiddle } from "feature/exercisePlan/logic/riddleGenerator";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { getExerciseBpmProgress } from "../../../services/bpmProgressService";
import type { Exercise, TablatureMeasure } from "../../../types/exercise.types";
import { earTrainingBoardScore } from "../../../utils/earTrainingBoardScore";

interface UseEarTrainingOptions {
  currentExercise: Exercise;
  /** True while the riddle's melody is actually coming out of the speakers. */
  isRiddleSounding: boolean;
  restartMetronome: () => void;
  startMetronome: () => void;
  currentBpm: number;
  setBpm: (bpm: number) => void;
}

export function useEarTraining({
  currentExercise,
  isRiddleSounding,
  restartMetronome,
  startMetronome,
  currentBpm,
  setBpm,
}: UseEarTrainingOptions) {
  const userAuth   = useAppSelector(selectUserAuth);
  
  const [riddleMeasures,       setRiddleMeasures]       = useState<TablatureMeasure[] | null>(null);
  const [isRiddleRevealed,     setIsRiddleRevealed]     = useState(false);
  const [isRiddleGuessed,      setIsRiddleGuessed]      = useState(false);
  const [earTrainingScore,     setEarTrainingScoreState] = useState(0);
  const [earTrainingHighScore, setEarTrainingHighScore] = useState<number | null>(null);
  const [hasPlayedRiddleOnce,  setHasPlayedRiddleOnce]  = useState(false);
  const [tabResetKey,          setTabResetKey]          = useState(0);

  // What the leaderboard may see of the run (see earTrainingBoardScore): when
  // its first melody sounded, and when each melody the mic heard was solved.
  // Wall-clock, so a paused session keeps counting.
  const runStartMsRef = useRef<number | null>(null);
  const verifiedAtMsRef = useRef<number[]>([]);

  const clearBoardRun = () => {
    runStartMsRef.current = null;
    verifiedAtMsRef.current = [];
  };

  // Every reset of the score goes through here, so a reset also starts the
  // board's run over — the score and its proof never drift apart.
  const setEarTrainingScore = useCallback((next: SetStateAction<number>) => {
    if (next === 0) {
      runStartMsRef.current = null;
      verifiedAtMsRef.current = [];
    }
    setEarTrainingScoreState(next);
  }, []);

  /** A melody the mic heard the player repeat — the only kind a board ranks. */
  const recordVerifiedEarPoint = useCallback(() => {
    verifiedAtMsRef.current.push(performance.now());
  }, []);

  /** The run's score as the leaderboard may take it, for an attempt `limitMs` long. */
  const getEarTrainingBoardScore = useCallback(
    (limitMs: number | null) => earTrainingBoardScore(verifiedAtMsRef.current, runStartMsRef.current, limitMs),
    []
  );

  // Fetch high score from Firebase
  useEffect(() => {
    if (!userAuth || currentExercise.riddleConfig?.mode !== "sequenceRepeat") {
      setEarTrainingHighScore(null);
      return;
    }
    getExerciseBpmProgress(userAuth, currentExercise.id).then((data) => {
      setEarTrainingHighScore(data?.earTrainingHighScore ?? null);
    });
  }, [userAuth, currentExercise.id]);

  // Reset riddle state when exercise changes
  useEffect(() => {
    setIsRiddleRevealed(false);
    setIsRiddleGuessed(false);
    setHasPlayedRiddleOnce(false);
    clearBoardRun();
    if (currentExercise.riddleConfig?.mode === "sequenceRepeat") {
      setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
      if (currentBpm !== 108) setBpm(108);
    } else {
      setRiddleMeasures(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise.id]);

  // The riddle counts as heard the moment it starts sounding, not once its last
  // beat has run out. Waiting for the end used to strand the exercise: the flag
  // was set by the tablature scheduler's end-of-loop callback, which playback
  // being stopped cancels — and stopping playback is exactly what the player has
  // to do to be listened to. Stop a beat early and the mic never armed again,
  // which is what "it stopped listening to my notes" looked like from the couch.
  useEffect(() => {
    if (!isRiddleSounding || currentExercise.riddleConfig?.mode !== "sequenceRepeat") return;
    // The board's clock starts with the run's first melody.
    if (runStartMsRef.current === null) runStartMsRef.current = performance.now();
    // A latch over time, not a value derivable from the current props: the phrase
    // stays heard long after it has stopped sounding.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasPlayedRiddleOnce(true);
  }, [isRiddleSounding, currentExercise.riddleConfig?.mode]);

  /**
   * Play the phrase from its first beat.
   *
   * Always a restart, never a resume: the metronome remembers where the last stop
   * landed, so simply starting it again picks the phrase up mid-flight — which is
   * exactly where a player who stopped the moment they had heard enough left it.
   */
  const playRiddleFromTop = () => {
    restartMetronome();
    setTimeout(() => { startMetronome(); }, 100);
  };

  const handleNextRiddle = () => {
    if (currentExercise.riddleConfig?.mode !== "sequenceRepeat") return;
    setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
    setIsRiddleRevealed(false);
    setIsRiddleGuessed(false);
    setHasPlayedRiddleOnce(false);
    playRiddleFromTop();
  };

  const handleReplayRiddle = () => playRiddleFromTop();

  const handleRevealRiddle = () => setIsRiddleRevealed(true);

  return {
    riddleMeasures,
    isRiddleRevealed,
    isRiddleGuessed,
    setIsRiddleGuessed,
    earTrainingScore,
    setEarTrainingScore,
    recordVerifiedEarPoint,
    getEarTrainingBoardScore,
    earTrainingHighScore,
    hasPlayedRiddleOnce,
    setHasPlayedRiddleOnce,
    tabResetKey,
    setTabResetKey,
    handleNextRiddle,
    handleReplayRiddle,
    handleRevealRiddle,
  };
}
