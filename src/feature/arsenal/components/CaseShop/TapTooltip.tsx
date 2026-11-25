import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { ReactElement, ReactNode } from "react";
import { useRef, useState } from "react";

import { oddsTooltipClass } from "./oddsTooltipClass";

/**
 * A tooltip that also answers a tap. Radix opens on hover and focus and treats
 * a touch as neither, so the odds were unreachable on a phone; a tap toggles
 * it here, and the mouse and keyboard keep Radix's own behaviour.
 */
export const TapTooltip = ({
  trigger,
  children,
}: {
  trigger: ReactElement;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  // What the tap found, read before the tap itself closes an open tooltip.
  const tap = useRef<{ wasOpen: boolean } | null>(null);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150} open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onPointerDown={(e) => {
            tap.current = e.pointerType === "touch" ? { wasOpen: open } : null;
          }}
          onClick={(e) => {
            if (!tap.current) return;
            // Keeps Radix from closing on the click it would otherwise handle.
            e.preventDefault();
            setOpen(!tap.current.wasOpen);
            tap.current = null;
          }}>
          {trigger}
        </TooltipTrigger>
        <TooltipContent side='top' className={oddsTooltipClass}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
