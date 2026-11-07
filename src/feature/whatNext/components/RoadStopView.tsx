import type { RoadTone } from "components/RoadPath/RoadPathNode";
import { ClaimStrip } from "feature/whatNext/components/ClaimStrip";
import { SOURCE_ICONS } from "feature/whatNext/components/sourceIcons";
import {
  BubbleFrame,
  StepBubble,
} from "feature/whatNext/components/StepBubble";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { ClaimItem } from "feature/whatNext/types/whatNext.types";
import type { RoadStop } from "feature/whatNext/utils/buildRoad";
import { Gift } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback } from "react";

export interface StopLook {
  tone: RoadTone;
  icon: ReactNode;
  title: string;
  startLabel?: string;
}

/**
 * How a What Next stop looks on a road: the first step is the one to start
 * (cyan, with Start over it), rewards are the amber gift, a streak keeps its
 * orange, and everything after is open road.
 */
export const useStopLook = () => {
  const { t, text } = useNextMessage();

  return useCallback(
    (stop: RoadStop, iconSize: number): StopLook => {
      if (stop.kind === "chest") {
        return {
          tone: "chest",
          icon: <Gift size={iconSize} strokeWidth={2.5} aria-hidden />,
          title: t("road.chest"),
        };
      }
      const Icon = SOURCE_ICONS[stop.action.source];
      return {
        tone:
          stop.action.source === "streak"
            ? "streak"
            : stop.isFirst
              ? "current"
              : "open",
        icon: <Icon size={iconSize} strokeWidth={2.5} aria-hidden />,
        title: text(stop.action.title),
        startLabel: stop.isFirst ? t("road.start") : undefined,
      };
    },
    [t, text],
  );
};

/** What opens under a tapped stop: the step's bubble, or the chest's rewards. */
export const RoadStopBubble = ({
  stop,
  claims,
  onOpen,
  extra,
  variant,
  pointerOffset,
}: {
  stop: RoadStop;
  claims: ClaimItem[];
  onOpen: () => void;
  extra?: ReactNode;
  variant?: "card" | "flat";
  pointerOffset?: number;
}) =>
  stop.kind === "chest" ? (
    <BubbleFrame variant={variant} pointerOffset={pointerOffset}>
      <ClaimStrip claims={claims} variant='flat' className='text-left' />
    </BubbleFrame>
  ) : (
    <StepBubble
      action={stop.action}
      onOpen={onOpen}
      extra={stop.isFirst ? extra : undefined}
      variant={variant}
      pointerOffset={pointerOffset}
    />
  );
