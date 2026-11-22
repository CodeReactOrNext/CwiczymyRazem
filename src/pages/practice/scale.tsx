// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import { generateScaleExercise, generateSingleStringScaleExercise } from "feature/exercisePlan/scales/scaleExerciseGenerator";
import { addBpmStage, updateScaleRecordBpm } from "feature/exercisePlan/services/bpmProgressService";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { BASE_ROOT_NOTE, isScaleTreeKey } from "feature/scaleTree/data/scaleTreeKeys";
import { isRecordRunClean, RECORD_PASS_ACCURACY } from "feature/scaleTree/data/scaleTreeRecords";
import { selectUserAuth } from "feature/user/store/userSlice";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

// Every scale-tree exam runs on the same clock — 90 s to hold the required BPM.
const EXAM_TIME_IN_MINUTES = 1.5;

export default function PracticeScalePage() {
  const router = useRouter();
  const { t } = useTranslation("scale_tree");
  const {
    type, pos, pattern, string: stringParam, exam, requiredBpm, nodeId,
    root, mode, exerciseId: exerciseIdParam,
  } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);
  const dispatch = useAppDispatch();

  // Key the tree sent us into. The fret (`pos`) already arrives transposed —
  // this only decides which notes the generator writes into the tab.
  const rootNote = isScaleTreeKey(root) ? root : BASE_ROOT_NOTE;
  // A record run is the same timed exam, just above the tree's own tempo.
  const isRecordRun = mode === 'record';

  const examMode = exam === 'true' && requiredBpm && nodeId
    ? { requiredBpm: Number(requiredBpm), nodeId: String(nodeId) }
    : undefined;

  useEffect(() => {
    if (!router.isReady || !type) return;

    const scaleType = type as ScaleType;

    // Single-string mode: ?type=minor_pentatonic&string=3
    if (stringParam) {
      const stringNum = parseInt(stringParam as string, 10);
      if (isNaN(stringNum) || stringNum < 1 || stringNum > 6) {
        router.replace("/scale-tree");
        return;
      }
      const exercise = generateSingleStringScaleExercise({ rootNote, scaleType, stringNum });
      if (exam === 'true') {
        exercise.timeInMinutes = EXAM_TIME_IN_MINUTES;
      }
      setPlan({
        id: `scale-plan-${exercise.id}`,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        difficulty: exercise.difficulty,
        exercises: [exercise],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userAuth ?? "anonymous",
        image: null,
      });
      return;
    }

    // Box-position mode: ?type=...&pos=...&pattern=...
    if (!pos) return;
    const position = parseInt(pos as string, 10);
    const patternType = (pattern as PatternType | undefined) ?? "ascending";

    if (isNaN(position)) {
      router.replace("/scale-tree");
      return;
    }

    const exercise = generateScaleExercise({ rootNote, scaleType, patternType, position });
    if (exam === 'true') {
      exercise.timeInMinutes = EXAM_TIME_IN_MINUTES;
    }
    setPlan({
      id: `scale-plan-${exercise.id}`,
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth ?? "anonymous",
      image: null,
    });
  }, [router.isReady, type, pos, pattern, stringParam, rootNote, exam, userAuth, router]);

  const isDataReady = router.isReady && !!plan;

  const handleExamComplete = async (accuracy: number) => {
    const exercise = plan?.exercises[0];
    if (!userAuth || !requiredBpm || !exercise) {
      setIsFinishing(true);
      router.push(backUrl);
      return;
    }
    // Progress is filed under the tree's own (C) exercise id whatever key the run
    // was played in — the same shape in another key is the same achievement.
    const progressExerciseId = typeof exerciseIdParam === 'string' ? exerciseIdParam : exercise.id;
    try {
      if (isRecordRun) {
        if (isRecordRunClean(accuracy)) {
          const { isNewRecord, previousBpm } = await updateScaleRecordBpm(
            userAuth,
            progressExerciseId,
            Number(requiredBpm),
            accuracy,
            rootNote,
            exercise.title,
            'theory'
          );
          toast[isNewRecord ? 'success' : 'message'](
            isNewRecord
              ? previousBpm
                ? t("toast.new_record_was", { bpm: requiredBpm, previous: previousBpm })
                : t("toast.new_record", { bpm: requiredBpm })
              : t("toast.record_stands", { bpm: previousBpm })
          );
        } else {
          toast.message(t("toast.no_record", { accuracy: RECORD_PASS_ACCURACY }));
        }
      } else {
        await addBpmStage(
          userAuth,
          progressExerciseId,
          Number(requiredBpm),
          exercise.title,
          'theory'
        );
        dispatch(updateQuestProgress({ type: 'tempo_cleared' }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFinishing(true);
      router.push(backUrl);
    }
  };

  const backUrl = nodeId ? `/scale-tree?fromExam=true&nodeId=${nodeId}` : "/scale-tree?fromExam=true";

  if (!isDataReady) {
    return <PracticeLoadingScreen isReady={false} />;
  }

  return (
    <PracticeSession
      plan={plan!}
      examMode={examMode}
      onClose={() => router.push(backUrl)}
      onFinish={() => {
        setIsFinishing(true);
        router.push(backUrl);
      }}
      onExamComplete={handleExamComplete}
      isFinishing={isFinishing}
      skipExitDialog={true}
    />
  );
}

PracticeScalePage.getInitialProps = withAuthInitialProps();
