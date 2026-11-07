import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { m } from "framer-motion";
import { popIn } from "lib/motion/motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { getLocalDayEnd } from "utils/gameLogic/resetSchedule";

interface StepBubbleProps {
  action: NextAction;
  onOpen: () => void;
  /** Under the main button — "play the whole road" on the first step. */
  extra?: ReactNode;
  /** A card of its own on the page; flat inside the Home card. */
  variant?: "card" | "flat";
  /** Horizontal shift of the little pointer, so it sits under its stop. */
  pointerOffset?: number;
}

interface BubbleFrameProps {
  children: ReactNode;
  variant?: "card" | "flat";
  pointerOffset?: number;
}

/** The speech bubble under a tapped stop, with a pointer up to it. */
export const BubbleFrame = ({
  children,
  variant = "card",
  pointerOffset = 0,
}: BubbleFrameProps) => (
  <m.div
    variants={popIn}
    initial='hidden'
    animate='visible'
    className={cn(
      "relative mx-auto w-full max-w-sm text-center",
      variant === "card" && "rounded-lg bg-zinc-900 p-5",
    )}>
    {variant === "card" && (
      <span
        aria-hidden
        className='absolute -top-1.5 left-1/2 h-3 w-3 rotate-45 bg-zinc-900'
        style={{ marginLeft: pointerOffset - 6 }}
      />
    )}
    {children}
  </m.div>
);

/**
 * What a stop is, once it is tapped: its name, one line of why, and one button.
 * Nothing else — the road is the overview, the bubble is the step.
 */
export const StepBubble = ({
  action,
  onOpen,
  extra,
  variant = "card",
  pointerOffset = 0,
}: StepBubbleProps) => {
  const { t, text } = useNextMessage();
  const snoozeForToday = useWhatNextStore((state) => state.snoozeForToday);

  const notToday = () => {
    snoozeForToday(action.id, getLocalDayEnd());
    posthog.capture("what_next_snoozed", {
      source: action.source,
      kind: action.kind,
      duration: "today",
    });
  };

  return (
    <BubbleFrame variant={variant} pointerOffset={pointerOffset}>
      <h3 className='font-display text-lg font-semibold text-zinc-100'>
        {text(action.title)}
      </h3>
      {action.reason && (
        <p className='mt-1 text-sm text-zinc-400'>{text(action.reason)}</p>
      )}

      <Button asChild size='lg' className='mt-4 w-full'>
        <Link href={action.href} onClick={onOpen}>
          {action.isPractice ? (
            <Play className='fill-current' />
          ) : (
            <ArrowRight />
          )}
          {action.isPractice ? t("road.play") : t("road.open")}
        </Link>
      </Button>

      <div className='mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1'>
        {extra}
        <button
          type='button'
          onClick={notToday}
          className='rounded px-1 text-xs font-medium text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:text-zinc-200'>
          {t("road.not_today")}
        </button>
      </div>
    </BubbleFrame>
  );
};
