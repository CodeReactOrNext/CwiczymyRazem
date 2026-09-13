import type { BoardLevel } from "../../data/boardDuplicates";
import {
  describeDuplicateRule,
  formatDuplicateShare,
} from "../../data/boardDuplicates";
import { CountUp } from "../Workshop/workshopMotion";
import { Lamp } from "./BoardStatusStrip";

/**
 * What the board's duplicates are costing, and which pedals they are.
 *
 * Only on screen while there is something to say: a board of different pedals
 * has no line here at all, and the Rig Sheet's muted "Duplicates —" figure is
 * where a player first learns the rule exists. Once a second copy lands, this
 * reads off the *live* board — the same instant the cable and the wiring
 * verdict move — so the cost of the drop is visible before the save.
 *
 * One chip per model: its name, how many are standing, and what each copy is
 * counted at, so the player can see which copy to take off without reading
 * anything else. The rule itself is the one line on the right.
 */

interface DuplicateStripProps {
  board: BoardLevel;
}

export const DuplicateStrip = ({ board }: DuplicateStripProps) => {
  if (board.duplicates.length === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-arsenal-section px-5 py-3'>
      <span className='text-sm font-semibold text-arsenal-text-primary'>
        Duplicates
      </span>

      <div className='flex items-center gap-2.5'>
        <Lamp tone='warn' />
        <span className='flex items-baseline gap-1 text-sm font-bold tabular-nums text-amber-300'>
          <CountUp value={board.penalty} prefix='−' />
          <span className='text-xs font-semibold text-amber-500/70'>
            levels
          </span>
        </span>
      </div>

      <div className='flex flex-wrap items-center gap-1.5'>
        {board.duplicates.map((group) => (
          <span
            key={String(group.model)}
            title={group.copies
              .map(
                (copy) =>
                  `${copy.name} Lv ${copy.level} → counts ${copy.counted}`,
              )
              .join("\n")}
            className='flex cursor-default items-center gap-2 rounded-md bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300'>
            {group.name} ×{group.copies.length}
            <span className='font-semibold tabular-nums text-amber-500/70'>
              {group.copies
                .map((copy) => formatDuplicateShare(copy.share) ?? "1")
                .join(" · ")}
            </span>
          </span>
        ))}
      </div>

      <span className='text-xs text-arsenal-text-tertiary sm:ml-auto'>
        {describeDuplicateRule()}
      </span>
    </div>
  );
};
