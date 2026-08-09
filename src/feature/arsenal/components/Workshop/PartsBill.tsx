import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";

import { PartIcon } from "../Parts/PartIcon";

interface PartsBillProps {
  parts: ScrapPart[];
  /** Heading above the row — says what this bill *is*. */
  title: string;
}

/**
 * Exactly which pieces leave the wallet, as artwork.
 *
 * A cost the player cannot picture is a cost they cannot plan around, so the bill
 * is drawn with the same part icons they see in their wallet, tagged with the
 * same tier colours — never as an abstract total.
 */
export const PartsBill = ({ parts, title }: PartsBillProps) => {
  if (parts.length === 0) return null;

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-950/40 p-4'>
      <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
        {title}
      </span>

      <div className='flex flex-wrap gap-2'>
        {parts.map((part) => (
          <div
            key={`${part.partId}:${part.tier}`}
            className='flex items-center gap-2.5 rounded-lg bg-zinc-800/50 py-2 pl-2 pr-3'
            title={`${part.qty}× ${getPartLabel(part.partId)} (${part.tier})`}>
            <span className='relative flex h-9 w-9 items-center justify-center'>
              <PartIcon partId={part.partId} size={34} />
            </span>

            <span className='flex flex-col gap-0.5'>
              <span className='text-xs font-bold text-zinc-100'>
                <span className='tabular-nums'>{part.qty}×</span>{" "}
                {getPartLabel(part.partId)}
              </span>
              <span
                className='text-[10px] font-semibold'
                style={{ color: PART_TIER_COLORS[part.tier] }}>
                {part.tier}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
