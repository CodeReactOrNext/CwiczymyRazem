import { cn } from "assets/lib/utils";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";

import { SLOT_LABELS } from "../data/components";
import type { OwnedComponent } from "../types/guitarBuilder.types";
import { getComponent } from "../utils/components";
import { ComponentThumb } from "./ComponentThumb";
import { PartPlate } from "./PartPlate";

/** The hover card of a Builder part in the stash: art, slot, rarity, level. */
export const ComponentPreviewCard = ({
  component,
  className,
}: {
  component: OwnedComponent;
  className?: string;
}) => {
  const def = getComponent(component.defId);
  if (!def) return null;
  return (
    <div
      className={cn(
        "flex w-60 flex-col items-center gap-3 rounded-lg bg-zinc-900 px-5 py-6",
        className,
      )}>
      <PartPlate className='h-28 w-full'>
        <ComponentThumb def={def} className='h-full p-3' />
      </PartPlate>
      <div className='text-center'>
        <p className='font-display text-base font-semibold text-zinc-50'>
          {def.name}
        </p>
        <p className='mt-1 text-xs text-zinc-400'>
          {SLOT_LABELS[def.slot]} ·{" "}
          <span style={{ color: getRarityColor(def.rarity) }}>
            {def.rarity}
          </span>{" "}
          · Lvl {component.level}
        </p>
      </div>
    </div>
  );
};
