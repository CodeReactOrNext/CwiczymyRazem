import { getPartLabel, PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";

import { PartIcon } from "./PartIcon";

interface ScrapYieldListProps {
  parts: ScrapPart[];
  /** Tighter type scale for use inside a tooltip. */
  compact?: boolean;
}

/** The exact parts a teardown pays out — shared by the tooltip and the confirm dialog. */
export const ScrapYieldList = ({ parts, compact = false }: ScrapYieldListProps) => (
  <div className={compact ? "flex flex-col gap-1.5" : "flex flex-col gap-3"}>
    {parts.map((part) => (
      <div
        key={`${part.partId}:${part.tier}`}
        className={`flex items-center justify-between gap-4 ${compact ? "text-[11px]" : "text-sm"}`}>
        <span className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
          <PartIcon partId={part.partId} size={compact ? 30 : 42} />
          <span className="text-zinc-300">
            {getPartLabel(part.partId)}
            <span
              className={`ml-1.5 font-medium ${compact ? "text-[9px]" : "text-[10px]"}`}
              style={{ color: PART_TIER_COLORS[part.tier] }}>
              {part.tier}
            </span>
          </span>
        </span>
        <span className="font-bold tabular-nums text-white">×{part.qty}</span>
      </div>
    ))}
  </div>
);
