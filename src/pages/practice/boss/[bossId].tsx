import { getBoss } from "feature/bosses/data/bosses";
import { useBossFight } from "feature/bosses/hooks/useBossFight";
import { useBossRecord } from "feature/bosses/hooks/useBossProgress";
import type { BossDefinition, BossDifficulty } from "feature/bosses/types/boss.types";
import { buildBossExercise } from "feature/bosses/utils/bossExercise";
import { parseDifficulty, validStart } from "feature/bosses/utils/difficulty";
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
  difficulty: BossDifficulty;
  /** The savepoint asked for — checked against the record before the run starts. */
  askedStart: unknown;
  onLeave: () => void;
}

interface BossFightRunProps extends BossFightSessionProps {
  record: ReturnType<typeof useBossRecord>["record"];
  saveRun: ReturnType<typeof useBossRecord>["saveRun"];
}

const BossFightRun = ({ boss, userId, difficulty, askedStart, record, saveRun, onLeave }: BossFightRunProps) => {
  const [isFinishing, setIsFinishing] = useState(false);
  // Only a savepoint the record has opened; the first phase otherwise. Read
  // once, on entry: the record changes as runs are banked (and rolled back
  // when a save fails), and a new start phase would deal a new run mid-fight.
  const [startPhase] = useState(() => validStart(record, difficulty, askedStart));
  const { config, plan: phase, bpm } = useBossFight({ boss, record, difficulty, startPhase, onRunEnd: saveRun });

  const plan = useMemo<ExercisePlan>(() => {
    const exercise = buildBossExercise(boss, phase, bpm);
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
  }, [boss, phase, bpm, userId]);

  // The store still holds the last fight until the entry effect deals this
  // boss's — don't hand the session another boss's tab in between.
  if (phase.kind !== boss.drill) return <PracticeLoadingScreen isReady={false} />;

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

const BossFightSession = ({ boss, userId, difficulty, askedStart, onLeave }: BossFightSessionProps) => {
  const { record, isLoading, saveRun } = useBossRecord(userId, boss.id);
  if (isLoading) return <PracticeLoadingScreen isReady={false} />;
  return (
    <BossFightRun
      // A new difficulty or savepoint in the address is a new entry.
      key={`${difficulty}:${String(askedStart)}`}
      boss={boss}
      userId={userId}
      difficulty={difficulty}
      askedStart={askedStart}
      onLeave={onLeave}
      record={record}
      saveRun={saveRun}
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
      <BossFightSession
        boss={boss}
        userId={userAuth}
        difficulty={parseDifficulty(router.query.difficulty)}
        askedStart={router.query.start}
        onLeave={() => router.push("/bosses")}
      />
    </>
  );
}
