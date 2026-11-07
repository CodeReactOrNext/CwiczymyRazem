import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import {
  WidgetHeader,
  WidgetLink,
} from "feature/dashboard/components/widgets/WidgetHeader";
import { ClaimStrip } from "feature/whatNext/components/ClaimStrip";
import { NextActionHero } from "feature/whatNext/components/NextActionHero";
import { NextActionRow } from "feature/whatNext/components/NextActionRow";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useTrackAction } from "feature/whatNext/hooks/useTrackAction";
import { useWhatNext } from "feature/whatNext/hooks/useWhatNext";
import type { NextActionLane } from "feature/whatNext/types/whatNext.types";
import { CheckCircle2 } from "lucide-react";

/** Rows under the hero on Home — enough to see what is next after next. */
const WIDGET_ROWS = 3;

const WidgetSkeleton = () => (
  <div className='space-y-5'>
    <div className='flex items-start gap-4'>
      <Skeleton className='h-12 w-12 rounded-lg' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-3 w-20' />
        <Skeleton className='h-6 w-2/3' />
        <Skeleton className='h-4 w-1/2' />
      </div>
    </div>
    <Skeleton className='h-10 w-28 rounded-lg' />
  </div>
);

/** What Next on Home: what to collect, the next step, and the two or three after it. */
export const WhatNextWidget = () => {
  const { t } = useNextMessage();
  const { result, snapshot, isLoading } = useWhatNext("widget");
  const track = useTrackAction("widget");
  const now = snapshot?.now ?? 0;

  const order: NextActionLane[] = ["today", "inProgress", "week"];
  const following = result
    ? order
        .flatMap((lane) =>
          result.lanes[lane].map((action) => ({ action, lane })),
        )
        .slice(0, WIDGET_ROWS)
    : [];

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        title={t("widget.title")}
        action={<WidgetLink href='/next'>{t("widget.open")}</WidgetLink>}
      />

      <LoadingSwap
        isLoading={isLoading || !result}
        skeleton={<WidgetSkeleton />}>
        {() =>
          result && (
            <div className='flex flex-col gap-6'>
              <ClaimStrip claims={result.claims} variant='flat' />

              {result.hero ? (
                <NextActionHero
                  action={result.hero}
                  now={now}
                  onOpen={() => track(result.hero!, "hero", 0)}
                />
              ) : (
                <div className='flex items-start gap-3'>
                  <CheckCircle2
                    size={20}
                    className='mt-0.5 shrink-0 text-emerald-400'
                    aria-hidden
                  />
                  <div>
                    <p className='text-sm font-semibold text-zinc-100'>
                      {t("empty.title")}
                    </p>
                    <p className='mt-0.5 text-sm text-zinc-400'>
                      {t("empty.body")}
                    </p>
                  </div>
                </div>
              )}

              {following.length > 0 && (
                <div className='space-y-0.5'>
                  {following.map(({ action, lane }, index) => (
                    <NextActionRow
                      key={action.id}
                      action={action}
                      now={now}
                      variant='flat'
                      onOpen={() => track(action, lane, index + 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        }
      </LoadingSwap>
    </Card>
  );
};
