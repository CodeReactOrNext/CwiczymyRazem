import "lib/i18n/fullCatalog";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Card } from "assets/components/ui/card";
import {
  WidgetHeader,
  WidgetLink,
} from "feature/dashboard/components/widgets/WidgetHeader";
import { journeyModules } from "feature/journey/data/journeyModules";
import { buildModuleWithStatus } from "feature/journey/utils/journeyStatus";
import { JourneyPath } from "feature/journey/view/components/JourneyPath";
import { WhatNextRoadStrip } from "feature/whatNext/components/WhatNextWidget";
import { FEATURE_GOAL_IDS } from "feature/whatNext/data/featureGoals";
import { featureGoalsQueryKey } from "feature/whatNext/hooks/useFeatureGoals";
import type { WhatNextSnapshot } from "feature/whatNext/types/whatNext.types";
import { buildWhatNext } from "feature/whatNext/utils/buildWhatNext";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

/**
 * Dev-only harness: the What Next road and the Home strip on fixture data,
 * with no Firebase, so the UI can be screenshotted headlessly. Not linked
 * from any nav; renders nothing outside development.
 *
 *   ?view=widget   the card after a session
 *   ?view=journey  Journey's road, on the same shared component
 *   ?state=empty   nothing left to do
 */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const fixture = (now: number, empty: boolean): WhatNextSnapshot =>
  empty
    ? {
        now,
        lvl: 12,
        points: 9000,
        sessionCount: 80,
        availableSkillPoints: 0,
        goals: [],
        songs: { learning: [], wantToLearn: [], learnedCount: 4 },
      }
    : {
        now,
        lvl: 12,
        points: 9000,
        sessionCount: 80,
        availableSkillPoints: 2,
        streak: {
          dayWithoutBreak: 12,
          didPracticeToday: false,
          dayEndsAt: now + 7 * HOUR,
        },
        dailyQuest: {
          date: "2026-11-07",
          isRewardClaimed: false,
          tasks: [
            {
              id: "t1",
              type: "practice_theory_time",
              title: "Theory",
              isCompleted: false,
              progress: 4,
              target: 10,
            },
          ],
        },
        dailyQuestReward: { fame: 40, points: 10 },
        rewards: {
          caseTokens: 1,
          achievementsClaimable: 2,
          achievementsPending: { fame: 85, caseTokens: 0, parts: [] },
        },
        dailyExercise: {
          exerciseId: "alternate_picking_1",
          title: "Alternate picking",
          myRank: 7,
          players: 23,
          endsAt: now + 9 * HOUR,
        },
        goals: [
          {
            id: "g1",
            exerciseId: "spider_1",
            exerciseTitle: "Spider 1-2-3-4",
            startBpm: 80,
            stepBpm: 10,
            targetBpm: 120,
            stageBpm: 120,
            strictness: "standard",
            counting: "total",
            cleanRuns: 2,
            status: "active",
            createdAt: now - 20 * DAY,
            completedAt: null,
          },
        ],
        songs: {
          learning: [
            {
              id: "s1",
              title: "Wonderwall",
              artist: "Oasis",
              lastPracticedAt: now - 9 * DAY,
              hasGpFile: false,
            },
          ],
          wantToLearn: [],
          learnedCount: 3,
        },
        rotation: { rusty: 3, cooling: 2, total: 12 },
        challenge: {
          id: "2026-11",
          total: 4,
          cleared: 2,
          daysLeft: 23,
          endsAt: now + 23 * DAY,
        },
        roadmapSteps: [
          {
            roadmapId: "r1",
            roadmapTitle: "John Mayer",
            stepId: "s3",
            title: "Slow blues phrasing",
          },
        ],
      };

/** The first module with three steps done and the fourth started. */
const journeyModule = () => {
  const first = journeyModules[0];
  const steps = first.stages.flatMap((stage) => stage.steps);
  return buildModuleWithStatus(first, {
    userId: "dev",
    updatedAt: "",
    moduleProgress: {
      [first.id]: {
        steps: Object.fromEntries([
          ...steps
            .slice(0, 3)
            .map((step) => [step.id, { completed: true, stars: 3 as const }]),
          [steps[3].id, { completed: false, startedAt: "2026-11-01" }],
        ]),
      },
    },
  });
};

const WhatNextPreview = () => {
  const router = useRouter();
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    // No one is signed in here: seed the goals under the signed-out key, two
    // done since the baseline and three to go to the next free case.
    const done = new Set(["first_session", "first_song"]);
    queryClient.setQueryData([...featureGoalsQueryKey(null), 0], {
      goals: FEATURE_GOAL_IDS.map((id) => ({ id, done: done.has(id) })),
      cases: { counted: 2, earned: 0, paid: 0, owed: 0, toNext: 3 },
      paidNow: 0,
    });
    return queryClient;
  });
  const [now] = useState(() => Date.now());
  const empty = router.query.state === "empty";
  const result = useMemo(
    () => buildWhatNext(fixture(now, empty)),
    [now, empty],
  );

  if (process.env.NODE_ENV === "production" || !router.isReady) return null;

  return (
    <QueryClientProvider client={client}>
      <div className='min-h-screen bg-zinc-950 px-4 py-8'>
        {router.query.view === "journey" ? (
          <JourneyPath
            module={journeyModule()}
            onStepClick={() => undefined}
            onBack={() => undefined}
          />
        ) : router.query.view === "widget" ? (
          <div className='mx-auto max-w-2xl'>
            <Card className='flex flex-col p-5 sm:p-6'>
              <WidgetHeader
                title='What Next'
                action={<WidgetLink href='#'>Full road</WidgetLink>}
              />
              <WhatNextRoadStrip result={result} onOpen={() => undefined} />
            </Card>
          </div>
        ) : (
          <div className='mx-auto w-full max-w-3xl'>
            <h1 className='font-display text-3xl font-black tracking-tight text-zinc-100'>
              What Next
            </h1>
            <Card className='mt-6 flex flex-col p-5 sm:p-6'>
              <WhatNextRoadStrip
                result={result}
                onOpen={() => undefined}
                playRoad={
                  <span className='text-xs font-semibold text-cyan-400'>
                    Play the whole road · 30 min
                  </span>
                }
              />
            </Card>
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
};

export default dynamic(() => Promise.resolve(WhatNextPreview), { ssr: false });
