import { Skeleton } from "assets/components/ui/skeleton";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import MainContainer from "components/MainContainer";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { ClaimStrip } from "feature/whatNext/components/ClaimStrip";
import { NextActionHero } from "feature/whatNext/components/NextActionHero";
import { NextActionRow } from "feature/whatNext/components/NextActionRow";
import { SessionLauncher } from "feature/whatNext/components/SessionLauncher";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useTrackAction } from "feature/whatNext/hooks/useTrackAction";
import { useWhatNext } from "feature/whatNext/hooks/useWhatNext";
import type { NextActionLane } from "feature/whatNext/types/whatNext.types";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

const LANES: NextActionLane[] = ["today", "inProgress", "week", "horizon"];

const WhatNextSkeleton = () => (
  <div className='space-y-8'>
    <Skeleton variant='block' className='h-52 w-full' />
    {Array.from({ length: 2 }).map((_, lane) => (
      <div key={lane} className='space-y-3'>
        <Skeleton className='h-4 w-28' />
        {Array.from({ length: 3 }).map((__, row) => (
          <Skeleton key={row} variant='block' className='h-[76px] w-full' />
        ))}
      </div>
    ))}
  </div>
);

/** The full road: claims, the one next step, then today → in progress → week → horizon. */
export const WhatNextView = () => {
  const { t } = useNextMessage();
  const router = useRouter();
  const { result, snapshot, isLoading } = useWhatNext("page");
  const track = useTrackAction("page");
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

  const now = snapshot?.now ?? 0;
  const ranks = new Map(
    result?.ranked.map((action, index) => [action.id, index]) ?? [],
  );

  return (
    <div className='mx-auto w-full max-w-3xl px-3 pb-16 md:px-6'>
      <LoadingSwap
        isLoading={isLoading || !result}
        skeleton={<WhatNextSkeleton />}>
        {() =>
          result && (
            <div className='space-y-10'>
              <div className='space-y-4'>
                <ClaimStrip claims={result.claims} />

                {result.hero ? (
                  <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
                    <NextActionHero
                      action={result.hero}
                      now={now}
                      onOpen={() => track(result.hero!, "hero", 0)}
                      footer={
                        <SessionLauncher
                          ranked={result.ranked}
                          onStart={setSession}
                        />
                      }
                    />
                  </section>
                ) : (
                  <section className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
                    <CheckCircle2
                      size={22}
                      className='mt-0.5 shrink-0 text-emerald-400'
                      aria-hidden
                    />
                    <div>
                      <h2 className='font-display text-lg font-semibold text-zinc-100'>
                        {t("empty.title")}
                      </h2>
                      <p className='mt-1 text-sm text-zinc-400'>
                        {t("empty.body")}
                      </p>
                    </div>
                  </section>
                )}
              </div>

              {LANES.map((lane) =>
                result.lanes[lane].length === 0 ? null : (
                  <section key={lane} className='space-y-3'>
                    <h2 className='text-sm font-semibold text-zinc-300'>
                      {t(`lanes.${lane}`)}
                    </h2>
                    <div className='space-y-2'>
                      {result.lanes[lane].map((action) => (
                        <NextActionRow
                          key={action.id}
                          action={action}
                          now={now}
                          onOpen={() =>
                            track(action, lane, ranks.get(action.id) ?? -1)
                          }
                        />
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>
          )
        }
      </LoadingSwap>
    </div>
  );
};
