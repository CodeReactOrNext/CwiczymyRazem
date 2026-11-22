import { cn } from "assets/lib/utils";
import { Kostek, type KostekMood } from "components/Mascot/Kostek";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** Kostek's mood (docs/MASCOT.md §5). Ignored when `icon` is given. */
  mood?: KostekMood;
  /** A plain lucide icon in place of Kostek — for spots where he'd crowd the screen. */
  icon?: ReactNode;
  /** Buttons below the text: a default `<Button>` for the main way out, `ghost` for the rest. */
  action?: ReactNode;
  /** `compact` for empty states inside an existing card or widget. */
  size?: "default" | "compact";
  className?: string;
}

/**
 * The one empty state of the app: a card with Kostek (or a grey icon), a title,
 * an optional line of explanation and the way out. Inside another card pass
 * `size='compact'` and `className='bg-transparent px-0'` — no card in a card.
 */
export const EmptyState = ({
  title,
  description,
  mood = "wait",
  icon,
  action,
  size = "default",
  className,
}: EmptyStateProps) => {
  const compact = size === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg bg-zinc-800/40 px-6 py-14 text-center",
        compact && "py-8",
        className
      )}>
      {icon ? (
        <div className='text-zinc-500 [&_svg]:h-8 [&_svg]:w-8' aria-hidden>
          {icon}
        </div>
      ) : (
        <Kostek
          mood={mood}
          className={compact ? "h-16 md:h-20" : "h-24 md:h-28"}
        />
      )}
      <div className='flex flex-col items-center gap-1'>
        <p className='text-lg font-semibold text-zinc-100'>{title}</p>
        {description && (
          <p className='max-w-sm text-sm text-zinc-400'>{description}</p>
        )}
      </div>
      {action && (
        <div className='mt-2 flex flex-wrap items-center justify-center gap-2'>
          {action}
        </div>
      )}
    </div>
  );
};
