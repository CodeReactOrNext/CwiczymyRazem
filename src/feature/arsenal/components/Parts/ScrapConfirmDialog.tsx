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
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { countScrapParts } from "feature/arsenal/utils/scrap";

import { ScrapYieldList } from "./ScrapYieldList";

interface ScrapConfirmDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect";
  itemName: string;
  parts: ScrapPart[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * A teardown is permanent, so it asks on an `alert-dialog`: Escape and the
 * backdrop cancel, the focus trap keeps the two buttons reachable, and neither
 * closes the dialog while the request is still in flight.
 */
export const ScrapConfirmDialog = ({
  isOpen,
  itemType,
  itemName,
  parts,
  onConfirm,
  onCancel,
  isLoading,
}: ScrapConfirmDialogProps) => {
  const total = countScrapParts(parts);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel();
      }}>
      <AlertDialogContent className='max-w-sm gap-6 border-0 bg-zinc-900 p-6'>
        <AlertDialogHeader className='space-y-2'>
          <AlertDialogTitle className='text-lg font-bold text-white'>
            Scrap {itemType}?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm text-zinc-400'>
            {itemName} — this is permanent, the {itemType.toLowerCase()} is gone
            for good.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='flex flex-col gap-4 rounded-lg bg-zinc-800/50 p-4'>
          <p className='text-xs text-zinc-400'>
            You will salvage {total} {total === 1 ? "part" : "parts"}
          </p>
          <ScrapYieldList parts={parts} />
        </div>

        <AlertDialogFooter className='gap-2 sm:space-x-0'>
          <AlertDialogCancel
            disabled={isLoading}
            className='mt-0 border-0 bg-zinc-700 text-white hover:bg-zinc-600 hover:text-white sm:flex-1'>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // The dialog closes on the confirmed action; the caller unmounts it
              // itself once the teardown lands, so it must not close early.
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className='bg-orange-600 text-white hover:bg-orange-700 sm:flex-1'>
            {isLoading ? "Scrapping..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
