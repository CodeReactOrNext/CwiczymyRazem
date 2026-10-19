import { getBoss } from "feature/bosses/data/fretweaver";
import { useBossFight } from "feature/bosses/hooks/useBossFight";
import { useBossRecord } from "feature/bosses/hooks/useBossProgress";
import type { BossDefinition } from "feature/bosses/types/boss.types";
import { buildPhaseExercise } from "feature/bosses/utils/spiderTab";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface BossFightSessionProps {
  boss: BossDefinition;
  userId: string;
  onLeave: () => void;
}

const BossFightSession = ({ boss, userId, onLeave }: BossFightSessionProps) => {
  const [isFinishing, setIsFinishing] = useState(false);
  const { record, saveRun } = useBossRecord(userId, boss.id);
  const { config, variation } = useBossFight({ boss, record, onRunEnd: saveRun });

  const plan = useMemo<ExercisePlan>(() => {
    const exercise = buildPhaseExercise(boss, variation);
    return {
      id: `boss-${boss.id}`,
      title: boss.name,
      description: boss.title,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      image: null,
      boss: { id: boss.id },
    };
  }, [boss, variation, userId]);

  return (
    <PracticeSession
      plan={plan}
      bossFight={config}
      onClose={onLeave}
      onFinish={() => {
        setIsFinishing(true);
        onLeave();
      }}
      isFinishing={isFinishing}
    />
  );
};

/**
 * A boss fight: one endless run, a new phase dealt in place every time the
 * boss's HP runs out. Opened from /bosses; an unknown boss goes back there.
 */
export default function BossFightPage() {
  const router = useRouter();
  // Null while a refreshed session restores; a signed-out one goes to /login.
  const userAuth = useRequireUserAuth();
  const bossId = typeof router.query.bossId === "string" ? router.query.bossId : "";
  const boss = getBoss(bossId);

  useEffect(() => {
    if (router.isReady && !boss) router.replace("/bosses");
  }, [router, boss]);

  // The in-app player, not a landing page — keep it out of the index.
  const noIndex = (
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (!router.isReady || !boss || !userAuth) {
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
      <BossFightSession boss={boss} userId={userAuth} onLeave={() => router.push("/bosses")} />
    </>
  );
}
