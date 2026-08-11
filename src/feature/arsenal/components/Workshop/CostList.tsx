import { cn } from "assets/lib/utils";
import type { RecipeLine } from "feature/arsenal/data/workshop";

import { PartRow } from "../Parts/PartRow";
import { FameCoin } from "./FameCoin";
import { SectionLabel } from "./SectionLabel";

interface CostListProps {
  recipe: RecipeLine[];
  /** Fame sits in the same list as the parts, because it is the same thing: a cost. */
  fame?: { need: number; have: number };
}

/**
 * Everything the job takes, in one dark panel.
 *
 * Pairing it with a tinted "You get" panel is what makes the dialog readable at a
 * glance: colour means gain, dark means spend, and nothing has to be read to work
 * out which half of the trade you are looking at.
 */
export const CostList = ({ recipe, fame }: CostListProps) => {
  const short =
    recipe.filter((line) => !line.ok).length +
    (fame && fame.have < fame.need ? 1 : 0);

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-950/50 p-6'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <SectionLabel>You pay</SectionLabel>
        <span
          className={cn(
            "text-sm font-bold",
            short === 0 ? "text-emerald-400" : "text-amber-400",
          )}>
          {short === 0 ? "you have it all" : `${short} still short`}
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        {fame && (
          <PartRow
            icon={<FameCoin size={30} />}
            label='Fame'
            need={fame.need}
            have={fame.have}
            index={0}
          />
        )}
        {recipe.map((line, i) => (
          <PartRow
            key={`${line.partId}:${line.tier}`}
            partId={line.partId}
            tier={line.tier}
            need={line.need}
            have={line.have}
            index={fame ? i + 1 : i}
          />
        ))}
      </div>
    </div>
  );
};
