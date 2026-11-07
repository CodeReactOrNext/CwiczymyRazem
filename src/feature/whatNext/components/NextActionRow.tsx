import { cn } from "assets/lib/utils";
import { ActionMenu } from "feature/whatNext/components/ActionMenu";
import {
  ActionMeta,
  ActionProgress,
} from "feature/whatNext/components/ActionMeta";
import { SOURCE_ICONS } from "feature/whatNext/components/sourceIcons";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import Link from "next/link";

interface NextActionRowProps {
  action: NextAction;
  now: number;
  onOpen: () => void;
  /** Card on the page (its own background); flat inside the Home card, which already is one. */
  variant?: "card" | "flat";
}

/** One step on the road: where it comes from, what to do, why now. */
export const NextActionRow = ({
  action,
  now,
  onOpen,
  variant = "card",
}: NextActionRowProps) => {
  const { text } = useNextMessage();
  const Icon = SOURCE_ICONS[action.source];

  return (
    <div
      className={cn(
        "group flex items-start gap-1 rounded-lg transition-colors",
        variant === "card"
          ? "bg-zinc-900/40 hover:bg-zinc-800/40"
          : "-mx-2 hover:bg-zinc-800/40",
      )}>
      <Link
        href={action.href}
        onClick={onOpen}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500",
          variant === "card" ? "p-4" : "px-2 py-2.5",
        )}>
        <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800/60'>
          <Icon
            size={16}
            className={
              action.source === "streak" ? "text-orange-400" : "text-zinc-400"
            }
            aria-hidden
          />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium text-zinc-100'>
            {text(action.title)}
          </span>
          {action.reason && (
            <span className='mt-0.5 block text-xs text-zinc-400'>
              {text(action.reason)}
            </span>
          )}
          <ActionMeta action={action} now={now} className='mt-1.5' />
          <ActionProgress progress={action.progress} />
        </span>
      </Link>
      <ActionMenu
        action={action}
        className={variant === "card" ? "mr-2 mt-3" : "mt-2"}
      />
    </div>
  );
};
