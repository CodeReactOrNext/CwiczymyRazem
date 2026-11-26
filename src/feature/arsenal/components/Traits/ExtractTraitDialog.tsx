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
import type { ResolvedTrait } from "feature/arsenal/data/traits";
import { formatTraitValue } from "feature/arsenal/data/traits";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useState } from "react";

import { ExtractorArt } from "./TraitItemArt";

interface ExtractTraitDialogProps {
  isOpen: boolean;
  itemName: string;
  traits: ResolvedTrait[];
  extractors: number;
  onConfirm: (traitId: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Pulling one trait out of an instrument. The player picks which trait when
 * there is more than one, sees that it costs one extractor, and that the
 * instrument keeps playing without it.
 */
export const ExtractTraitDialog = ({
  isOpen,
  itemName,
  traits,
  extractors,
  onConfirm,
  onCancel,
  isLoading,
}: ExtractTraitDialogProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const [picked, setPicked] = useState<string | null>(
    traits.length === 1 ? traits[0].def.id : null,
  );

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel();
      }}>
      <AlertDialogContent className='max-w-md gap-6'>
        <AlertDialogHeader className='space-y-2'>
          <AlertDialogTitle className='text-lg font-bold text-white'>
            {t("trait_craft.extract_title")}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm text-zinc-400'>
            {t("trait_craft.extract_body", { name: itemName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='flex flex-col gap-2'>
          {traits.map((trait) => {
            const selected = picked === trait.def.id;
            return (
              <button
                key={trait.def.id}
                type='button'
                onClick={() => setPicked(trait.def.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                  selected
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800",
                )}>
                <span
                  aria-hidden
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    selected ? "bg-emerald-400" : "bg-zinc-700",
                  )}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold'>
                    {labels.traitLabel(trait)}
                  </span>
                  <span className='block truncate text-xs text-zinc-400'>
                    {labels.traitDescription(trait)}
                  </span>
                </span>
                <span className='shrink-0 text-sm font-bold tabular-nums text-emerald-300'>
                  {formatTraitValue(trait.value)}
                </span>
              </button>
            );
          })}
        </div>

        <div className='flex items-center gap-3 rounded-lg bg-amber-500/10 p-3'>
          <div className='h-10 w-10 shrink-0'>
            <ExtractorArt />
          </div>
          <p className='text-xs leading-relaxed text-zinc-300'>
            {t("trait_craft.extract_cost", { count: extractors })}
          </p>
        </div>

        <AlertDialogFooter className='gap-2 sm:space-x-0'>
          <AlertDialogCancel disabled={isLoading} className='mt-0 sm:flex-1'>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (picked) onConfirm(picked);
            }}
            disabled={isLoading || !picked || extractors <= 0}
            className='sm:flex-1'>
            {isLoading ? t("trait_craft.extracting") : t("trait_craft.extract")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
