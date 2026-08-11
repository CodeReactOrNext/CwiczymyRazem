import type { ScrapPart } from "feature/arsenal/types/arsenal.types";

import { PartRow } from "./PartRow";

interface ScrapYieldListProps {
  parts: ScrapPart[];
  /** Tighter type scale for use inside a tooltip. */
  compact?: boolean;
}

/** The exact parts a teardown pays out — shared by the tooltip and the confirm dialog. */
export const ScrapYieldList = ({ parts, compact = false }: ScrapYieldListProps) => (
  <div className={compact ? "flex flex-col gap-1.5" : "flex flex-col gap-2"}>
    {parts.map((part, i) => (
      <PartRow
        key={`${part.partId}:${part.tier}`}
        variant='yield'
        dense={compact}
        partId={part.partId}
        tier={part.tier}
        qty={part.qty}
        index={i}
      />
    ))}
  </div>
);
