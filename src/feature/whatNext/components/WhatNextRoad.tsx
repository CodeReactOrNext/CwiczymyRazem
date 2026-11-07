import { cn } from "assets/lib/utils";
import { RoadNode } from "feature/whatNext/components/RoadNode";
import {
  RoadStopBubble,
  RoadStopNode,
} from "feature/whatNext/components/RoadStopView";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useRoadSelection } from "feature/whatNext/hooks/useRoadSelection";
import type { WhatNextPlacement } from "feature/whatNext/hooks/useTrackAction";
import type {
  NextAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { buildRoad, windOffset } from "feature/whatNext/utils/buildRoad";
import { Trophy } from "lucide-react";
import { Fragment, useMemo } from "react";

/** Stops on the page. Past this the road stops being "next" and becomes a list. */
const ROAD_LENGTH = 8;

interface WhatNextRoadProps {
  result: WhatNextResult;
  /** Shown under the first step — "play the whole road". */
  playRoad?: React.ReactNode;
  onOpen: (
    action: NextAction,
    placement: WhatNextPlacement,
    index: number,
  ) => void;
}

/** Steps of the trail between two stops, top to bottom, as share of the way back to the stop above. */
const TRAIL = [0.75, 0.5, 0.25];

/**
 * The dotted trail up to the stop above, drawn in the gap between them. It is
 * what turns a column of buttons into a road. `from` is how far the stop
 * above sits to the side, measured from this one.
 */
const RoadTrail = ({ from }: { from: number }) => (
  <span
    aria-hidden
    className='pointer-events-none absolute -top-9 left-1/2 h-8 w-0'>
    {TRAIL.map((share, step) => (
      <span
        key={share}
        className='absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-700'
        style={{ left: from * share, top: step * 10 + 2 }}
      />
    ))}
  </span>
);

/** One winding line of stops; the tapped one opens its bubble right under it. */
export const WhatNextRoad = ({
  result,
  playRoad,
  onOpen,
}: WhatNextRoadProps) => {
  const { t, text } = useNextMessage();
  const road = useMemo(() => buildRoad(result, ROAD_LENGTH), [result]);
  const [selected, select] = useRoadSelection(road);

  if (road.length === 0) {
    return (
      <div className='flex flex-col items-center gap-4 pt-16 text-center'>
        <RoadNode
          icon={Trophy}
          label={t("empty.title")}
          tone='chest'
          size='lg'
          selected
          onClick={() => undefined}
        />
        <h2 className='font-display text-lg font-semibold text-zinc-100'>
          {t("empty.title")}
        </h2>
        <p className='max-w-xs text-sm text-zinc-400'>{t("empty.body")}</p>
      </div>
    );
  }

  return (
    <ol className='flex flex-col items-center gap-10 pt-16'>
      {road.map((stop, index) => {
        const offset = windOffset(index);
        const isSelected = stop.id === selected;
        return (
          <Fragment key={stop.id}>
            <li
              className='relative flex flex-col items-center gap-2'
              style={{ transform: `translateX(${offset}px)` }}>
              {index > 0 && road[index - 1].id !== selected && (
                <RoadTrail from={windOffset(index - 1) - offset} />
              )}
              <RoadStopNode
                stop={stop}
                size={index === 0 ? "lg" : "md"}
                selected={isSelected}
                onSelect={() => select(stop.id)}
              />
              <span
                className={cn(
                  "line-clamp-2 max-w-44 text-center text-xs leading-snug",
                  isSelected ? "font-semibold text-zinc-100" : "text-zinc-500",
                )}>
                {stop.kind === "chest"
                  ? t("road.chest")
                  : text(stop.action.title)}
              </span>
            </li>
            {isSelected && (
              <li className='-mt-3 w-full'>
                <RoadStopBubble
                  stop={stop}
                  claims={result.claims}
                  pointerOffset={offset}
                  extra={playRoad}
                  onOpen={() =>
                    stop.kind === "step" &&
                    onOpen(stop.action, stop.isFirst ? "hero" : "step", index)
                  }
                />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
};
