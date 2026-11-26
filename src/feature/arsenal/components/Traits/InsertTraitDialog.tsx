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
import { cn } from "assets/lib/utils";
import {
  imprintAsTrait,
  type InsertTarget,
  listInsertTargets,
  MAX_ITEM_TRAITS,
} from "feature/arsenal/data/traitCraft";
import { formatTraitValue, getItemTraits } from "feature/arsenal/data/traits";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  EffectInventoryItem,
  InventoryItem,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";
import { useMemo, useState } from "react";

import { getRarityColor } from "../RarityBadge";
import { FameCoin } from "../Workshop/FameCoin";
import { ImprintArt } from "./TraitItemArt";

interface InsertTraitDialogProps {
  isOpen: boolean;
  imprint: TraitImprint;
  inventory: InventoryItem[];
  effectInventory: EffectInventoryItem[];
  fame: number;
  onConfirm: (target: InsertTarget) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Putting an imprint into an instrument. Every instrument of the right kind is
 * listed; the ones that cannot take it say why, and the price on each grows
 * with the traits it already carries.
 */
export const InsertTraitDialog = ({
  isOpen,
  imprint,
  inventory,
  effectInventory,
  fame,
  onConfirm,
  onCancel,
  isLoading,
}: InsertTraitDialogProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const [pickedId, setPickedId] = useState<string | null>(null);

  const targets = useMemo(
    () => listInsertTargets(imprint, inventory, effectInventory),
    [imprint, inventory, effectInventory],
  );
  const [trait] = getItemTraits({ traits: [imprintAsTrait(imprint)] });
  const picked = targets.find((target) => target.itemId === pickedId) ?? null;
  const cost = picked?.decision.ok ? picked.decision.cost : null;
  const canAfford = cost !== null && fame >= cost;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel();
      }}>
      <AlertDialogContent className='max-w-lg gap-6'>
        <AlertDialogHeader className='space-y-2'>
          <AlertDialogTitle className='text-lg font-bold text-white'>
            {t("trait_craft.insert_title")}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm text-zinc-400'>
            {t("trait_craft.insert_body", { max: MAX_ITEM_TRAITS })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {trait && (
          <div className='flex items-center gap-4 rounded-lg bg-emerald-500/10 p-4'>
            <div className='h-12 w-12 shrink-0'>
              <ImprintArt />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold text-emerald-200'>
                {labels.traitLabel(trait)}
              </p>
              <p className='truncate text-xs text-zinc-400'>
                {labels.traitDescription(trait)}
              </p>
            </div>
            <span className='shrink-0 text-lg font-black tabular-nums text-emerald-300'>
              {formatTraitValue(trait.value)}
            </span>
          </div>
        )}

        <div className='flex max-h-72 flex-col gap-2 overflow-y-auto pr-1'>
          {targets.length === 0 && (
            <p className='rounded-lg bg-zinc-800/50 p-4 text-sm text-zinc-400'>
              {t(`trait_craft.no_targets.${imprint.kind}`)}
            </p>
          )}
          {targets.map((target) => {
            const ok = target.decision.ok;
            const selected = target.itemId === pickedId;
            return (
              <button
                key={target.itemId}
                type='button'
                disabled={!ok}
                onClick={() => setPickedId(target.itemId)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                  selected
                    ? "bg-emerald-500/15"
                    : "bg-zinc-800/50 hover:bg-zinc-800",
                  !ok && "cursor-not-allowed opacity-50 hover:bg-zinc-800/50",
                )}>
                <span
                  aria-hidden
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    selected ? "bg-emerald-400" : "bg-zinc-700",
                  )}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold text-zinc-100'>
                    {target.name}
                  </span>
                  <span className='block truncate text-xs'>
                    <span style={{ color: getRarityColor(target.rarity) }}>
                      {labels.rarity(target.rarity)}
                    </span>
                    <span className='text-zinc-500'>
                      {" · "}
                      {target.decision.ok
                        ? t("trait_craft.slots", {
                            count: target.traitCount,
                            max: MAX_ITEM_TRAITS,
                          })
                        : t(`trait_craft.refusal.${target.decision.reason}`)}
                    </span>
                  </span>
                </span>
                {target.decision.ok && (
                  <span className='flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-amber-300'>
                    <FameCoin size={14} />
                    {target.decision.cost.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {cost !== null && !canAfford && (
          <p className='text-sm text-red-300'>
            {t("trait_craft.not_enough_fame", {
              missing: (cost - fame).toLocaleString(),
            })}
          </p>
        )}

        <AlertDialogFooter className='gap-2 sm:space-x-0'>
          <AlertDialogCancel disabled={isLoading} className='mt-0 sm:flex-1'>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (picked && canAfford) onConfirm(picked);
            }}
            disabled={isLoading || !picked || !canAfford}
            className='sm:flex-1'>
            {isLoading
              ? t("trait_craft.inserting")
              : cost !== null
                ? t("trait_craft.insert_for", { fame: cost.toLocaleString() })
                : t("trait_craft.insert")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
