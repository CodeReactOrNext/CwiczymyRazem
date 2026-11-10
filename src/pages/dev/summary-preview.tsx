// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import { exerciseRunsKey } from "feature/exerciseGoals/hooks/useExerciseGoals";
import type { ExerciseRun } from "feature/exerciseGoals/types/exerciseGoal.types";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { ExerciseSuccessView } from "feature/exercisePlan/views/PracticeSession/components/ExerciseSuccessView";
import { TurnedScreen } from "feature/exercisePlan/views/PracticeSession/components/TurnedScreen";
import type { RunNote } from "feature/exercisePlan/views/PracticeSession/utils/timingGrade";
import type { ExerciseRankNeighbors } from "feature/leadboard/services/getExerciseRankNeighbors";
import { restoreUserSnapshot } from "feature/user/store/userSlice";
import type { UserSnapshot } from "feature/user/store/userSnapshot";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";

/**
 * Dev-only harness: the run summary modal and the post-session summary page on
 * fixture data, with no Firebase auth or Firestore, so both can be
 * screenshotted headlessly. Not linked from any nav; renders nothing outside
 * development.
 *
 *   (default)       the post-session summary, as the desktop session shows it
 *   ?wrap=mobile    the same, in the phone's full-screen wrapper
 *   ?state=rest     a session too short to earn a point
 *   ?view=modal     the run summary after a scored exercise
 *   ?view=exam      the run summary after a passed exam
 *   ?view=plain     the run summary of an exercise that was not scored
 *   &turn=1         either one laid on its side, as on an upright phone
 */
const UID = "dev-summary-preview";
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const EXERCISE_ID = "spider_basic";
const EXERCISE_TITLE = "Spider walk, four frets";

const LVL = 12;
const SESSION_POINTS = 86;
const LEVEL_START = getPointsToLvlUp(LVL - 1);
const LEVEL_END = getPointsToLvlUp(LVL);
const POINTS = Math.round(LEVEL_START + (LEVEL_END - LEVEL_START) * 0.64);

const SESSION_TIME = { technique: 18 * MIN, theory: 6 * MIN, hearing: 0, creativity: 4 * MIN };

const CURRENT_STATS: StatisticsDataInterface = {
  ...statisticsInitial,
  lvl: LVL,
  points: POINTS,
  fame: 4_820,
  actualDayWithoutBreak: 9,
  dayWithoutBreak: 9,
  sessionCount: 64,
  lastReportDate: new Date().toISOString(),
  time: {
    technique: 40 * 60 * MIN,
    theory: 9 * 60 * MIN,
    hearing: 5 * 60 * MIN,
    creativity: 12 * 60 * MIN,
    longestSession: 95 * MIN,
  },
  achievements: ["time_1", "fire", "points_1"],
};

const PREVIOUS_STATS: StatisticsDataInterface = {
  ...CURRENT_STATS,
  points: POINTS - SESSION_POINTS,
  time: {
    ...CURRENT_STATS.time,
    technique: CURRENT_STATS.time.technique - SESSION_TIME.technique,
    theory: CURRENT_STATS.time.theory - SESSION_TIME.theory,
    creativity: CURRENT_STATS.time.creativity - SESSION_TIME.creativity,
  },
  achievements: ["time_1", "fire"],
};

const REPORT: ReportDataInterface = {
  reportDate: new Date(),
  totalPoints: SESSION_POINTS,
  fameEarned: 42,
  fameStreakBonus: 9,
  fameRigBonus: 8,
  fameChainBonus: 3,
  fameTraitBonus: 4,
  fameAccuracyBonus: true,
  bonusPoints: {
    multiplier: 0.2,
    habitsCount: 2,
    additionalPoints: 10,
    time: SESSION_TIME.technique + SESSION_TIME.theory + SESSION_TIME.creativity,
    timePoints: 62,
  },
  skillPointsGained: { technique: 3, theory: 1, creativity: 1 },
};

const REST_REPORT: ReportDataInterface = {
  reportDate: new Date(),
  totalPoints: 0,
  fameEarned: 0,
  bonusPoints: { multiplier: 0, habitsCount: 0, additionalPoints: 0, time: 70 * 1000, timePoints: 0 },
};

// Minutes practised per day, oldest first, ending today.
const DAILY_MINUTES = [0, 25, 40, 0, 35, 20, 30, 45, 15, 0, 50, 35, 22, 28];
const ACTIVITY = DAILY_MINUTES.flatMap((minutes, index) => {
  if (minutes === 0) return [];
  const date = new Date(Date.now() - (DAILY_MINUTES.length - 1 - index) * DAY);
  return [
    {
      date: date.toISOString(),
      techniqueTime: minutes * MIN * 0.55,
      theoryTime: minutes * MIN * (index % 2 ? 0.25 : 0.1),
      hearingTime: minutes * MIN * (index % 3 ? 0.05 : 0.2),
      creativityTime: minutes * MIN * 0.15,
    },
  ];
});

const SCORED_RUNS: ScoredRun[] = [
  {
    exerciseId: EXERCISE_ID,
    exerciseTitle: EXERCISE_TITLE,
    score: 18_450,
    scoreType: "mic",
    previousBest: 17_200,
    bpm: 110,
  },
];

const neighbor = (rank: number, displayName: string, score: number, bpm: number) => ({
  userId: `rival-${rank}`,
  displayName,
  avatar: "",
  score,
  bpm,
  rank,
});

const STANDING: ExerciseRankNeighbors = {
  rank: 7,
  above: [neighbor(5, "Marek_Shred", 19_900, 120), neighbor(6, "lydian.dom", 18_720, 115)],
  below: [neighbor(8, "Kasia G.", 18_100, 110), neighbor(9, "tubescreamer", 17_640, 105)],
};

const RUN_HISTORY: ExerciseRun[] = (
  [
    [90, 88],
    [95, 91],
    [100, 86],
    [100, 93],
    [105, 90],
    [110, 87],
    [110, 94],
  ] as const
).map(([bpm, accuracy], index, all) => ({
  id: `run-${index}`,
  exerciseId: EXERCISE_ID,
  bpm,
  accuracy,
  source: "practice",
  goalId: null,
  clean: null,
  createdAt: Date.now() - (all.length - index) * DAY,
  timingOffsetMs: Math.max(16, 58 - index * 6),
  timingBiasMs: index < 4 ? -18 : -6,
}));

// A run that starts a little early and settles; a few loose notes and two misses.
const NOTE_LOG: RunNote[] = Array.from({ length: 64 }, (_, i) => {
  if (i === 23 || i === 47) return { hit: false, timingMs: null, cents: null };
  const drift = -70 * Math.exp(-i / 14);
  const wobble = Math.sin(i * 1.7) * 38 + Math.cos(i * 0.6) * 22;
  const spike = i % 17 === 9 ? 150 : 0;
  return { hit: true, timingMs: Math.round(drift + wobble + spike), cents: null };
});

const TIMELINE = NOTE_LOG.map((note) => (note.hit ? ("hit" as const) : ("miss" as const)));

const seededClient = (runs: ScoredRun[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(
    ["sessionExerciseStandings", UID, runs.map((run) => `${run.exerciseId}:${Math.max(run.score, run.previousBest)}`).join("|")],
    runs.map((run) => ({ run, neighbors: STANDING })),
  );
  client.setQueryData(exerciseRunsKey(UID, EXERCISE_ID), RUN_HISTORY);
  return client;
};

const noop = () => undefined;

const ModalPreview = ({ view, turned }: { view: string; turned: boolean }) => {
  if (view === "exam") {
    return (
      <ExerciseSuccessView
        planTitle={EXERCISE_TITLE}
        examMode
        score={18_450}
        maxScore={21_000}
        examAccuracy={91}
        stats={{ accuracy: 91, maxStreak: 41 }}
        timeline={TIMELINE}
        timing={{ 3: 48, 2: 11, 1: 3 }}
        timingPrecision={{ medianOffsetMs: 34, biasMs: -22, measuredNotes: 62 }}
        noteLog={NOTE_LOG}
        turned={turned}
        onRestart={noop}
        onFinish={noop}
      />
    );
  }
  if (view === "plain") {
    return <ExerciseSuccessView planTitle={EXERCISE_TITLE} turned={turned} onFinish={noop} />;
  }
  return (
    <ExerciseSuccessView
      planTitle={EXERCISE_TITLE}
      score={18_450}
      maxScore={21_000}
      stats={{ accuracy: 94, maxStreak: 41 }}
      timeline={TIMELINE}
      timing={{ 3: 48, 2: 11, 1: 3 }}
      timingPrecision={{ medianOffsetMs: 34, biasMs: -22, measuredNotes: 62 }}
      noteLog={NOTE_LOG}
      turned={turned}
      onRestart={noop}
      onFinish={noop}
    />
  );
};

function SummaryPreview() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [client] = useState(() => seededClient(SCORED_RUNS));
  // Before the first render, so the cards that read the player find one.
  useState(() => {
    dispatch(
      restoreUserSnapshot({
        userAuth: UID,
        userInfo: { displayName: "Riffer", avatar: "" } as unknown as UserSnapshot["userInfo"],
        currentUserStats: CURRENT_STATS,
      }),
    );
    return true;
  });

  if (process.env.NODE_ENV === "production" || !router.isReady) return null;

  const turned = router.query.turn === "1";
  const view = typeof router.query.view === "string" ? router.query.view : "page";
  if (view !== "page") {
    return (
      <div className='min-h-screen bg-zinc-950'>
        <ModalPreview view={view} turned={turned} />
      </div>
    );
  }

  const isRest = router.query.state === "rest";
  const summary = (hideWrapper: boolean) => (
    <RatingPopUp
      ratingData={isRest ? REST_REPORT : REPORT}
      currentUserStats={isRest ? PREVIOUS_STATS : CURRENT_STATS}
      previousUserStats={PREVIOUS_STATS}
      activityData={ACTIVITY}
      scoredRuns={isRest ? [] : SCORED_RUNS}
      hideWrapper={hideWrapper}
      onClick={noop}
      onRestart={noop}
    />
  );

  return (
    <QueryClientProvider client={client}>
      {router.query.wrap === "mobile" ? (
        // PracticeSession's phone wrapper.
        <TurnedScreen turned={turned} className='bg-zinc-950'>
          {summary(false)}
        </TurnedScreen>
      ) : (
        // DesktopSessionView's wrapper once the report is in.
        <div className='font-openSans fixed inset-0 overflow-y-auto bg-zinc-950'>
          <div className='relative z-10 mx-auto max-w-7xl px-4 pb-64 pt-8'>{summary(true)}</div>
        </div>
      )}
    </QueryClientProvider>
  );
}

// Client-only: the fixtures render nothing on the server, and a server/client
// split here would only ever show up as a hydration error.
export default dynamic(() => Promise.resolve(SummaryPreview), { ssr: false });
