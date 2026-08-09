import type {
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
  ScrapPart,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";

import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { ConditionDelta, LevelDelta, RarityDelta } from "./BeforeAfter";
import { PartsBill } from "./PartsBill";
import { Pop, Reveal } from "./workshopMotion";

export interface WorkshopResult {
  kind: WorkshopKind;
  rarity: GuitarRarity;
  /** Set only when the job promoted the item a tier. */
  rarityBefore?: GuitarRarity;
  rarityAfter?: GuitarRarity;
  levelBefore: number;
  levelAfter: number;
  conditionBefore: number;
  conditionAfter: number;
  spent: ScrapPart[];
  /** The finished item, straight from the API — this is what the card renders. */
  item: InventoryItem | EffectInventoryItem;
  /**
   * What a rolled job actually produced, e.g. `Hand-wound pickups +4 → +6`. The
   * level delta alone cannot say which mod moved, so a mod job names it here.
   */
  headline?: string;
}

interface WorkshopResultViewProps {
  result: WorkshopResult;
}

/**
 * The payoff: the finished item as a full card, exactly as it now looks in the
 * collection, next to a plain account of what changed and what it cost.
 *
 * Showing the real card rather than a summary line is the point — the work the
 * player just paid for should be something they can look at.
 */
export const WorkshopResultView = ({ result }: WorkshopResultViewProps) => (
  <div className='grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,250px)_minmax(0,1fr)]'>
    <Pop trigger={result.levelAfter} className='mx-auto w-full max-w-[250px]'>
      {result.kind === "guitar" ? (
        <GuitarCard item={result.item as InventoryItem} readOnly />
      ) : (
        <EffectCard item={result.item as EffectInventoryItem} readOnly />
      )}
    </Pop>

    <div className='flex flex-col gap-5'>
      {result.headline && (
        <div className='flex flex-col gap-2 rounded-lg bg-zinc-800/40 p-4'>
          <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
            Done
          </span>
          <span className='text-lg font-black text-purple-300'>
            {result.headline}
          </span>
        </div>
      )}

      {result.rarityBefore && result.rarityAfter && (
        <Reveal className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-5'>
          <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
            Promoted
          </span>
          <RarityDelta from={result.rarityBefore} to={result.rarityAfter} />
        </Reveal>
      )}

      <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-4'>
        <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
          Level
        </span>
        <LevelDelta
          from={result.levelBefore}
          to={result.levelAfter}
          rarity={result.rarity}
        />
      </div>

      {result.conditionAfter !== result.conditionBefore && (
        <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-4'>
          <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
            Condition
          </span>
          <ConditionDelta
            from={result.conditionBefore}
            to={result.conditionAfter}
          />
        </div>
      )}

      <PartsBill parts={result.spent} title='Parts used' />
    </div>
  </div>
);
