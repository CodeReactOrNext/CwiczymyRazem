import { buttonVariants } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { PageTitle } from "components/PageTitle/PageTitle";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useSessionEntryGate } from "feature/sessionEntry/useSessionEntryGate";
import {
  RoadStripSkeleton,
  WhatNextRoadStrip,
} from "feature/whatNext/components/WhatNextWidget";
import { useFeatureGoals } from "feature/whatNext/hooks/useFeatureGoals";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import {
  ROAD_SESSION_MINUTES,
  useRoadSession,
} from "feature/whatNext/hooks/useRoadSession";
import { useTrackAction } from "feature/whatNext/hooks/useTrackAction";
import { useWhatNext } from "feature/whatNext/hooks/useWhatNext";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

/** The What Next page: the road, and the session it can turn into. */
export const WhatNextView = () => {
  const { t } = useNextMessage();
  const router = useRouter();
  const { result, isLoading: roadLoading } = useWhatNext("page");
  // The "use it once" goals add stops to the road too — wait for them as well.
  const { isLoading: goalsLoading } = useFeatureGoals();
  const isLoading = roadLoading || goalsLoading;
  const track = useTrackAction("page");
  const roadSession = useRoadSession(result?.ranked);
  const [session, setSession] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current || !result || isLoading) return;
    viewed.current = true;
    posthog.capture("what_next_viewed", {
      scope: "page",
      hero_source: result.hero?.source ?? null,
      actions: result.ranked.length,
    });
  }, [result, isLoading]);

  const sessionOpen = useSessionEntryGate(!!session);

  if (session && sessionOpen) {
    return (
      <MainContainer>
        <PracticeSession
          plan={session}
          onClose={() => setSession(null)}
          onFinish={() => {
            setIsFinishing(true);
            router.push("/report?returnTo=/next");
          }}
          isFinishing={isFinishing}
        />
      </MainContainer>
    );
  }

  const playRoad = roadSession.playable ? (
    <button
      type='button'
      onClick={() => {
        const plan = roadSession.build();
        if (plan) setSession(plan);
      }}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-cyan-400 hover:text-cyan-300")}>
      {t("road.play_all", { count: ROAD_SESSION_MINUTES })}
    </button>
  ) : null;

  return (
    <div className='flex flex-col'>
      <div className={cn("mx-auto w-full max-w-3xl", PAGE_CONTENT, "md:pt-10")}>
        <PageTitle title={t("page.title")} subtitle={t("page.subtitle")} />
        {/* The same card as after a session, with "play the whole road" added. */}
        <Card className='mt-6 flex flex-col bg-zinc-900 p-5 sm:p-6'>
          <LoadingSwap
            isLoading={isLoading || !result}
            skeleton={<RoadStripSkeleton />}>
            {() =>
              result && (
                <WhatNextRoadStrip
                  result={result}
                  playRoad={playRoad}
                  onOpen={track}
                />
              )
            }
          </LoadingSwap>
        </Card>
      </div>
    </div>
  );
};
