import { Button, buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type {
  NextAction,
  NextMessage,
} from "feature/whatNext/types/whatNext.types";
import { m } from "framer-motion";
import { popIn } from "lib/motion/motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Flame, Play, Swords } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { getLocalDayEnd } from "utils/gameLogic/resetSchedule";

const PERK_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  "perks.streak": { icon: Flame, className: "text-orange-400" },
  "perks.quest": { icon: Swords, className: "text-amber-400" },
};

interface StepBubbleProps {
  action: NextAction;
  /** What playing it also takes care of — the streak, the daily quest. */
  perks?: NextMessage[];
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
  perks = [],
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
      <h3 className='font-display text-xl font-bold leading-tight text-zinc-50'>
        {text(action.title)}
      </h3>
      {action.reason && (
        <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>{text(action.reason)}</p>
      )}
      {perks.length > 0 && (
        <ul className='mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5'>
          {perks.map((perk) => {
            const look = PERK_ICONS[perk.key];
            const PerkIcon = look?.icon;
            return (
              <li
                key={perk.key}
                className='flex items-center gap-1.5 text-xs text-zinc-300'>
                {PerkIcon && (
                  <PerkIcon size={14} className={look.className} aria-hidden />
                )}
                {text(perk)}
              </li>
            );
          })}
        </ul>
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
          className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {t("road.not_today")}
        </button>
      </div>
    </BubbleFrame>
  );
};
