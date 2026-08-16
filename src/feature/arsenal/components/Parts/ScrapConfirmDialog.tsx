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
import type {
  SalvageableMod,
  ScrappedMod,
} from "feature/arsenal/data/salvage";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { countScrapParts } from "feature/arsenal/utils/scrap";

import { ModArt } from "../Workshop/ModArt";
import { ScrapYieldList } from "./ScrapYieldList";

interface ScrapConfirmDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect";
  itemName: string;
  parts: ScrapPart[];
  /** The one mod this teardown pulls out whole. Absent on an unmodded item. */
  salvaged?: SalvageableMod | null;
  /** Every other fitted mod — these burn with the instrument. */
  scrapped?: ScrappedMod[];
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
  salvaged,
  scrapped = [],
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

        {/* The mod that comes out whole. Not a choice — the instrument decides
            which one survives — so it is named, and nothing else: the bill above
            is what the player is reading, and a paragraph here competes with it. */}
        {salvaged && (
          <div className='flex items-center gap-4 rounded-lg bg-purple-500/10 p-4'>
            <ModArt modId={salvaged.featureId} size={52} />
            <div className='flex min-w-0 flex-col gap-1'>
              <span className='text-xs font-semibold text-purple-300/80'>
                Blueprint
              </span>
              <span className='truncate text-sm font-bold text-zinc-100'>
                {salvaged.label}{" "}
                <span className='tabular-nums text-purple-300'>
                  +{salvaged.points}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* The other side of the same ledger, and the reason it sits last: the
            parts and the blueprint are what the teardown pays, this is what it
            costs. Dimmed art and zinc numbers rather than a warning colour — it
            is a consequence to read, not an error to fix. */}
        {scrapped.length > 0 && (
          <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/50 p-4'>
            <p className='text-xs text-zinc-400'>
              {scrapped.length === 1
                ? "This mod goes with it"
                : `These ${scrapped.length} mods go with it`}
            </p>
            <div className='flex flex-col gap-2.5'>
              {scrapped.map((mod) => (
                <div key={mod.featureId} className='flex items-center gap-3'>
                  <ModArt modId={mod.featureId} size={32} dimmed />
                  <span className='min-w-0 flex-1 truncate text-sm text-zinc-400'>
                    {mod.label}
                  </span>
                  <span className='shrink-0 text-sm font-bold tabular-nums text-zinc-500'>
                    +{mod.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
