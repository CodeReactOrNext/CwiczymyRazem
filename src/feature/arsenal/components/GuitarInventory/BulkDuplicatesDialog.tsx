import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getWalletTierTotals } from "feature/arsenal/utils/scrap";
import { Coins, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import type { GuitarRarity, ScrapPart } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";
import { PLATE_NOISE_BG } from "../TierPlate";

/** Fame is the arsenal's amber everywhere; a teardown is the workshop's orange. */
const SELL_COLOR = "#fbbf24";
const SCRAP_COLOR = "#fb923c";

interface PayoutOptionProps {
  /** What the option pays in, which is also what lights the surface. */
  color: string;
  /** Drawn oversized and dimmed behind the number, half off the edge. */
  glyph: ReactNode;
  title: string;
  /** The line under the title — plain text on one, tier counts on the other. */
  detail: ReactNode;
  amount: number;
  /** The payout's own mark, at reading size, next to the number. */
  mark: ReactNode;
  disabled: boolean;
  onClick?: () => void;
}

/**
 * One of the two ways out of a duplicate sweep.
 *
 * Lit like the plates the rest of the arsenal is built from — the payout's
 * colour pooling from the corner, the same grain over it — because two flat
 * zinc panels read as background, and these are the only two things on the
 * dialog that can be pressed.
 */
const PayoutOption = ({
  color,
  glyph,
  title,
  detail,
  amount,
  mark,
  disabled,
  onClick,
}: PayoutOptionProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className='group relative flex items-center justify-between gap-4 overflow-hidden rounded-lg p-4 text-left transition-[filter] disabled:opacity-50 hover:brightness-125'
    style={{
      backgroundColor: "#141417",
      backgroundImage: [
        `radial-gradient(120% 150% at 0% 0%, ${color}33 0%, ${color}12 46%, transparent 78%)`,
        `linear-gradient(180deg, ${color}14 0%, transparent 72%)`,
      ].join(","),
      boxShadow: [
        `inset 0 0 0 1px ${color}30`,
        "inset 0 1px 0 rgba(255,255,255,0.07)",
      ].join(","),
    }}>
    <span
      aria-hidden
      className='pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay'
      style={{ backgroundImage: PLATE_NOISE_BG, backgroundSize: "140px 140px" }}
    />
    <span
      aria-hidden
      className='pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.13]'
      style={{ color }}>
      {glyph}
    </span>

    <span className='relative flex min-w-0 flex-col gap-1'>
      <span className='text-sm font-bold text-white'>{title}</span>
      {detail}
    </span>
    <span className='relative flex flex-shrink-0 items-center gap-2'>
      {mark}
      <span
        className='text-2xl font-black tabular-nums'
        style={{ color, textShadow: `0 0 14px ${color}55` }}>
        {amount}
      </span>
    </span>
  </button>
);

export interface DuplicateItem {
  id: string;
  name: string;
  rarity: GuitarRarity;
  level: number;
  value: number;
}

interface BulkDuplicatesDialogProps {
  isOpen: boolean;
  items: DuplicateItem[];
  fameReward: number;
  /** Merged teardown yield for the same batch. Omitting it hides the scrap option. */
  scrapParts?: ScrapPart[];
  /** How many fitted mods the teardown would pull out whole into the stash. */
  salvagedCount?: number;
  onSell: () => void;
  onScrap?: () => void;
  onCancel: () => void;
  isSelling: boolean;
  isScrapping?: boolean;
  /** Which owned copies are excluded from the sweep (shown in the warning line). */
  protectedNote?: string;
}

/**
 * What to do with every lower-level duplicate at once.
 *
 * The batch is the same either way — the choice is only what it pays: Fame now,
 * or parts for the workshop. Both prices sit on the button that takes them, so
 * the decision is made by reading two numbers rather than by remembering which
 * button does what.
 */
export const BulkDuplicatesDialog = ({
  isOpen,
  items,
  fameReward,
  scrapParts,
  salvagedCount = 0,
  onSell,
  onScrap,
  onCancel,
  isSelling,
  isScrapping = false,
  protectedNote = "Equipped and rig guitars are never touched.",
}: BulkDuplicatesDialogProps) => {
  const count = items.length;
  const busy = isSelling || isScrapping;
  const partCount = (scrapParts ?? []).reduce((sum, p) => sum + p.qty, 0);
  const canScrap = Boolean(onScrap) && partCount > 0;
  const tierTotals = canScrap ? getWalletTierTotals(scrapParts ?? []) : [];

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}>
      <AlertDialogContent className='flex max-h-[85vh] max-w-md flex-col gap-6 border-0 bg-zinc-900 p-6'>
        <AlertDialogHeader className='space-y-2'>
          <AlertDialogTitle className='text-lg font-bold text-white'>
            Clear duplicates?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm text-zinc-400'>
            This takes <span className='font-semibold text-white'>{count}</span>{" "}
            lower-level duplicate
            {count === 1 ? "" : "s"}, keeping the best copy of each.{" "}
            {protectedNote} This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='-mx-1 min-h-0 flex-1 overflow-y-auto px-1'>
          <ul className='flex flex-col gap-1'>
            {items.map((item) => {
              const color = RARITY_STYLES[item.rarity].baseColor;
              return (
                <li
                  key={item.id}
                  className='flex items-center gap-2 rounded bg-zinc-800/50 px-2.5 py-1.5'>
                  <span
                    className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white'
                    style={{
                      border: `1.5px solid ${color}`,
                      boxShadow: `0 0 6px ${color}55`,
                    }}
                    title='Guitar level'>
                    {item.level}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-xs font-semibold text-white'>
                      {item.name}
                    </p>
                    <p
                      className='text-[10px] font-medium tracking-wider'
                      style={{ color }}>
                      {item.rarity}
                    </p>
                  </div>
                  <span className='flex flex-shrink-0 items-center gap-1 text-xs font-bold text-amber-400'>
                    <img
                      src='/images/coin.png'
                      alt='coin'
                      className='h-3 w-3 object-contain'
                    />
                    {item.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The two payouts, each on the button that takes it. */}
        <div className='flex flex-shrink-0 flex-col gap-2'>
          <PayoutOption
            color={SELL_COLOR}
            glyph={<Coins size={104} strokeWidth={1.25} />}
            title={isSelling ? "Selling..." : `Sell all ${count}`}
            detail={
              <span className='text-xs text-zinc-400'>
                Paid straight into Fame Points
              </span>
            }
            amount={fameReward}
            mark={
              <img
                src='/images/coin.png'
                alt='coin'
                className='h-4 w-4 object-contain'
              />
            }
            disabled={busy}
            onClick={onSell}
          />

          {canScrap && (
            <PayoutOption
              color={SCRAP_COLOR}
              glyph={<Wrench size={104} strokeWidth={1.25} />}
              title={isScrapping ? "Scrapping..." : `Scrap all ${count}`}
              detail={
                <>
                  {/* Split by tier — a bare total says nothing about what the
                      workshop can actually pay for with the pile. */}
                  <span className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                    {tierTotals.map(({ tier, qty }) => (
                      <span key={tier} className='flex items-baseline gap-1'>
                        <span className='text-xs font-bold tabular-nums text-zinc-300'>
                          {qty}
                        </span>
                        <span
                          className='text-[10px] font-semibold'
                          style={{ color: PART_TIER_COLORS[tier] }}>
                          {tier}
                        </span>
                      </span>
                    ))}
                  </span>
                  {salvagedCount > 0 && (
                    <span className='text-xs text-purple-300/90'>
                      {salvagedCount} mod{salvagedCount === 1 ? "" : "s"} pulled
                      out and stashed
                    </span>
                  )}
                </>
              }
              amount={partCount}
              mark={<Wrench size={16} style={{ color: SCRAP_COLOR }} />}
              disabled={busy}
              onClick={onScrap}
            />
          )}
        </div>

        <AlertDialogFooter className='flex-shrink-0 sm:space-x-0'>
          <AlertDialogCancel
            disabled={busy}
            className='mt-0 w-full border-0 bg-zinc-700 text-white hover:bg-zinc-600 hover:text-white'>
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
