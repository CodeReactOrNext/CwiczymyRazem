import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";

import { ModArt } from "../Workshop/ModArt";

interface FitSalvagedDialogProps {
  isOpen: boolean;
  option: SalvagedModOption;
  /** The instrument the mod was dropped onto. */
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * The last step of dragging a rescued mod onto an instrument.
 *
 * The board already refused every socket this could not go into and the job
 * costs nothing, so the only thing left to confirm is that this is the
 * instrument the player meant — a drag can land somewhere by accident, and a
 * mod cannot be taken off again without scrapping what it went into.
 */
export const FitSalvagedDialog = ({
  isOpen,
  option,
  targetName,
  onConfirm,
  onCancel,
  isLoading,
}: FitSalvagedDialogProps) => (
  <AlertDialog
    open={isOpen}
    onOpenChange={(open) => {
      if (!open && !isLoading) onCancel();
    }}>
    <AlertDialogContent className='max-w-sm gap-6 border-0 bg-zinc-900 p-6'>
      <AlertDialogHeader className='space-y-2'>
        <AlertDialogTitle className='text-lg font-bold text-white'>
          Fit {option.label}?
        </AlertDialogTitle>
        <AlertDialogDescription className='text-sm text-zinc-400'>
          Onto {targetName}, at the value it was salvaged with. Nothing is
          re-rolled.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className='flex items-center gap-4 rounded-lg bg-purple-500/10 p-4'>
        <ModArt modId={option.featureId} size={52} />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-2xl font-black tabular-nums text-purple-300'>
            +{option.points}
          </span>
          <span className='truncate text-xs text-zinc-400'>
            off {option.sourceName}
          </span>
        </div>
      </div>

      <p className='text-xs text-zinc-500'>
        Costs nothing — you already paid {option.sourceName} for it. Taking it
        off again means scrapping whatever it goes into.
      </p>

      <AlertDialogFooter className='gap-2 sm:space-x-0'>
        <AlertDialogCancel
          disabled={isLoading}
          className='mt-0 border-0 bg-zinc-700 text-white hover:bg-zinc-600 hover:text-white sm:flex-1'>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            // The caller unmounts this once the job lands, so it must not close
            // out from under a request that is still in flight.
            e.preventDefault();
            onConfirm();
          }}
          disabled={isLoading}
          className='bg-purple-600 text-white hover:bg-purple-700 sm:flex-1'>
          {isLoading ? "Installing..." : "Install"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
