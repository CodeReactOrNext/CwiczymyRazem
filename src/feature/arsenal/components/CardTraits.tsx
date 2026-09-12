import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { TraitCardState } from "feature/arsenal/data/traitEval";
import {
  buildRigTraitContext,
  getTraitCardState,
  getTraitUnits,
} from "feature/arsenal/data/traitEval";
import type { ResolvedTrait } from "feature/arsenal/data/traits";
import { formatTraitValue } from "feature/arsenal/data/traits";
import { useMemo } from "react";

import { ARSENAL_QUERY_KEY } from "../hooks/useArsenalData";
import { fetchInventory } from "../services/arsenal.service";

/**
 * Trait states for an item, but only when it is in the viewer's own rig.
 *
 * Reads the arsenal from the React Query cache and never fetches it — `enabled:
 * false` is the whole point. These cards also render in the market, the activity
 * feed and reveal modals, where the item belongs to somebody else and firing an
 * inventory request per card would be both wasteful and wrong. No cache, no
 * states, and the card falls back to the neutral rendering, which is exactly
 * what a preview of someone else's guitar should show.
 */
export interface TraitCardInfo {
  state: TraitCardState;
  /**
   * Units a counter trait is multiplied by right now, or null when it has no
   * counter. `Boutique Row` at `×0` is the difference between what the card
   * advertises and what the rig actually pays.
   */
  units: number | null;
}

export const useItemTraitStates = (
  itemId: string,
  traits: ResolvedTrait[],
): TraitCardInfo[] | null => {
  const { data } = useQuery({
    queryKey: ARSENAL_QUERY_KEY,
    queryFn: fetchInventory,
    enabled: false,
  });

  return useMemo(() => {
    if (!data || traits.length === 0) return null;
    const rig = buildRigTraitContext(data);
    const self = [...rig.guitars, ...rig.pedals].find(
      (i) => i.itemId === itemId,
    );
    // Owned but sitting in the stash: nothing is being satisfied or missed, so
    // it reads as a preview too.
    if (!self) return null;
    return traits.map((t) => {
      const raw = { id: t.def.id, value: t.value, params: t.params };
      return {
        state: getTraitCardState(t.def, raw, self, rig),
        units: t.def.counter ? getTraitUnits(t.def, raw, self, rig) : null,
      };
    });
  }, [data, itemId, traits]);
};

const EMERALD = "#34d399";

interface CardTraitsProps {
  traits: ResolvedTrait[];
  /**
   * Per-trait state, aligned with `traits`. Null renders every trait in the
   * plain green — see the note on `useItemTraitStates` for why previews must
   * never be coloured by somebody else's rig.
   */
  states?: TraitCardInfo[] | null;
  /**
   * Caps the rows shown, highest Fame/h first, collapsing the rest behind a
   * "+N more" that reveals them on hover — used by the marketplace grid,
   * where an eleven-trait item would otherwise push the price off-screen.
   * Omitted everywhere else: a card the player owns is for reading what it
   * carries, not a summary of it.
   */
  maxVisible?: number;
}

/**
 * The trait block under a guitar or pedal card.
 *
 * Green throughout, and separate from the mod list above it: mods are numbers
 * that have already been added to the item's level, traits are Fame/h the item
 * pays on top. Reading them in one list made every card look like it had eleven
 * mods, and hid the one line the player actually builds around.
 *
 * Three states, and only one of them is a warning. `unmet` is the state the
 * player can fix right now by moving gear, so it is the only one that loses the
 * colour. `session` means the rig is already right and the rest depends on how
 * they practise — a promise, not a failure, and it must not look like one.
 */
export const CardTraits = ({ traits, states, maxVisible }: CardTraitsProps) => {
  if (traits.length === 0) return null;

  const indexed = traits.map((trait, i) => ({ trait, i }));
  // Only reordered when capped — the "most important" two are the highest
  // Fame/h, but a card showing everything reads better in the order the
  // traits were actually rolled onto the item.
  const ordered =
    maxVisible != null
      ? [...indexed].sort((a, b) => b.trait.value - a.trait.value)
      : indexed;
  const visible = maxVisible != null ? ordered.slice(0, maxVisible) : ordered;
  const hidden = maxVisible != null ? ordered.slice(maxVisible) : [];

  return (
    <div
      className='relative z-10 flex flex-shrink-0 flex-col gap-2.5 px-3 py-3'
      style={{ background: "rgba(16,185,129,0.07)" }}>
      {visible.map(({ trait, i }) => {
        const info = states?.[i] ?? null;
        const state = info?.state ?? null;
        const unmet = state === "unmet";
        const marker = state === "met" ? "⚡" : state === "unmet" ? "○" : "◆";

        // In the player's own rig a counter's per-unit rate is not what it pays,
        // so the headline number becomes the total and the `×N` says why. With
        // no rig to measure against, the per-unit value is the honest one — it
        // is what the description promises.
        const units = info?.units ?? null;
        const shown =
          units != null && units > 0 ? trait.value * units : trait.value;

        return (
          <div key={`${trait.def.id}-${i}`} className='flex flex-col gap-0.5'>
            <div className='flex items-baseline gap-2 leading-snug'>
              <span
                className='flex-shrink-0 text-[11px]'
                style={{ color: unmet ? "#52525b" : EMERALD }}>
                {marker}
              </span>
              <span
                className={cn(
                  "truncate text-[12px] font-bold capitalize tracking-wide",
                )}
                style={{ color: unmet ? "#71717a" : EMERALD }}>
                {trait.label}
              </span>
              <span className='font-mono ml-auto flex flex-shrink-0 items-baseline gap-1.5 text-[12px] font-bold tabular-nums'>
                {units != null && (
                  <span className='text-[10px] font-semibold text-zinc-600'>
                    ×{units}
                  </span>
                )}
                <span style={{ color: unmet ? "#71717a" : "#6ee7b7" }}>
                  {formatTraitValue(shown)} Fame/h
                </span>
              </span>
            </div>
            <p
              className='pl-[19px] text-[10px] leading-snug'
              style={{ color: unmet ? "#52525b" : "#a1a1aa" }}>
              {trait.description}
            </p>
          </div>
        );
      })}
      {hidden.length > 0 && (
        <TooltipProvider>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <div className='flex cursor-help items-center gap-1.5 pl-[19px] text-[11px] font-bold text-emerald-300/60 transition-colors hover:text-emerald-300'>
                +{hidden.length} more
              </div>
            </TooltipTrigger>
            <TooltipContent
              side='top'
              className='max-w-[240px] border border-zinc-700 bg-zinc-950 text-white'>
              <div className='flex flex-col gap-1.5'>
                {hidden.map(({ trait }) => (
                  <div
                    key={trait.def.id}
                    className='flex items-baseline justify-between gap-3 text-[11px]'>
                    <span className='truncate font-semibold text-emerald-300'>
                      {trait.label}
                    </span>
                    <span className='font-mono shrink-0 text-emerald-200'>
                      {formatTraitValue(trait.value)} Fame/h
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
