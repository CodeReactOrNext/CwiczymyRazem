import { ClaimStrip } from "feature/whatNext/components/ClaimStrip";
import { RoadNode } from "feature/whatNext/components/RoadNode";
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

/** The round key for one stop, coloured by what it is. */
export const RoadStopNode = ({
  stop,
  size,
  selected,
  onSelect,
}: {
  stop: RoadStop;
  size: "lg" | "md" | "sm";
  selected: boolean;
  onSelect: () => void;
}) => {
  const { t, text } = useNextMessage();

  if (stop.kind === "chest") {
    return (
      <RoadNode
        icon={Gift}
        label={t("road.chest")}
        tone='chest'
        size={size}
        selected={selected}
        onClick={onSelect}
      />
    );
  }

  const { action, isFirst } = stop;
  return (
    <RoadNode
      icon={SOURCE_ICONS[action.source]}
      label={text(action.title)}
      tone={
        action.source === "streak" ? "streak" : isFirst ? "current" : "next"
      }
      size={size}
      selected={selected}
      startLabel={isFirst ? t("road.start") : undefined}
      onClick={onSelect}
    />
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
