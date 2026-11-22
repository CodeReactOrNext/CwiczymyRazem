import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { ReactElement, ReactNode } from "react";

interface SessionTooltipProps {
  label: ReactNode;
  /** Keyboard shortcut, one entry per key: ["Shift", "↑"]. */
  keys?: string[];
  side?: "top" | "bottom" | "left" | "right";
  children: ReactElement;
}

/**
 * Named tooltip for an icon-only session control, with its keyboard shortcut.
 * The session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
 * (mobile modal); the base tooltip's z-[130] would paint underneath it.
 * Carries its own provider so the controls also render outside the app shell.
 */
export const SessionTooltip = ({
  label,
  keys,
  side = "bottom",
  children,
}: SessionTooltipProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className='z-[99999999]'>
        <span className='flex items-center gap-2'>
          <span>{label}</span>
          {keys && keys.length > 0 && (
            <span className='flex items-center gap-1'>
              {keys.map((key) => (
                <kbd
                  key={key}
                  className='font-mono rounded bg-black/10 px-1.5 py-0.5 text-xs font-bold text-black/70'>
                  {key}
                </kbd>
              ))}
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
