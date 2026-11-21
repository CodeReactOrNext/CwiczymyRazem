import { buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { getEffectEntries } from "feature/arsenal/utils/collectionEntries";
import { filterAndSortEntries } from "feature/arsenal/utils/collectionFilter";
import { rarityLockLabel } from "feature/progression/components/RarityLock";
import {
  rarityLockLvl,
  usePlayerLvl,
} from "feature/progression/hooks/usePlayerLvl";
import { ArrowLeftRight, Lock } from "lucide-react";
import { useMemo } from "react";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { EffectStashTile } from "../GuitarInventory/EffectStashTile";
import { useProgressiveCount } from "./useProgressiveCount";

interface EffectPickerModalProps {
  effectInventory: EffectInventoryItem[];
  occupiedItemIds: string[];
  slotIndex: number;
  currentItemId: string | null;
  /** Is there still board space for this pedal? A wide one needs more of it. */
  canFit?: (itemId: string) => boolean;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

/**
 * Picking a pedal for the board.
 *
 * The app's own dialog — a sheet on a phone, a centred panel above it — rather
 * than an overlay built by hand. One title and the grid: under each pedal its
 * name and its kind, and one quiet line only when picking it works differently
 * (it trades places with a pedal on a full board, or it is still locked).
 */
export const EffectPickerModal = ({
  effectInventory,
  occupiedItemIds,
  currentItemId,
  canFit,
  onSelect,
  onClose,
}: EffectPickerModalProps) => {
  // Every copy the player owns gets its own tile. Two copies of the same pedal
  // are two different pedals — level, condition and fitted mods all differ — so
  // collapsing them to one hid the better one behind the worse. The order is the
  // stash's own: rarest first, copies of a model side by side, best copy leading.
  const items = useMemo(
    () => filterAndSortEntries(getEffectEntries(effectInventory), "", "rarity"),
    [effectInventory],
  );
  const shown = useProgressiveCount(items.length);
  const playerLvl = usePlayerLvl();
  const labels = useArsenalLabels();
  const { t } = labels;

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
          {t("picker.choose_effect")}
        </DialogTitle>

        {items.length === 0 && (
          <p className='py-8 text-center text-sm leading-relaxed text-zinc-400'>
            {t("picker.no_effects")}
            <br />
            {t("picker.no_effects_hint")}
          </p>
        )}

        {/* The stash's own sockets, square the way a pedal sits on the board. */}
        <div className='grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4'>
          {items.slice(0, shown).map((item) => {
            const effect = EFFECTS_BY_ID.get(item.effectId);
            if (!effect) return null;

            const rarity = getEffectiveRarity(effect.rarity, item.buildLevel);
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;
            const noRoom =
              !isSelected && !isOccupied && !!canFit && !canFit(item.id);
            // The pedal already on this slot is grandfathered in — the cap only
            // refuses what a change would newly bring in.
            const lockedLvl = rarityLockLvl(rarity, playerLvl, isSelected);
            // Locked is not dimmed — see `GuitarPickerModal`. It blocks the
            // pick, but the pedal keeps its light. No room is neither: picking
            // it anyway is how a pedal is swapped in for one on the board.
            const unavailable = isOccupied;

            return (
              <div key={item.id} className='flex flex-col gap-2.5'>
                <div className='aspect-square'>
                  <EffectStashTile
                    item={item}
                    isOnPedalboard={isSelected}
                    dimmed={unavailable}
                    disabled={unavailable || lockedLvl != null}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "flex min-w-0 flex-col gap-0.5",
                    unavailable && "opacity-40",
                  )}>
                  <span className='truncate text-sm font-semibold leading-snug text-zinc-100'>
                    {effect.name}
                  </span>
                  <span className='truncate text-xs text-zinc-400'>
                    {isOccupied
                      ? t("picker.on_another_slot")
                      : labels.effectType(effect.type)}
                  </span>
                  {noRoom && lockedLvl == null && (
                    <span className='flex items-center gap-1 text-xs text-zinc-400'>
                      <ArrowLeftRight size={11} aria-hidden />
                      {t("picker.no_room")}
                    </span>
                  )}
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
