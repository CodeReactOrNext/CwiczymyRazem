import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useRouter } from "next/router";
import { useMemo } from "react";

/**
 * Dev-only harness: renders PracticeSession with static fixture tablature and
 * no Firebase auth, so the 3D highway / 2D tab styling can be screenshotted
 * headlessly. Not linked from any nav; 404s outside development.
 */
export default function HighwayPreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const plan = useMemo<ExercisePlan | null>(() => {
    if (!router.isReady) return null;

    if (router.query.songMode === "1") {
      // Mirrors the synthetic exercise built in src/pages/songs/practice/[songId].tsx —
      // a "song" has no fixture tablature of its own, only whatever a GP file provides.
      const exercise = {
        id: `song-dev-preview`,
        title: "Dev Song Preview",
        description: "Dev Artist",
        difficulty: "medium",
        category: "mixed",
        timeInMinutes: 10,
        instructions: [],
        tips: [],
        metronomeSpeed: { min: 40, max: 240, recommended: 120 },
        relatedSkills: [],
        imageUrl: null,
      } as any;
      return {
        id: `song-practice-dev-preview`,
        title: exercise.title,
        difficulty: "medium",
        description: exercise.description,
        category: "mixed",
        exercises: [exercise],
        userId: "system",
        image: null,
        song: { id: "dev", title: exercise.title, artist: exercise.description },
      };
    }

    const exerciseId = ((id as string) || "spider-basic").replace(/-/g, "_");
    const exercise = exercisesAgregat.find((ex) => ex.id === exerciseId);
    if (!exercise) return null;

    return {
      id: `exercise-${exercise.id}`,
      title: exercise.title,
      description: `Preview session for ${exercise.title}`,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "dev-preview",
      image: (exercise.imageUrl || "") as any,
    };
  }, [id, router.isReady, router.query.songMode]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (!router.isReady || !plan) {
    return <PracticeLoadingScreen isReady={false} />;
  }

  return (
    <PracticeSession
      plan={plan}
      onClose={() => { /* dev preview — no-op */ }}
      onFinish={() => { /* dev preview — no-op */ }}
      isFinishing={false}
      freeMode={router.query.freeMode === "1"}
    />
  );
}
