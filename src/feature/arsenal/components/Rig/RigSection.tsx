import { buttonVariants, PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
/**
 * The pieces of chrome every block of the Rig tab shares.
 *
 * One heading per section — no eyebrow over a title saying the same thing in
 * smaller type — one button style, so a row of board actions reads as a row of
 * board actions and not as four differently dressed suggestions, and one tile
 * for every readout around the board.
 */

/** The size every key on the Rig tab is cut to: thumb-sized, with a label that
    reads from across the board. They used to be 12px keys in three places. */
const RIG_KEY_SIZE = "min-h-10 gap-2 rounded-lg px-4 py-2 text-sm";

/** Every button on the Rig tab: board actions, hardware upgrades. Secondary
    tier — the app's own zinc key, the same face the ghost button has, so it
    is the grey the rest of the app is built from and not one of its own. */
export const RIG_BUTTON =
  `flex shrink-0 items-center ${RIG_KEY_SIZE} bg-zinc-800 font-semibold text-zinc-200 transition-colors duration-fast hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-zinc-800/40 disabled:text-zinc-500 disabled:hover:bg-zinc-800/40 disabled:hover:text-zinc-500 ${PRESSABLE} border-b-black/30`;

/** The one primary action on the board — adding to it. White, as the app's
    other primary actions are, so it reads first in a row of neutral buttons
    without spending cyan on a button face. */
export const RIG_BUTTON_PRIMARY = `${buttonVariants({ size: "lg" })} shrink-0`;

/** A corrective action — it fixes something the panel beside it is complaining
    about. Orange, not amber/gold — this system reserves gold for Fame. */
export const RIG_BUTTON_FIX = "text-orange-300 hover:text-orange-200";

/** A readout around the board: one raised surface, the same lip the keys have,
    so a tile and the key on it read as parts of one kit. Every panel of the
    tab is cut from it, so no two of them sit on different greys — and it is
    the app's card (`zinc-900/40`), not the bluish Arsenal grey it used to be,
    which matched nothing else on the page. */
export const RIG_TILE =
  "rounded-lg border-b-[3px] border-b-black/30 bg-zinc-900/40";

/**
 * Three tones and no more: a tick when it is fine, orange when a key on the
 * tile can fix it, grey when there is nothing to judge yet. The tab's other
 * colours are spoken for — gold is Fame, cyan is level.
 */
const TILE_TONES = {
  good: "text-emerald-400",
  fix: "text-orange-400",
  idle: "text-zinc-400",
} as const;

export type StatusTone = keyof typeof TILE_TONES;

interface StatusTileProps {
  /** What the tile measures. */
  label: string;
  /** The tile's one number, on the label's line. */
  side?: React.ReactNode;
  tone: StatusTone;
  icon: React.ReactNode;
  /** The verdict, in words. */
  title: React.ReactNode;
  /** The key that fixes it, when there is something to fix. */
  action?: React.ReactNode;
}

/**
 * The one anatomy every readout over the board shares: what is measured and
 * its number on the first line, the verdict in words on the second, and —
 * only while something is wrong — the key that fixes it beside the verdict.
 *
 * Nothing else. The sentence explaining each verdict was tried and taken out:
 * three tiles each reciting a rule made a wall of text over the board, and the
 * verdict with its key already says what to do. The rules are on the tooltips.
 */
export const StatusTile = ({
  label,
  side,
  tone,
  icon,
  title,
  action,
}: StatusTileProps) => (
  <div className={cn(RIG_TILE, "flex flex-col gap-3 px-6 py-5")}>
    <div className='flex items-baseline justify-between gap-4 text-sm text-zinc-400'>
      <span>{label}</span>
      {side && <span className='tabular-nums'>{side}</span>}
    </div>
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
      <div className='flex min-w-0 items-center gap-2.5'>
        <span aria-hidden className={cn("flex shrink-0", TILE_TONES[tone])}>
          {icon}
        </span>
        <div className='min-w-0 text-base font-semibold leading-snug text-zinc-100'>
          {title}
        </div>
      </div>
      {action}
    </div>
  </div>
);
