import { Skeleton } from "assets/components/ui/skeleton";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import MainContainer from "components/MainContainer";
import { roadWaveX } from "components/RoadPath/RoadPath";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { WhatNextRoad } from "feature/whatNext/components/WhatNextRoad";
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

const RoadSkeleton = () => (
  <div className='flex flex-col items-center gap-14 pt-12'>
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton
        key={index}
        className='h-20 w-20 rounded-full'
        style={{ transform: `translateX(${roadWaveX(index)}px)` }}
      />
    ))}
  </div>
);

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
      claims: result.claims.length,
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
      className='rounded px-1 text-xs font-semibold text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:text-cyan-300'>
      {t("road.play_all", { count: ROAD_SESSION_MINUTES })}
    </button>
  ) : null;

  return (
    <div className='relative min-h-full overflow-hidden rounded-lg bg-zinc-950 px-3 pb-24 pt-8 md:px-10'>
      {/* The same tiled watermark Journey's road runs over. */}
      <GuitarPatternBackground className='pointer-events-none absolute inset-0 h-full w-full' />
      <h1 className='relative text-center font-display text-3xl font-black tracking-tight text-zinc-100'>
        {t("page.title")}
      </h1>
      <LoadingSwap isLoading={isLoading || !result} skeleton={<RoadSkeleton />}>
        {() =>
          result && (
            <WhatNextRoad result={result} playRoad={playRoad} onOpen={track} />
          )
        }
      </LoadingSwap>
    </div>
  );
};
