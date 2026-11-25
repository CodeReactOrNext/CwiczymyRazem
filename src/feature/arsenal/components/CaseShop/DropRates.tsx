import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useTranslation } from "hooks/useTranslation";
import { readableText } from "lib/colorTheme/colorTheme";
import { Info } from "lucide-react";

import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";
import { TapTooltip } from "./TapTooltip";

/**
 * A single rarity's odds out of one case, for the per-item tooltip.
 *
 * `GuitarRarity` carries one member no case table has — Custom Shop gear is
 * built at the bench, never rolled — so this returns undefined rather than
 * making every caller widen the table's type.
 */
export const rollChance = (
  probabilities: CaseDefinition["probabilities"],
  rarity: GuitarRarity,
): number | undefined =>
  rarity === "Custom Shop" ? undefined : probabilities[rarity];

/** The odds table itself, without a trigger around it. */
export const RarityOddsTable = ({
  probabilities,
}: {
  probabilities: CaseDefinition["probabilities"];
}) => {
  const labels = useArsenalLabels();
  const probs = (
    Object.entries(probabilities) as [GuitarRarity, number][]
  ).filter(([, prob]) => prob > 0);
  return (
    <div className='space-y-1.5'>
      {probs.map(([rarity, prob]) => {
        const rs = RARITY_STYLES[rarity];
        const logWidth = (Math.log10(prob * 100 + 1) / Math.log10(101)) * 100;
        return (
          <div key={rarity} className='flex items-center gap-2'>
            <span
              className='w-16 flex-shrink-0 text-[11px] font-semibold'
              style={{ color: readableText(rs.baseColor) }}>
              {labels.rarity(rarity)}
            </span>
            <div className='h-1 flex-1 overflow-hidden rounded bg-black/10'>
              <div
                className='h-full rounded'
                style={{
                  width: `${logWidth}%`,
                  backgroundColor: rs.baseColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <span
              className='w-12 flex-shrink-0 text-right text-[11px] font-bold'
              style={{ color: readableText(rs.baseColor) }}>
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Per-rarity odds behind a trigger. On a shelf card it is a bare info key next
 * to the name; `inline` spells itself out beside the featured case's contents
 * wherever the row has the width for it.
 */
export const DropRates = ({
  probabilities,
  variant = "icon",
  className,
}: {
  probabilities: CaseDefinition["probabilities"];
  variant?: "icon" | "inline";
  className?: string;
}) => {
  const { t } = useTranslation("arsenal");
  const isInline = variant === "inline";

  return (
    <TapTooltip
      trigger={
        <button
          type='button'
          aria-label={t(isInline ? "cases.view_drop_rates" : "cases.drop_rates")}
          className={cn(
            "flex shrink-0 items-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isInline
              ? "-mr-2 h-11 gap-1.5 px-2 text-sm font-semibold sm:h-9"
              : "h-11 w-11 justify-center hover:bg-zinc-100/10 sm:h-8 sm:w-8",
            className,
          )}>
          <Info size={16} />
          {isInline && (
            <span className='hidden sm:inline'>
              {t("cases.view_drop_rates")}
            </span>
          )}
        </button>
      }>
      <RarityOddsTable probabilities={probabilities} />
    </TapTooltip>
  );
};
