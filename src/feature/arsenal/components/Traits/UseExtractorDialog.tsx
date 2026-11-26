import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import { Button } from "assets/components/ui/button";
import { getTraitTarget } from "feature/arsenal/data/traitCraft";
import { formatTraitValue, getItemTraits } from "feature/arsenal/data/traits";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  EffectInventoryItem,
  InventoryItem,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { useMemo } from "react";

import { getRarityColor } from "../RarityBadge";
import { ExtractorArt } from "./TraitItemArt";

interface UseExtractorDialogProps {
  isOpen: boolean;
  inventory: InventoryItem[];
  effectInventory: EffectInventoryItem[];
  extractors: number;
  onExtract: (input: {
    kind: WorkshopKind;
    itemId: string;
    traitId: string;
  }) => void;
  onCancel: () => void;
  /** The trait being pulled out right now, so only its key spins. */
  pendingTraitKey: string | null;
}

/**
 * Using an extractor in one step: every trait on every instrument the player
 * owns, each with its own Extract key. No hunting for the right guitar in the
 * stash first — the extractor shows where it can be used.
 */
export const UseExtractorDialog = ({
  isOpen,
  inventory,
  effectInventory,
  extractors,
  onExtract,
  onCancel,
  pendingTraitKey,
}: UseExtractorDialogProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;

  const instruments = useMemo(
    () =>
      [
        ...inventory.map((item) => ({ kind: "guitar" as const, item })),
        ...effectInventory.map((item) => ({ kind: "effect" as const, item })),
      ]
        .map(({ kind, item }) => {
          const target = getTraitTarget(kind, item);
          const traits = getItemTraits(item);
          return target && traits.length > 0
            ? {
                kind,
                itemId: item.id,
                name: target.name,
                rarity: target.rarity,
                traits,
              }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [inventory, effectInventory],
  );

  const busy = pendingTraitKey !== null;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}>
      <AlertDialogContent className='max-w-lg gap-6'>
        <AlertDialogHeader className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 shrink-0'>
              <ExtractorArt />
            </div>
            <AlertDialogTitle className='text-lg font-bold text-white'>
              {t("trait_craft.use_title")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className='text-sm text-zinc-400'>
            {t("trait_craft.use_body", { count: extractors })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='flex max-h-[26rem] flex-col gap-4 overflow-y-auto pr-1'>
          {instruments.length === 0 && (
            <p className='rounded-lg bg-zinc-800/50 p-4 text-sm text-zinc-400'>
              {t("trait_craft.use_empty")}
            </p>
          )}
          {instruments.map((instrument) => (
            <div key={instrument.itemId} className='flex flex-col gap-2'>
              <p className='truncate text-sm font-semibold text-zinc-200'>
                {instrument.name}{" "}
                <span
                  className='text-xs font-medium'
                  style={{ color: getRarityColor(instrument.rarity) }}>
                  {labels.rarity(instrument.rarity)}
                </span>
              </p>
              {instrument.traits.map((trait) => {
                const key = `${instrument.itemId}:${trait.def.id}`;
                return (
                  <div
                    key={key}
                    className='flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3'>
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-semibold text-emerald-200'>
                        {labels.traitLabel(trait)}
                      </span>
                      <span className='block truncate text-xs text-zinc-400'>
                        {labels.traitDescription(trait)}
                      </span>
                    </span>
                    <span className='shrink-0 text-sm font-bold tabular-nums text-emerald-300'>
                      {formatTraitValue(trait.value)}
                    </span>
                    <Button
                      size='sm'
                      className='shrink-0'
                      disabled={busy || extractors <= 0}
                      loading={pendingTraitKey === key}
                      onClick={() =>
                        onExtract({
                          kind: instrument.kind,
                          itemId: instrument.itemId,
                          traitId: trait.def.id,
                        })
                      }>
                      {t("trait_craft.extract")}
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <AlertDialogFooter className='sm:space-x-0'>
          <AlertDialogCancel disabled={busy} className='mt-0 sm:flex-1'>
            {t("common.cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
