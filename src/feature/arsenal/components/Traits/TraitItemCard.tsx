import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  EXTRACTOR_RESALE_FAME,
  getImprintResaleValue,
  imprintAsTrait,
} from "feature/arsenal/data/traitCraft";
import { getItemTraits } from "feature/arsenal/data/traits";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  TraitExtractor,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";
import { Store, Syringe } from "lucide-react";
import type { ReactNode } from "react";

import { CardTraits } from "../CardTraits";
import { FameCoin } from "../Workshop/FameCoin";
import { GO_KEY } from "../Workshop/goKey";
import { ExtractorArt, ImprintArt } from "./TraitItemArt";

type TraitItem =
  | { kind: "imprint"; imprint: TraitImprint }
  | { kind: "extractor"; extractor: TraitExtractor; owned?: number };

interface TraitItemCardProps {
  item: TraitItem;
  /** Imprints only: opens the picker of instruments it can go into. */
  onInsertClick?: () => void;
  /** Extractors only: opens the list of traits it can pull out. */
  onUseClick?: () => void;
  onListClick?: () => void;
  isListing?: boolean;
  onSellClick?: () => void;
  isSelling?: boolean;
  /** Replaces the buttons — the marketplace puts seller, price and Buy here. */
  footer?: ReactNode;
}

/**
 * A Trait Imprint or a Trait Extractor, opened from its socket or seen on the
 * market. Neither has a card anywhere else: this is where the player learns
 * what the thing is and what can be done with it.
 */
export const TraitItemCard = ({
  item,
  onInsertClick,
  onUseClick,
  onListClick,
  isListing = false,
  onSellClick,
  isSelling = false,
  footer,
}: TraitItemCardProps) => {
  const { t } = useArsenalLabels();
  const isImprint = item.kind === "imprint";
  const resale = isImprint
    ? getImprintResaleValue(item.imprint)
    : EXTRACTOR_RESALE_FAME;
  const traits = isImprint
    ? getItemTraits({ traits: [imprintAsTrait(item.imprint)] })
    : [];

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <div className='h-[72px] w-[72px] shrink-0'>
          {isImprint ? <ImprintArt /> : <ExtractorArt />}
        </div>
        <div className='flex min-w-0 flex-col gap-1'>
          <span
            className={cn(
              "text-xs font-medium",
              isImprint ? "text-emerald-300/80" : "text-amber-300/80",
            )}>
            {isImprint
              ? t(`trait_craft.imprint_caps.${item.imprint.kind}`)
              : t("trait_craft.extractor_caps")}
          </span>
          <span className='text-lg font-black leading-tight text-white'>
            {isImprint
              ? t("trait_craft.imprint_name")
              : t("trait_craft.extractor_name")}
          </span>
          {!isImprint && item.owned != null && item.owned > 1 && (
            <span className='text-sm font-semibold tabular-nums text-amber-300'>
              {t("trait_craft.owned", { count: item.owned })}
            </span>
          )}
        </div>
      </div>

      {isImprint && <CardTraits traits={traits} states={null} />}

      <p className='text-sm leading-relaxed text-zinc-400'>
        {isImprint
          ? t("trait_craft.imprint_body")
          : t("trait_craft.extractor_body")}
      </p>

      {footer ?? (
        <div className='flex flex-col gap-2'>
          {onInsertClick && (
            <button
              onClick={onInsertClick}
              className={cn(
                GO_KEY,
                "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold",
              )}>
              <Syringe size={16} strokeWidth={2.5} />
              {t("trait_craft.insert_into")}
            </button>
          )}
          {onUseClick && (
            <button
              onClick={onUseClick}
              className={cn(
                GO_KEY,
                "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold",
              )}>
              <Syringe size={16} strokeWidth={2.5} />
              {t("trait_craft.use")}
            </button>
          )}
          {onListClick && (
            <button
              onClick={onListClick}
              disabled={isListing}
              className={cn(
                PRESSABLE,
                "flex items-center justify-center gap-2 rounded-lg border-b-black/30 bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-500/25",
              )}>
              <Store size={16} />
              {isListing ? t("market.listing") : t("market.sell_on_market")}
            </button>
          )}
          {onSellClick && (
            <button
              onClick={onSellClick}
              disabled={isSelling}
              className={cn(
                PRESSABLE,
                "flex items-center justify-center gap-2 rounded-lg border-b-black/30 bg-zinc-800/60 px-4 py-3 text-sm font-bold text-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500/15 hover:text-red-300",
              )}>
              <FameCoin size={16} />
              {t("common.sell_for", { fame: resale })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
