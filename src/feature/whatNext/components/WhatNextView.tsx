import { buttonVariants } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import MainContainer from "components/MainContainer";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import {
  RoadStripSkeleton,
  WhatNextRoadStrip,
} from "feature/whatNext/components/WhatNextWidget";
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
  const { result, isLoading } = useWhatNext("page");
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

  if (session) {
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
    <div className='mx-auto w-full max-w-3xl px-3 pb-24 pt-8 md:px-6'>
      <h1 className='font-display text-3xl font-black tracking-tight text-zinc-100'>
        {t("page.title")}
      </h1>
      <p className='mt-2 max-w-xl text-sm leading-relaxed text-zinc-400'>
        {t("page.subtitle")}
      </p>
      {/* The same card as after a session, with "play the whole road" added. */}
      <Card className='mt-6 flex flex-col p-5 sm:p-6'>
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
  );
};
