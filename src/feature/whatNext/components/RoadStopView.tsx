import { Button } from "assets/components/ui/button";
import type { RoadTone } from "components/RoadPath/RoadPathNode";
import {
  getDailyDayKey,
  getDailyExercise,
} from "feature/dailyExercise/utils/dailyExercise";
import { SOURCE_ICONS } from "feature/whatNext/components/sourceIcons";
import {
  BubbleFrame,
  StepBubble,
} from "feature/whatNext/components/StepBubble";
import type { FeatureGoal } from "feature/whatNext/data/featureGoals";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type { NextMessage } from "feature/whatNext/types/whatNext.types";
import type { RoadStop } from "feature/whatNext/utils/buildRoad";
import { goalStopId } from "feature/whatNext/utils/buildRoad";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useCallback } from "react";

export interface StopLook {
  tone: RoadTone;
  icon: ReactNode;
  title: string;
  startLabel?: string;
}

/** Where a goal is done — the exercise of the day changes daily. */
const goalHref = (goal: FeatureGoal): string => {
  if (goal.href) return goal.href;
  const daily = getDailyExercise(getDailyDayKey());
  return daily ? `/practice/exercise/${daily.id}` : "/dashboard";
};

/**
 * How a What Next stop looks on a road: the first step is the one to start
 * (cyan, with Start over it), a streak keeps its orange, a feature still to try sparkles, and everything else is open road.
 */
export const useStopLook = () => {
  const { t, text } = useNextMessage();

  return useCallback(
    (stop: RoadStop, iconSize: number): StopLook => {
      if (stop.kind === "goal") {
        return {
          tone: "open",
          icon: <Sparkles size={iconSize} strokeWidth={2.5} aria-hidden />,
          title: t(`discover.items.${stop.goal.id}`),
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

/** A feature the player has not tried: what it is and the way there. */
const GoalBubble = ({
  goal,
  variant,
  pointerOffset,
}: {
  goal: FeatureGoal;
  variant?: "card" | "flat";
  pointerOffset?: number;
}) => {
  const { t } = useNextMessage();
  const snoozeForWeek = useWhatNextStore((state) => state.snoozeForWeek);

  const later = () => {
    snoozeForWeek(goalStopId(goal.id));
    posthog.capture("feature_goal_snoozed", { goal: goal.id });
  };

  return (
    <BubbleFrame variant={variant} pointerOffset={pointerOffset}>
      <p className='text-xs font-medium text-zinc-500'>{t("discover.title")}</p>
      <h3 className='mt-1 font-display text-xl font-bold leading-tight text-zinc-50'>
        {t(`discover.items.${goal.id}`)}
      </h3>
      <p className='mt-2 text-sm text-zinc-400'>{t("discover.hint")}</p>
      <Button asChild size='lg' className='mt-4 w-full'>
        <Link
          href={goalHref(goal)}
          onClick={() =>
            posthog.capture("feature_goal_opened", { goal: goal.id })
          }>
          <ArrowRight />
          {t("discover.go")}
        </Link>
      </Button>
      <button
        type='button'
        onClick={later}
        className='mt-3 rounded px-1 text-xs font-medium text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:text-zinc-200'>
        {t("discover.later")}
      </button>
    </BubbleFrame>
  );
};

/** What opens under a tapped stop: the step's bubble or a goal. */
export const RoadStopBubble = ({
  stop,
  perks,
  onOpen,
  extra,
  variant,
  pointerOffset,
}: {
  stop: RoadStop;
  /** What the first step also takes care of — the streak, the daily quest. */
  perks: NextMessage[];
  onOpen: () => void;
  extra?: ReactNode;
  variant?: "card" | "flat";
  pointerOffset?: number;
}) => {
  if (stop.kind === "goal") {
    return (
      <GoalBubble
        goal={stop.goal}
        variant={variant}
        pointerOffset={pointerOffset}
      />
    );
  }
  return (
    <StepBubble
      action={stop.action}
      perks={stop.isFirst ? perks : []}
      onOpen={onOpen}
      extra={stop.isFirst ? extra : undefined}
      variant={variant}
      pointerOffset={pointerOffset}
    />
  );
};
