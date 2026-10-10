import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { PROGRESS_TABS } from "constants/navTabs";
import { GoalRunVerdict } from "feature/exerciseGoals/components/GoalRunVerdict";
import { GoalsPanel } from "feature/exerciseGoals/components/GoalsPanel";
import {
  exerciseHistoryKey,
  exerciseRunsKey,
} from "feature/exerciseGoals/hooks/useExerciseGoals";
import type {
  ExerciseGoal,
  ExerciseRun,
  NewExerciseGoal,
} from "feature/exerciseGoals/types/exerciseGoal.types";
import { isGoalEligibleExercise } from "feature/exerciseGoals/utils/goalRules";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { ExerciseSuccessView } from "feature/exercisePlan/views/PracticeSession/components/ExerciseSuccessView";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";

/**
 * Dev-only harness: the goals panel and the goal-run summary on fixture data,
 * with no Firebase auth or Firestore, so the UI can be screenshotted headlessly.
 * Not linked from any nav; renders nothing outside development.
 *
 *   ?state=empty        no goals yet
 *   ?completed=g-done   back from goal mode with a goal just reached
 *   ?view=verdicts      every goal-run verdict
 *   ?view=summary       the run summary with a verdict in it
 */
const UID = "dev-preview";
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 10);

const [first, second, third] = exercisesAgregat.filter(isGoalEligibleExercise);

const goal = (
  overrides: Partial<ExerciseGoal> &
    Pick<ExerciseGoal, "id" | "exerciseId" | "exerciseTitle">,
): ExerciseGoal => ({
  targetBpm: 115,
  strictness: "standard",
  counting: "streak",
  cleanRuns: 0,
  status: "active",
  createdAt: NOW - 20 * DAY,
  completedAt: null,
  ...overrides,
});

const FIXTURE_GOALS: ExerciseGoal[] = [
  goal({
    id: "g-1",
    exerciseId: first.id,
    exerciseTitle: first.title,
    targetBpm: 115,
    cleanRuns: 2,
  }),
  goal({
    id: "g-2",
    exerciseId: second.id,
    exerciseTitle: second.title,
    targetBpm: 140,
    strictness: "strict",
    counting: "total",
  }),
  goal({
    id: "g-done",
    exerciseId: third.id,
    exerciseTitle: third.title,
    targetBpm: 100,
    cleanRuns: 3,
    status: "completed",
    completedAt: NOW - 2 * DAY,
  }),
];

const runs = (
  exerciseId: string,
  points: [number, number, "practice" | "goal", boolean | null][],
): ExerciseRun[] =>
  points.map(([bpm, accuracy, source, clean], index) => ({
    id: `${exerciseId}-${index}`,
    exerciseId,
    bpm,
    accuracy,
    source,
    goalId: null,
    clean,
    createdAt: NOW - (points.length - index) * DAY,
    // Timing tightens as the tempo climbs in — the shape a real climb tends to have.
    timingOffsetMs: Math.max(14, 62 - index * 6),
    timingBiasMs: index < 4 ? -18 : -6,
  }));

const seededClient = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(
    exerciseRunsKey(UID, first.id),
    runs(first.id, [
      [90, 94, "practice", null],
      [95, 91, "practice", null],
      [100, 88, "practice", null],
      [100, 95, "practice", null],
      [105, 90, "practice", null],
      [115, 78, "goal", false],
      [110, 93, "practice", null],
      [115, 92, "goal", true],
      [115, 94, "goal", true],
    ]),
  );
  // Sessions from before the goal, as the activity log remembers them.
  client.setQueryData(
    exerciseHistoryKey(UID, first.id),
    runs(first.id, [
      [70, 96, "practice", null],
      [75, 93, "practice", null],
      [80, 90, "practice", null],
      [85, 88, "practice", null],
    ]).map((run) => ({
      ...run,
      id: `h-${run.id}`,
      createdAt: run.createdAt - 30 * DAY,
      timingOffsetMs: null,
      timingBiasMs: null,
    })),
  );
  client.setQueryData(exerciseRunsKey(UID, second.id), []);
  client.setQueryData(exerciseHistoryKey(UID, second.id), []);
  return client;
};

const VerdictGallery = () => {
  const active = FIXTURE_GOALS[0];
  return (
    <div className='mx-auto grid max-w-lg gap-6 p-6'>
      <GoalRunVerdict state={{ kind: "saving" }} />
      <GoalRunVerdict state={{ kind: "not_scored" }} />
      <GoalRunVerdict
        state={{
          kind: "judged",
          goal: active,
          run: { bpm: 115, accuracy: 94 },
          outcome: {
            clean: true,
            reason: "clean",
            cleanRuns: 2,
            justCompleted: false,
            streakReset: false,
          },
        }}
      />
      <GoalRunVerdict
        state={{
          kind: "judged",
          goal: active,
          run: { bpm: 115, accuracy: 84 },
          outcome: {
            clean: false,
            reason: "accuracy",
            cleanRuns: 0,
            justCompleted: false,
            streakReset: true,
          },
        }}
      />
      <GoalRunVerdict
        state={{
          kind: "judged",
          goal: active,
          run: { bpm: 104, accuracy: 97 },
          outcome: {
            clean: false,
            reason: "too_slow",
            cleanRuns: 1,
            justCompleted: false,
            streakReset: false,
          },
        }}
      />
      <GoalRunVerdict
        state={{
          kind: "judged",
          goal: { ...active, status: "completed" },
          run: { bpm: 116, accuracy: 96 },
          outcome: {
            clean: true,
            reason: "clean",
            cleanRuns: 3,
            justCompleted: true,
            streakReset: false,
          },
        }}
      />
    </div>
  );
};

const SummaryPreview = () => {
  return (
    <ExerciseSuccessView
      planTitle={first.title}
      score={18450}
      maxScore={21000}
      stats={{ accuracy: 94, maxStreak: 41 }}
      timing={{ 3: 52, 2: 9, 1: 3 }}
      eyebrow='Goal run · 115 BPM'
      offerRestart
      onRestart={() => undefined}
      onFinish={() => undefined}
      extraContent={
        <GoalRunVerdict
          state={{
            kind: "judged",
            goal: FIXTURE_GOALS[0],
            run: { bpm: 115, accuracy: 94 },
            outcome: {
              clean: true,
              reason: "clean",
              cleanRuns: 2,
              justCompleted: false,
              streakReset: false,
            },
          }}
        />
      }
    />
  );
};

const PanelPreview = () => {
  const router = useRouter();
  const [client] = useState(seededClient);
  const [goals, setGoals] = useState<ExerciseGoal[]>(() =>
    router.query.state === "empty" ? [] : FIXTURE_GOALS,
  );

  const handleCreate = async (created: NewExerciseGoal) => {
    // No Firestore here: the new goal's chart starts from an empty run list.
    client.setQueryData(exerciseRunsKey(UID, created.exerciseId), []);
    client.setQueryData(exerciseHistoryKey(UID, created.exerciseId), []);
    setGoals((current) => [
      {
        ...created,
        id: `g-${current.length + 1}`,
        cleanRuns: 0,
        status: "active",
        createdAt: NOW,
        completedAt: null,
      },
      ...current,
    ]);
    return true;
  };

  return (
    <QueryClientProvider client={client}>
      <div className='min-h-screen bg-zinc-950 p-0 md:p-6'>
        <div className='mx-auto flex min-h-screen max-w-6xl flex-col rounded-lg bg-second-600'>
          <HeroBanner
            title='Goals'
            subtitle='Set a tempo for an exercise and play it clean three times'
            eyebrow='Your goals'
            eyebrowClassName='text-emerald-400/80'
            backgroundContent={<HeroPattern />}
            className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none'
          />
          <div className='px-3 md:px-6 lg:px-8'>
            <PageTabs
              tabs={PROGRESS_TABS}
              activeHref='/goals'
              ariaLabel='Progress sections'
            />
          </div>
          <GoalsPanel
            uid={UID}
            goals={goals}
            isLoading={false}
            isCreating={false}
            onCreate={handleCreate}
            onDelete={async (goalId) =>
              setGoals((current) => current.filter((g) => g.id !== goalId))
            }
            completedId={
              typeof router.query.completed === "string"
                ? router.query.completed
                : null
            }
            onCompletedSeen={() => undefined}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
};

function GoalsPreview() {
  const router = useRouter();
  if (process.env.NODE_ENV === "production" || !router.isReady) return null;
  if (router.query.view === "verdicts") return <VerdictGallery />;
  if (router.query.view === "summary") return <SummaryPreview />;
  return <PanelPreview />;
}

// Client-only: the fixtures render nothing on the server, and a server/client
// split here would only ever show up as a hydration error.
export default dynamic(() => Promise.resolve(GoalsPreview), { ssr: false });
