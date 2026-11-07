import { cn } from "assets/lib/utils";
import type { RoadPathStop } from "components/RoadPath/RoadPath";
import { RoadPath, roadWaveX } from "components/RoadPath/RoadPath";
import { RoadPathNode } from "components/RoadPath/RoadPathNode";
import {
  RoadStopBubble,
  useStopLook,
} from "feature/whatNext/components/RoadStopView";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useRoadSelection } from "feature/whatNext/hooks/useRoadSelection";
import type { WhatNextPlacement } from "feature/whatNext/hooks/useTrackAction";
import type {
  NextAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { buildRoad } from "feature/whatNext/utils/buildRoad";
import { Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

/** Stops on the page. Past this the road stops being "next" and becomes a list. */
const ROAD_LENGTH = 8;

interface WhatNextRoadProps {
  result: WhatNextResult;
  /** Shown under the first step — "play the whole road". */
  playRoad?: ReactNode;
  onOpen: (
    action: NextAction,
    placement: WhatNextPlacement,
    index: number,
  ) => void;
}

/**
 * The What Next road — the same road Journey walks, with the step bubble
 * opening right under a tapped stop instead of a side panel.
 */
export const WhatNextRoad = ({
  result,
  playRoad,
  onOpen,
}: WhatNextRoadProps) => {
  const { t } = useNextMessage();
  const look = useStopLook();
  const road = useMemo(() => buildRoad(result, ROAD_LENGTH), [result]);
  const [selected, select] = useRoadSelection(road);

  if (road.length === 0) {
    return (
      <div className='flex flex-col items-center gap-4 pt-16 text-center'>
        <RoadPathNode
          tone='done'
          icon={<Trophy size={26} strokeWidth={2.5} aria-hidden />}
          title={t("empty.title")}
          onClick={() => undefined}
        />
        <h2 className='font-display text-lg font-semibold text-zinc-100'>
          {t("empty.title")}
        </h2>
        <p className='max-w-xs text-sm text-zinc-400'>{t("empty.body")}</p>
      </div>
    );
  }

  const stops: RoadPathStop[] = road.map((stop, index) => {
    const isSelected = stop.id === selected;
    const { title, ...node } = look(stop, 26);
    return {
      id: stop.id,
      ...node,
      title,
      selected: isSelected,
      onClick: () => select(stop.id),
      label: (
        <p
          className={cn(
            "line-clamp-3 text-xs font-semibold leading-snug",
            isSelected ? "text-zinc-100" : "text-zinc-400",
          )}>
          {title}
        </p>
      ),
      after: isSelected ? (
        <RoadStopBubble
          stop={stop}
          claims={result.claims}
          pointerOffset={roadWaveX(index)}
          extra={playRoad}
          onOpen={() =>
            stop.kind === "step" &&
            onOpen(stop.action, stop.isFirst ? "hero" : "step", index)
          }
        />
      ) : undefined,
    };
  });

  return <RoadPath stops={stops} className='pb-14 pt-12' />;
};
