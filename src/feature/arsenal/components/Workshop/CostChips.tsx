import { cn } from "assets/lib/utils";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useFuseParts } from "feature/arsenal/hooks/useFuseParts";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { getMakeOffer } from "feature/arsenal/utils/workshopReadiness";
import { Hammer } from "lucide-react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "./FameCoin";
import { GO_KEY } from "./goKey";

interface CostLine {
  partId: PartId;
  tier: PartTier;
  need: number;
  have: number;
}

interface CostChipsProps {
  lines: CostLine[];
  /** The Fame part of the bill, when the job has one. */
  fame?: { need: number; have: number };
  /** The whole wallet, to see whether a short part can be made from the tier below. */
  wallet: ScrapPart[];
  /** What the player can spend on the rework fee. */
  playerFame: number;
  /** Turns the "Make" keys off — while the job itself is running. */
  busy?: boolean;
}

/**
 * A job's bill as a row of chips: the part, then "have/need".
 *
 * Replaces the Required / Owned table — one glance answers both columns, and a
 * shortfall is the number turning amber. When a short part can be reworked up
 * from the tier below, the chip carries a green "Make" that does exactly that,
 * which is also how a player finds out parts climb tiers at all.
 */
export const CostChips = ({
  lines,
  fame,
  wallet,
  playerFame,
  busy = false,
}: CostChipsProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { mutate: fuse, isPending: isFusing } = useFuseParts();

  return (
    <div className='flex flex-wrap justify-center gap-2'>
      {lines.map((line) => {
        const short = Math.max(0, line.need - line.have);
        const offer = getMakeOffer(
          wallet,
          line.partId,
          line.tier,
          short,
          playerFame,
        );
        return (
          <span
            key={`${line.partId}:${line.tier}`}
            title={labels.partName(line.tier, line.partId)}
            className='flex items-center gap-2.5 rounded-lg bg-zinc-800/60 py-1.5 pl-1.5 pr-3'>
            <TierPlate
              color={PART_TIER_COLORS[line.tier]}
              size={32}
              muted={short > 0}>
              <PartIcon partId={line.partId} size={24} />
            </TierPlate>
            <span className='sr-only'>
              {labels.partName(line.tier, line.partId)}
            </span>
            <span
              className={cn(
                "text-sm font-black tabular-nums",
                short > 0 ? "text-amber-400" : "text-zinc-100",
              )}>
              {line.have.toLocaleString()}/{line.need.toLocaleString()}
            </span>
            {offer && (
              <button
                type='button'
                disabled={busy || isFusing}
                onClick={() =>
                  fuse({
                    partId: offer.partId,
                    tier: offer.fromTier,
                    crafts: offer.crafts,
                  })
                }
                title={t("workshop.make_hint", {
                  count: offer.crafts,
                  tier: labels.partTier(offer.fromTier),
                })}
                className={cn(
                  GO_KEY,
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black",
                )}>
                <Hammer size={12} strokeWidth={2.75} aria-hidden />
                {t("workshop.make")}
              </button>
            )}
          </span>
        );
      })}

      {fame && fame.need > 0 && (
        <span className='flex items-center gap-2 rounded-lg bg-zinc-800/60 py-1.5 pl-2 pr-3'>
          <FameCoin size={24} />
          <span className='sr-only'>{t("common.fame")}</span>
          <span
            className={cn(
              "text-sm font-black tabular-nums",
              fame.have < fame.need ? "text-amber-400" : "text-zinc-100",
            )}>
            {fame.need.toLocaleString()}
          </span>
        </span>
      )}
    </div>
  );
};
