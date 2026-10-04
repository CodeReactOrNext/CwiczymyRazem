import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { CommissionTarget } from "feature/arsenal/data/commission";
import {
  getCommissionedEffect,
  getCommissionedGuitar,
  getCommissionQuote,
  getTargetSubject,
} from "feature/arsenal/data/commission";
import { useWorkshopCommission } from "feature/arsenal/hooks/useWorkshopCommission";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Hammer, X } from "lucide-react";
import { useMemo } from "react";

import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "../RarityBadge";
import { sectionLabelClass } from "../SectionLabel";
import { CostTable } from "../Workshop/CostTable";

interface CommissionDialogProps {
  /** The model being ordered. `null` keeps the dialog shut. */
  target: CommissionTarget | null;
  wallet: ScrapPart[];
  fame: number;
  onClose: () => void;
}

/** Stand-in id for the instance shown before it exists. */
const PREVIEW_ID = "commission-preview";

/**
 * Ordering one model from the bench: the exact instance that will arrive, the
 * exact bill, and one button.
 *
 * The preview is the real card rendered off the same pure function the API
 * mints from, so what the player reads here is what lands in the stash — only
 * the serial is assigned on delivery. Once the order goes through, the same
 * dialog shows the delivered card instead of stacking a second one on top.
 */
export const CommissionDialog = ({
  target,
  wallet,
  fame,
  onClose,
}: CommissionDialogProps) => {
  const commission = useWorkshopCommission();
  const delivered = commission.data?.item;

  const quote = useMemo(
    () =>
      target
        ? getCommissionQuote(getTargetSubject(target), wallet, fame)
        : null,
    [target, wallet, fame],
  );

  const close = () => {
    if (commission.isPending) return;
    commission.reset();
    onClose();
  };

  if (!target || !quote) return null;

  const { def } = target;
  const imageSrc =
    target.kind === "guitar"
      ? getRankBadgeSrc(target.def.imageId, "medium")
      : getEffectImageSrc(target.def.imageId, "medium");

  const preview =
    target.kind === "guitar" ? (
      <GuitarCard
        item={
          (delivered as InventoryItem | undefined) ?? {
            ...getCommissionedGuitar(target.def),
            id: PREVIEW_ID,
            acquiredAt: 0,
            isNew: false,
          }
        }
        readOnly
      />
    ) : (
      <EffectCard
        item={
          (delivered as EffectInventoryItem | undefined) ?? {
            ...getCommissionedEffect(target.def),
            id: PREVIEW_ID,
            acquiredAt: 0,
            isNew: false,
          }
        }
        readOnly
      />
    );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}>
      <DialogContent
        hideCloseButton
        // An order in flight must not be dismissed out from under itself.
        onEscapeKeyDown={(e) => commission.isPending && e.preventDefault()}
        onInteractOutside={(e) => commission.isPending && e.preventDefault()}
        className={cn(
          "flex max-h-[100dvh] flex-col gap-7 border-0 bg-zinc-900 p-6 sm:max-h-[90vh] sm:max-w-3xl sm:overflow-y-auto sm:p-7",
          // MobileBottomNav (z-[100]) floats over dialogs below lg; leave room
          // under the buttons so they can scroll clear of it.
          "pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-7",
        )}>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-4'>
            <span className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950/60'>
              <img
                src={imageSrc}
                alt=''
                draggable={false}
                className='h-14 w-14 object-contain'
              />
            </span>
            <div className='flex min-w-0 flex-col gap-1'>
              <DialogTitle className='text-2xl font-black text-white'>
                {delivered ? "Delivered" : `Commission ${def.name}`}
              </DialogTitle>
              <DialogDescription className={sectionLabelClass}>
                {def.brand} ·{" "}
                <span style={{ color: RARITY_STYLES[def.rarity].baseColor }}>
                  {def.rarity}
                </span>
              </DialogDescription>
            </div>
          </div>

          <button
            onClick={close}
            disabled={commission.isPending}
            aria-label='Close'
            className='rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60 disabled:opacity-40 hover:bg-zinc-800 hover:text-zinc-200'>
            <X size={16} />
          </button>
        </div>

        <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
          <div className='mx-auto w-full max-w-[250px] shrink-0'>{preview}</div>

          {delivered ? (
            <p className='text-sm text-zinc-400 sm:pt-2'>
              In your stash and recorded in the Dex. Every mod slot is free.
            </p>
          ) : (
            <div className='flex min-w-0 flex-1 flex-col gap-4'>
              <p className='text-sm text-zinc-400'>
                Built stock: Mint, no mods, no traits.
              </p>
              <CostTable
                title='Commission cost'
                recipe={quote.recipe}
                fame={{ need: quote.fame, have: fame }}
              />
            </div>
          )}
        </div>

        {delivered ? (
          <button
            onClick={close}
            className='rounded-lg bg-zinc-100 px-5 py-3.5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-white'>
            Done
          </button>
        ) : (
          <div className='flex flex-col gap-3 sm:flex-row'>
            <button
              onClick={close}
              disabled={commission.isPending}
              className='rounded-lg bg-zinc-800 px-5 py-3.5 text-sm font-bold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:opacity-40 hover:bg-zinc-700 hover:text-white sm:w-44'>
              Cancel
            </button>
            <button
              onClick={() =>
                commission.mutate({ kind: target.kind, definitionId: def.id })
              }
              disabled={!quote.canAfford || commission.isPending}
              className={cn(
                "flex flex-1 items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-sm font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
                "disabled:pointer-events-none disabled:opacity-40",
                quote.canAfford
                  ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
                  : "bg-zinc-800/60 text-zinc-500",
              )}>
              <Hammer size={16} />
              {commission.isPending ? "Building…" : "Commission"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
