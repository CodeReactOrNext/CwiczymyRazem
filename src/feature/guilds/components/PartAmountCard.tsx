import { Chip } from "assets/components/ui/chip";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { HonorMark } from "feature/guilds/components/HonorMark";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { useState } from "react";

interface PartAmountCardProps {
  part: ScrapPart;
  /** Which side of the shelf the pieces are crossing. */
  mode: "deposit" | "take";
  /** Deposit only: honor earned per piece left — leaving more earns more. */
  honorPerPiece?: number;
  /** Take only: the flat honor a take costs, however many pieces come with it. */
  honorCost?: number;
  /** Take only: the honor the member has to pay with. */
  honorBalance?: number;
  busy?: boolean;
  onConfirm: (qty: number) => void;
}

const confirmButtonClass =
  "rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const minorButtonClass =
  "rounded-lg px-4 py-2 text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * How many pieces of a stack are changing hands.
 *
 * Everything else on the shelf is a thing and moves whole, but parts are a
 * currency — a guild pool is only worth having if a member can take the eight
 * screws their build wants without emptying it, and only safe to give to if a
 * mis-drop cannot cost somebody their whole holding. So a stack of more than
 * one stops and asks, and the amount is the only thing this asks about.
 */
export const PartAmountCard = ({
  part,
  mode,
  honorPerPiece,
  honorCost,
  honorBalance,
  busy = false,
  onConfirm,
}: PartAmountCardProps) => {
  const [qty, setQty] = useState(part.qty);
  const { t } = useTranslation("guilds");
  const color = PART_TIER_COLORS[part.tier];
  const verbKey = mode === "deposit" ? "parts.leave" : "parts.take";

  // A deposit earns per piece; a take costs the same flat price whatever the
  // slider says, because how much of the stack moves is not what is priced.
  const honor =
    mode === "take"
      ? (honorCost ?? null)
      : honorPerPiece === undefined
        ? null
        : honorPerPiece * qty;
  const honorAll =
    mode === "take"
      ? (honorCost ?? null)
      : honorPerPiece === undefined
        ? null
        : honorPerPiece * part.qty;
  // Only a take is limited by the balance; a deposit only ever adds to it.
  const cannotPay = (amount: number | null) =>
    mode === "take" &&
    amount !== null &&
    honorBalance !== undefined &&
    amount > honorBalance;

  return (
    <div className='flex flex-col gap-7 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <TierPlate color={color} size={72}>
          <PartIcon partId={part.partId} size={40} />
        </TierPlate>
        <div className='flex min-w-0 flex-col gap-1.5'>
          <span
            className='text-[11px] font-semibold tracking-wide'
            style={{ color }}>
            {t("parts.tier_part", {
              tier: t(`parts.tiers.${part.tier}`, part.tier),
            })}
          </span>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate text-xl font-black text-zinc-100'>
              {getPartLabel(part.partId)}
            </span>
            <Chip className='shrink-0 px-2 py-0.5 tabular-nums'>
              ×{part.qty}
            </Chip>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-5'>
        {/* The number is the headline here, not the part — it is the one thing
            the player came to this panel to decide. */}
        <div className='flex items-baseline justify-center gap-2'>
          <span className='text-4xl font-black tabular-nums' style={{ color }}>
            {qty}
          </span>
          <span className='text-sm font-semibold text-zinc-500'>
            {t("parts.of", { count: part.qty })}
          </span>
        </div>

        <Slider
          value={[qty]}
          min={1}
          max={part.qty}
          step={1}
          disabled={busy}
          onValueChange={([next]) => setQty(next)}
          aria-label={
            mode === "deposit"
              ? t("parts.how_many_leave")
              : t("parts.how_many_take")
          }
        />
      </div>

      {honor !== null && (
        <p className='flex items-center justify-center gap-2 text-xs tabular-nums text-zinc-400'>
          <HonorMark size={18} />
          <Interpolate
            text={
              mode === "deposit"
                ? t("parts.earns_honor")
                : t("parts.costs_honor")
            }
            values={{
              honor: <span className='font-bold text-purple-300'>{honor}</span>,
            }}
          />
          {mode === "take" && honorBalance !== undefined && (
            <span
              className={cn(
                cannotPay(honor) ? "text-orange-400" : "text-zinc-500",
              )}>
              · {t("parts.you_have", { count: honorBalance.toLocaleString() })}
            </span>
          )}
        </p>
      )}

      <div className='flex flex-col gap-2'>
        <button
          onClick={() => onConfirm(qty)}
          disabled={busy || cannotPay(honor)}
          className={cn(
            confirmButtonClass,
            "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
          )}>
          {t(verbKey, { count: qty })}
        </button>

        {qty !== part.qty && (
          <button
            onClick={() => onConfirm(part.qty)}
            disabled={busy || cannotPay(honorAll)}
            className={minorButtonClass}>
            {t(`${verbKey}_all`, { count: part.qty })}
          </button>
        )}
      </div>
    </div>
  );
};
