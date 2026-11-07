import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ActionMenu } from "feature/whatNext/components/ActionMenu";
import {
  ActionMeta,
  ActionProgress,
} from "feature/whatNext/components/ActionMeta";
import { SOURCE_ICONS } from "feature/whatNext/components/sourceIcons";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface NextActionHeroProps {
  action: NextAction;
  now: number;
  onOpen: () => void;
  /** Extra controls under the button — the page puts the session lengths here. */
  footer?: ReactNode;
  className?: string;
}

/** The one thing to do now, big enough to be the answer to "what next?". */
export const NextActionHero = ({
  action,
  now,
  onOpen,
  footer,
  className,
}: NextActionHeroProps) => {
  const { t, text } = useNextMessage();
  const Icon = SOURCE_ICONS[action.source];

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className='flex items-start gap-4'>
        <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10'>
          <Icon size={22} className='text-cyan-400' aria-hidden />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-xs font-semibold tracking-wide text-cyan-400'>
            {t("hero.eyebrow")}
          </p>
          <h2 className='mt-1 font-display text-xl font-semibold text-zinc-100 sm:text-2xl'>
            {text(action.title)}
          </h2>
          {action.reason && (
            <p className='mt-1.5 text-sm text-zinc-400'>
              {text(action.reason)}
            </p>
          )}
          <ActionMeta action={action} now={now} className='mt-2.5' />
          <ActionProgress progress={action.progress} />
        </div>
        <ActionMenu action={action} />
      </div>

      <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
        <Button asChild size='lg' className='px-6'>
          <Link href={action.href} onClick={onOpen}>
            {action.isPractice ? (
              <Play className='fill-current' />
            ) : (
              <ArrowRight />
            )}
            {action.isPractice ? t("hero.play") : t("hero.open")}
          </Link>
        </Button>
        {action.estMinutes !== undefined && (
          <span className='text-sm text-zinc-400'>
            {t("hero.minutes", { count: action.estMinutes })}
          </span>
        )}
      </div>

      {footer}
    </div>
  );
};
