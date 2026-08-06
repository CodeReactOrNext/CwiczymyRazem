import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import * as React from "react";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, collisionPadding, ...props }, ref) => {
  const { isElectron } = useElectronWindowControls();

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        // Radix only checks the viewport for collisions, but in Electron the top
        // 2.5rem is covered by the frameless window's own title bar (fixed,
        // portalled outside layout flow) — without this, tooltips near the top
        // flip too late and render partly hidden underneath it.
        collisionPadding={collisionPadding ?? (isElectron ? { top: 48 } : undefined)}
        className={cn(
          "z-50 translate-y-[15px] overflow-hidden rounded-md bg-zinc-200 px-3 py-1.5 font-sans font-semibold text-xs text-zinc-950 shadow-xl border border-white/20 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
