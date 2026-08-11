import { cn } from "assets/lib/utils";
import type { FittedMod } from "feature/arsenal/data/workshop";
import { Dices } from "lucide-react";

import { SectionLabel } from "../SectionLabel";

interface FittedModsProps {
  mods: FittedMod[];
  /** Opens the mod bench — the one place a value is actually re-rolled. */
  onReroll: () => void;
}

/**
 * The mods the instrument really carries, with what each one is worth.
 *
 * This slot used to show the build log under the heading "Mods fitted", which
 * named features the item did not have and could not gain from a build. The mods
 * are the reason the player comes to the bench, so they get the space, and the
 * chronicle moved to `BuildLog` under its own honest name.
 */
export const FittedMods = ({ mods, onReroll }: FittedModsProps) => {
  if (mods.length === 0) return null;

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6'>
      <SectionLabel>Mods</SectionLabel>

      <div className='flex flex-col gap-2'>
        {mods.map((mod) => (
          <div
            key={mod.id}
            className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-zinc-800/40 px-4 py-3'>
            <span className='text-xl font-black tabular-nums text-purple-300'>
              +{mod.points}
            </span>
            <span className='min-w-0 flex-1 truncate text-sm font-bold text-zinc-100'>
              {mod.label}
            </span>
            <button
              onClick={onReroll}
              disabled={!mod.affordable}
              title={
                mod.affordable
                  ? "Pays this mod's bill again and always replaces the current roll"
                  : "Not enough parts for another roll of this mod"
              }
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors click-behavior",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400",
                "disabled:pointer-events-none disabled:opacity-40",
                "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white",
              )}>
              <Dices size={14} />
              Re-roll
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
