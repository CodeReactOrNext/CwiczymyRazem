import { buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { getGuitarEntries } from "feature/arsenal/utils/collectionEntries";
import { filterAndSortEntries } from "feature/arsenal/utils/collectionFilter";
import { rarityLockLabel } from "feature/progression/components/RarityLock";
import {
  rarityLockLvl,
  usePlayerLvl,
} from "feature/progression/hooks/usePlayerLvl";
import { Lock } from "lucide-react";
import { useMemo } from "react";

import type { InventoryItem } from "../../types/arsenal.types";
import { GuitarStashTile } from "../GuitarInventory/GuitarStashTile";
import { useProgressiveCount } from "./useProgressiveCount";

interface GuitarPickerModalProps {
  inventory: InventoryItem[];
  occupiedItemIds: (string | null)[];
  slotIndex: number;
  currentItemId: string | null;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

/**
 * Picking the guitar for a bay of the rack.
 *
 * The app's own dialog — a sheet on a phone, a centred panel above it — rather
 * than an overlay built by hand, so it opens, closes and is dismissed the way
 * every other dialog is. One title, the grid, and a way to empty the bay.
 */
export const GuitarPickerModal = ({
  inventory,
  occupiedItemIds,
  currentItemId,
  onSelect,
  onClose,
}: GuitarPickerModalProps) => {
  // One tile per copy, not per model: two S-Contours can be a level 3 and a
  // level 17, and a picker that shows only one of them cannot say which. Ordered
  // the way the stash orders itself — rarest first, copies together, best first.
  const items = useMemo(
    () => filterAndSortEntries(getGuitarEntries(inventory), "", "rarity"),
    [inventory],
  );
  const shown = useProgressiveCount(items.length);
  const playerLvl = usePlayerLvl();
  const { t } = useArsenalLabels();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // A tile shows its full card when it takes focus, so the dialog must
        // not hand focus to the first one the moment it opens.
        onOpenAutoFocus={(event) => event.preventDefault()}
        // No zoom on the way in or out: scaling a grid of lit, filtered sockets
        // re-draws every one of them on every frame of it. It fades instead.
        className='flex flex-col gap-8 border-0 bg-zinc-900 shadow-none sm:max-w-2xl sm:overflow-y-auto sm:p-8 sm:data-[state=closed]:zoom-out-100 sm:data-[state=open]:zoom-in-100'>
        <DialogTitle className='pr-12 text-xl font-bold leading-snug text-zinc-100'>
          {t("picker.choose_guitar")}
        </DialogTitle>

        {/*
          The same sockets the stash is built from, so a guitar is the same object
          wherever the player meets it — lit by its rarity, standing upright, with
          its level in the corner and its full card behind a hover.
        */}
        <div className='grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4'>
          {items.slice(0, shown).map((item) => {
            const guitar = GUITARS_BY_ID.get(item.guitarId);
            if (!guitar) return null;

            const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;
            // The copy already in this slot is grandfathered in — the cap only
            // refuses what a change would newly bring in.
            const lockedLvl = rarityLockLvl(rarity, playerLvl, isSelected);

            return (
              <div key={item.id} className='flex flex-col gap-2.5'>
                {/* A guitar socket is one column by two rows on the board; here
                    there is no board, so the cell carries that shape itself. */}
                <div className='aspect-[1/2]'>
                  <GuitarStashTile
                    item={item}
                    isEquipped={isSelected}
                    // Locked is not dimmed. A guitar the player is a few levels
                    // away from should still catch their eye — it is the reason
                    // to go and practise — so it keeps its light and says why
                    // underneath instead of being greyed into the background.
                    dimmed={isOccupied}
                    disabled={isOccupied || lockedLvl != null}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "flex min-w-0 flex-col gap-0.5",
                    isOccupied && "opacity-40",
                  )}>
                  <span className='truncate text-sm font-semibold leading-snug text-zinc-100'>
                    {guitar.name}
                  </span>
                  <span className='truncate text-xs text-zinc-400'>
                    {isOccupied ? t("picker.in_another_slot") : guitar.brand}
                  </span>
                  {lockedLvl != null && !isOccupied && (
                    <span className='flex items-center gap-1 text-xs text-zinc-400'>
                      <Lock size={11} aria-hidden />
                      {rarityLockLabel(lockedLvl, t)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {currentItemId && (
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className={cn(buttonVariants({ variant: "ghost" }), "self-start")}>
            {t("picker.remove_from_slot")}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};
