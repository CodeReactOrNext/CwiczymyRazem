import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { Copy } from "lucide-react";

import type { BoardLevel } from "../../data/boardDuplicates";
import { describeDuplicateRule } from "../../data/boardDuplicates";
import { CountUp } from "../Workshop/workshopMotion";
import { StatusTile } from "./RigSection";

/**
 * What the board's duplicates are costing, and which pedals they are — the
 * third tile of the row over the board, in the same pattern as the other two.
 *
 * Only on screen while there is something to say: a board of different pedals
 * has no tile here at all. Once a second copy lands, this reads off the *live*
 * board — the same instant the cable and the wiring verdict move — so the cost
 * of the drop is visible before the save.
 *
 * The verdict names the models and how many of each are standing, and the
 * number beside the label is what they cost. Nothing more: what each copy is
 * counted at is on the marks the pedals themselves carry, and the rule is on
 * the tooltip — spelled out on the tile it was one sentence too many.
 */

interface DuplicateStripProps {
  board: BoardLevel;
  /**
   * The pedal whose copies are lit on the board, and how to light them: the
   * name a pointer is on lights the same set the pedals themselves do, so the
   * tile above the board and the board below it are one readout, not two.
   */
  activeModel?: number | string | null;
  onHoverModel?: (model: number | string | null) => void;
}

export const DuplicateStrip = ({
  board,
  activeModel,
  onHoverModel,
}: DuplicateStripProps) => {
  const { t } = useArsenalLabels();
  if (board.duplicates.length === 0) return null;

  return (
    <StatusTile
      label={t("duplicates.title")}
      side={
        <>
          <CountUp value={board.penalty} prefix='−' />{" "}
          <span className='text-xs text-zinc-400'>
            {t("workshop.levels_word", { count: board.penalty })}
          </span>
        </>
      }
      tone='idle'
      icon={<Copy size={18} strokeWidth={2} />}
      title={
        <span
          className='flex flex-wrap gap-x-3 gap-y-1'
          title={describeDuplicateRule(t)}>
          {board.duplicates.map((group) => (
            <span
              key={String(group.model)}
              onMouseEnter={() => onHoverModel?.(group.model)}
              onMouseLeave={() => onHoverModel?.(null)}
              title={group.copies
                .map((copy) =>
                  t("duplicates.copy_line", {
                    name: copy.name,
                    level: copy.level,
                    counted: copy.counted,
                  }),
                )
                .join("\n")}
              className={cn(
                "cursor-default transition-colors duration-fast",
                activeModel === group.model && "text-white",
              )}>
              {group.name} ×{group.copies.length}
            </span>
          ))}
        </span>
      }
    />
  );
};
