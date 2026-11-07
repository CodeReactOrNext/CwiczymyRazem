import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import {
  WidgetHeader,
  WidgetLink,
} from "feature/dashboard/components/widgets/WidgetHeader";
import {
  RoadStopBubble,
  RoadStopNode,
} from "feature/whatNext/components/RoadStopView";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useRoadSelection } from "feature/whatNext/hooks/useRoadSelection";
import type { WhatNextPlacement } from "feature/whatNext/hooks/useTrackAction";
import { useTrackAction } from "feature/whatNext/hooks/useTrackAction";
import { useWhatNext } from "feature/whatNext/hooks/useWhatNext";
import type {
  NextAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { buildRoad } from "feature/whatNext/utils/buildRoad";
import { CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

/** Stops on Home: the next one and a glimpse of the road after it. */
const WIDGET_STOPS = 4;

/** A gentle up-and-down, so a row of stops still reads as a road. */
const WAVE = [0, -10, 4, -10];

const WidgetSkeleton = () => (
  <div className='flex flex-col items-center gap-6'>
    <div className='flex items-end justify-center gap-1.5 sm:gap-6'>
      {WAVE.map((y, index) => (
        <Skeleton
          key={index}
          className={
            index === 0 ? "h-16 w-16 rounded-full" : "h-12 w-12 rounded-full"
          }
          style={{ transform: `translateY(${y}px)` }}
        />
      ))}
    </div>
    <Skeleton className='h-10 w-full max-w-sm rounded-lg' />
  </div>
);

/** A short, sideways piece of the road with the open stop's bubble under it. */
export const WhatNextRoadStrip = ({
  result,
  onOpen,
}: {
  result: WhatNextResult;
  onOpen: (
    action: NextAction,
    placement: WhatNextPlacement,
    index: number,
  ) => void;
}) => {
  const { t } = useNextMessage();
  const road = useMemo(() => buildRoad(result, WIDGET_STOPS), [result]);
  const [selected, select] = useRoadSelection(road);
  const open = road.find((stop) => stop.id === selected);

  if (road.length === 0) {
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
      <ol className='flex items-end justify-center gap-1.5 sm:gap-6'>
        {road.map((stop, index) => (
          <li
            key={stop.id}
            style={{ transform: `translateY(${WAVE[index] ?? 0}px)` }}>
            <RoadStopNode
              stop={stop}
              size={index === 0 ? "md" : "sm"}
              selected={stop.id === selected}
              onSelect={() => select(stop.id)}
            />
          </li>
        ))}
      </ol>
      {open && (
        <RoadStopBubble
          key={open.id}
          stop={open}
          claims={result.claims}
          variant='flat'
          onOpen={() =>
            open.kind === "step" &&
            onOpen(
              open.action,
              open.isFirst ? "hero" : "step",
              road.indexOf(open),
            )
          }
        />
      )}
    </div>
  );
};

/** What Next on Home (and after a session): the first stops of the road, the next one open. */
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
        skeleton={<WidgetSkeleton />}>
        {() => result && <WhatNextRoadStrip result={result} onOpen={track} />}
      </LoadingSwap>
    </Card>
  );
};
