import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import { RoadPathNode } from "components/RoadPath/RoadPathNode";
import {
  WidgetHeader,
  WidgetLink,
} from "feature/dashboard/components/widgets/WidgetHeader";
import { CaseProgress } from "feature/whatNext/components/CaseProgress";
import {
  RoadStopBubble,
  useStopLook,
} from "feature/whatNext/components/RoadStopView";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useRoad } from "feature/whatNext/hooks/useRoad";
import { useRoadSelection } from "feature/whatNext/hooks/useRoadSelection";
import type { WhatNextPlacement } from "feature/whatNext/hooks/useTrackAction";
import { useTrackAction } from "feature/whatNext/hooks/useTrackAction";
import { useWhatNext } from "feature/whatNext/hooks/useWhatNext";
import type {
  NextAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { ROAD_STOPS } from "feature/whatNext/utils/buildRoad";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment } from "react";

export const RoadStripSkeleton = () => (
  <div className='flex flex-col items-center gap-6'>
    <div className='flex w-full max-w-md items-center'>
      {Array.from({ length: ROAD_STOPS }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <div className='h-2 min-w-4 flex-1 rounded-full bg-zinc-800' />
          )}
          <div className='flex w-20 shrink-0 justify-center sm:w-28'>
            <Skeleton className='h-16 w-16 rounded-full' />
          </div>
        </Fragment>
      ))}
    </div>
    <Skeleton className='h-10 w-full max-w-sm rounded-lg' />
  </div>
);

/** The road sideways: its three stops, with the open stop's bubble under them. */
export const WhatNextRoadStrip = ({
  result,
  onOpen,
  playRoad,
}: {
  result: WhatNextResult;
  /** Shown under the first step's button — "play the whole road", on the page. */
  playRoad?: ReactNode;
  onOpen: (
    action: NextAction,
    placement: WhatNextPlacement,
    index: number,
  ) => void;
}) => {
  const { t } = useNextMessage();
  const look = useStopLook();
  const stops = useRoad(result) ?? [];
  const [selected, select] = useRoadSelection(stops);
  const open = stops.find((stop) => stop.id === selected);

  if (stops.length === 0) {
    return (
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
          <p className='mt-0.5 text-sm text-zinc-400'>{t("empty.body")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-5 pt-10'>
      <ol className='flex w-full max-w-md items-start'>
        {stops.map((stop, index) => {
          const stopLook = look(stop, 24);
          const isSelected = stop.id === selected;
          return (
            <Fragment key={stop.id}>
              {index > 0 && (
                // The road between two stops, level with their centres.
                <li
                  aria-hidden
                  className='mt-8 h-2 min-w-4 flex-1 -translate-y-1/2 rounded-full bg-zinc-800'
                />
              )}
              <li className='flex w-20 shrink-0 flex-col items-center gap-2.5 sm:w-28'>
                <RoadPathNode
                  {...stopLook}
                  size='md'
                  halo='none'
                  selected={isSelected}
                  onClick={() => select(stop.id)}
                />
                {/* The open stop is named in its bubble right below. */}
                <span
                  aria-hidden
                  className={cn(
                    "line-clamp-2 text-center text-xs font-semibold leading-snug text-zinc-400",
                    isSelected && "invisible",
                  )}>
                  {stopLook.title}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
      {open && (
        <RoadStopBubble
          key={open.id}
          stop={open}
          perks={result.perks}
          variant='flat'
          extra={playRoad}
          onOpen={() =>
            open.kind === "step" &&
            onOpen(
              open.action,
              open.isFirst ? "hero" : "step",
              stops.indexOf(open),
            )
          }
        />
      )}
      <CaseProgress className='mt-2' />
    </div>
  );
};

/** What Next on the screen after a session: the three stops, the next one open. */
export const WhatNextWidget = () => {
  const { t } = useNextMessage();
  const { result, isLoading } = useWhatNext("widget");
  const track = useTrackAction("widget");

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        title={t("widget.title")}
        action={<WidgetLink href='/next'>{t("widget.open")}</WidgetLink>}
      />
      <LoadingSwap
        isLoading={isLoading || !result}
        skeleton={<RoadStripSkeleton />}>
        {() => result && <WhatNextRoadStrip result={result} onOpen={track} />}
      </LoadingSwap>
    </Card>
  );
};
