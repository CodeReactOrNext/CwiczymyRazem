import { getDuelExercise } from "feature/duels/data/duelPool";
import { fetchDuel } from "feature/duels/services/duels.service";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { logger } from "feature/logger/Logger";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

/**
 * A duel run: the duel's exercise, played like any single exercise, with its
 * scored runs sent to the duel. Opened only from the duels page, and only
 * while the duel is still taking the player's runs — not after the deadline,
 * not once they pressed Ready. Anything else goes back there.
 */
export default function DuelPracticePage() {
  const router = useRouter();
  const userAuth = useRequireUserAuth();
  const duelId =
    typeof router.query.duelId === "string" ? router.query.duelId : null;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!router.isReady || !userAuth || !duelId) return undefined;
    let cancelled = false;
    fetchDuel(duelId)
      .then((duel) => {
        if (cancelled) return;
        const found = getDuelExercise(duel.exerciseId);
        if (
          duel.status !== "active" ||
          duel.me.isReady ||
          Date.now() >= duel.endsAt ||
          !found
        ) {
          router.replace({ pathname: "/duels", query: { duel: duelId } });
          return;
        }
        setExercise(found);
      })
      .catch((error) => {
        logger.error(error, { context: "DuelPracticePage" });
        router.replace("/duels");
      });
    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, userAuth, duelId]);

  const plan = useMemo<ExercisePlan | null>(() => {
    if (!exercise || !duelId || !userAuth) return null;
    return {
      id: `duel-${duelId}`,
      // What the feed and Live now show for this session — never the exercise.
      title: "Duel",
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth,
      image: null,
      duel: { id: duelId },
    };
  }, [exercise, duelId, userAuth]);

  const backToDuels = () => {
    router.push({ pathname: "/duels", query: duelId ? { duel: duelId } : {} });
  };

  // The in-app player, not a landing page — keep it out of the index.
  const noIndex = (
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (!router.isReady || !plan) {
    return (
      <>
        {noIndex}
        <PracticeLoadingScreen isReady={false} />
      </>
    );
  }

  return (
    <>
      {noIndex}
      <PracticeSession
        plan={plan}
        onClose={backToDuels}
        onFinish={() => {
          setIsFinishing(true);
          backToDuels();
        }}
        isFinishing={isFinishing}
      />
    </>
  );
}
