import { cn } from "assets/lib/utils";

import type { RotationItemDisplay } from "../hooks/useRotationDisplay";

interface RotationThumbProps {
  display: RotationItemDisplay;
  className?: string;
  iconClassName?: string;
}

/** Song cover, or the skill's icon on a plain tile. */
export const RotationThumb = ({
  display,
  className,
  iconClassName,
}: RotationThumbProps) => {
  const { Icon } = display;
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 text-zinc-400",
        className,
      )}>
      {display.coverUrl ? (
        <img
          src={display.coverUrl}
          alt=''
          className='h-full w-full object-cover'
        />
      ) : (
        <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden />
      )}
    </div>
  );
};
