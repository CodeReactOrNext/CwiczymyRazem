import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { ReactNode } from "react";

interface StashItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Item name — screen-reader only, the card underneath already shows it. */
  title: string;
  /** The full item card, with its own actions. */
  children: ReactNode;
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
}: StashItemDialogProps) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='flex items-center justify-center border-0 bg-transparent p-4 shadow-none sm:max-w-[320px] sm:p-0'>
      <DialogTitle className='sr-only'>{title}</DialogTitle>
      <div className='w-full max-w-[300px]'>{children}</div>
    </DialogContent>
  </Dialog>
);
