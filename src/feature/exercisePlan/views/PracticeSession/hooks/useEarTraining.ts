import { useEffect, useState } from "react";
import { generateRiddle } from "feature/exercisePlan/logic/riddleGenerator";
import { getExerciseBpmProgress } from "../../../services/bpmProgressService";
import type { Exercise, TablatureMeasure } from "../../../types/exercise.types";

interface UseEarTrainingOptions {
  currentExercise: Exercise;
  userAuth: string | null | undefined;
  restartMetronome: () => void;
  startMetronome: () => void;
  currentBpm: number;
  setBpm: (bpm: number) => void;
}

export function useEarTraining({
  currentExercise,
  userAuth,
  restartMetronome,
  startMetronome,
  currentBpm,
  setBpm,
}: UseEarTrainingOptions) {
  const [riddleMeasures,       setRiddleMeasures]       = useState<TablatureMeasure[] | null>(null);
  const [isRiddleRevealed,     setIsRiddleRevealed]     = useState(false);
  const [isRiddleGuessed,      setIsRiddleGuessed]      = useState(false);
  const [earTrainingScore,     setEarTrainingScore]     = useState(0);
  const [earTrainingHighScore, setEarTrainingHighScore] = useState<number | null>(null);
  const [hasPlayedRiddleOnce,  setHasPlayedRiddleOnce]  = useState(false);
  const [tabResetKey,          setTabResetKey]          = useState(0);

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
    setHasPlayedRiddleOnce(false);
    if (currentExercise.riddleConfig?.mode === "sequenceRepeat") {
      setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
      if (currentBpm !== 108) setBpm(108);
    } else {
      setRiddleMeasures(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise.id]);

  const handleNextRiddle = () => {
    if (currentExercise.riddleConfig?.mode !== "sequenceRepeat") return;
    setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
    setIsRiddleRevealed(false);
    setIsRiddleGuessed(false);
    setHasPlayedRiddleOnce(false);
    restartMetronome();
    setTimeout(() => { startMetronome(); }, 100);
  };

  const handleRevealRiddle = () => setIsRiddleRevealed(true);

  return {
    riddleMeasures,
    isRiddleRevealed,
    isRiddleGuessed,
    setIsRiddleGuessed,
    earTrainingScore,
    setEarTrainingScore,
    earTrainingHighScore,
    hasPlayedRiddleOnce,
    setHasPlayedRiddleOnce,
    tabResetKey,
    setTabResetKey,
    handleNextRiddle,
    handleRevealRiddle,
  };
}
