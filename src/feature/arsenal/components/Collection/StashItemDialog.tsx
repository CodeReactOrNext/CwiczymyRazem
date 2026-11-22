import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

interface StashItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Item name — screen-reader only, the card underneath already shows it. */
  title: string;
  /** The full item card, with its own actions. */
  children: ReactNode;
  /**
   * Room for a sheet rather than a card. Gear opens at the width of its grid
   * card; a part stack has no card to match and is a small screen of its own,
   * which at 300px had no air around the trade and the keys.
   */
  wide?: boolean;
}

/**
 * What a socket opens into: the very same card the grid view shows, actions and
 * all. The stash trades detail for density, so the detail has to be one click
 * away rather than gone.
 */
export const StashItemDialog = ({
  isOpen,
  onClose,
  title,
  children,
  wide = false,
}: StashItemDialogProps) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className={cn(
        "flex items-center justify-center bg-transparent p-4 sm:p-0",
        wide ? "sm:max-w-lg" : "sm:max-w-sm",
      )}>
      <DialogTitle className='sr-only'>{title}</DialogTitle>
      <div className={cn("w-full", wide ? "max-w-lg" : "max-w-[300px]")}>
        {children}
      </div>
    </DialogContent>
  </Dialog>
);
