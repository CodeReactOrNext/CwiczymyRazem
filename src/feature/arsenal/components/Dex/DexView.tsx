import {
  EFFECT_DEFINITIONS,
  EFFECTS_BY_ID,
} from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import {
  GUITAR_DEFINITIONS,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import type { DexProgress } from "feature/arsenal/utils/dex";
import { buildOwnershipMap, getDexProgress } from "feature/arsenal/utils/dex";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Guitar, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { RARITY_ORDER, RaritySectionHeader } from "../RarityProgress";
import type { DexCardProps } from "./DexCard";
import { DexCard } from "./DexCard";

type DexEntry = DexCardProps & { key: string };

interface DexViewProps {
  data: ArsenalUserData;
}

const padDexNumber = (id: number | string) => String(id).padStart(3, "0");

const SummaryBar = ({
  icon,
  label,
  progress,
}: {
  icon: ReactNode;
  label: string;
  progress: DexProgress;
}) => {
  const pct =
    progress.total === 0 ? 0 : Math.round((progress.owned / progress.total) * 100);
  return (
    <div className='flex items-center gap-3'>
      {icon}
      <span className='w-14 text-sm font-bold text-zinc-200'>{label}</span>
      <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full bg-cyan-400 transition-all'
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className='text-sm font-bold tabular-nums text-zinc-100'>
        {progress.owned}
        <span className='text-zinc-500'>/{progress.total}</span>
      </span>
    </div>
  );
};

/** Fixed-slot grid per rarity — every definition renders, discovered or not. */
const DexRarityGroups = ({ entries }: { entries: DexEntry[] }) => (
  <div className='flex flex-col gap-8'>
    {RARITY_ORDER.map((rarity) => {
      const group = entries.filter((e) => e.rarity === rarity);
      if (group.length === 0) return null;
      const owned = group.filter((e) => e.ownedCount > 0).length;
      return (
        <div key={rarity}>
          <RaritySectionHeader rarity={rarity} owned={owned} total={group.length} />
          <div className='grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {group.map(({ key, ...entry }) => (
              <DexCard key={key} {...entry} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export const DexView = ({ data }: DexViewProps) => {
  const guitarOwnership = useMemo(
    () =>
      buildOwnershipMap(
        data.inventory,
        (item) => item.guitarId,
        (item) => {
          const def = GUITARS_BY_ID.get(item.guitarId);
          return def ? getItemLevel(item, def) : 0;
        }
      ),
    [data.inventory]
  );

  const effectOwnership = useMemo(
    () =>
      buildOwnershipMap(
        data.effectInventory || [],
        (item) => item.effectId,
        (item) => {
          const def = EFFECTS_BY_ID.get(item.effectId);
          return def ? getEffectLevel(item, def) : 0;
        }
      ),
    [data.effectInventory]
  );

  const guitarEntries = useMemo<DexEntry[]>(
    () =>
      GUITAR_DEFINITIONS.map((def) => {
        const ownership = guitarOwnership.get(def.id);
        return {
          key: `guitar-${def.id}`,
          dexNumber: padDexNumber(def.id),
          name: def.name,
          brand: def.brand,
          rarity: def.rarity,
          imageSrc: getRankBadgeSrc(def.imageId, "small"),
          imageRotated: true,
          ownedCount: ownership?.count ?? 0,
          preview: ownership ? <GuitarCard item={ownership.best} readOnly /> : undefined,
        };
      }),
    [guitarOwnership]
  );

  const effectEntries = useMemo<DexEntry[]>(
    () =>
      EFFECT_DEFINITIONS.map((def) => {
        const ownership = effectOwnership.get(def.id);
        return {
          key: `effect-${def.id}`,
          dexNumber: padDexNumber(def.id),
          name: def.name,
          brand: def.brand,
          rarity: def.rarity,
          imageSrc: `/static/images/effects/${def.imageId}.png`,
          ownedCount: ownership?.count ?? 0,
          preview: ownership ? <EffectCard item={ownership.best} readOnly /> : undefined,
        };
      }),
    [effectOwnership]
  );

  const guitarProgress = useMemo(
    () => getDexProgress(GUITAR_DEFINITIONS, guitarOwnership),
    [guitarOwnership]
  );
  const effectProgress = useMemo(
    () => getDexProgress(EFFECT_DEFINITIONS, effectOwnership),
    [effectOwnership]
  );

  const totalOwned = guitarProgress.owned + effectProgress.owned;
  const totalAll = guitarProgress.total + effectProgress.total;
  const totalPct = totalAll === 0 ? 0 : Math.round((totalOwned / totalAll) * 100);

  return (
    <div className='flex flex-col gap-10'>
      {/* Discovery summary */}
      <div className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='font-display text-xl font-black text-zinc-100'>
              Collection Dex
            </h2>
            <p className='mt-1 text-sm text-zinc-400'>
              Every guitar and pedal in the game. Open cases to reveal the ones
              still in the dark.
            </p>
          </div>
          <div className='flex items-baseline gap-2'>
            <span className='font-display text-4xl font-black text-cyan-400'>
              {totalPct}%
            </span>
            <span className='text-xs leading-tight text-zinc-400'>discovered</span>
          </div>
        </div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>
          <SummaryBar
            icon={<Guitar size={16} className='text-zinc-400' />}
            label='Guitars'
            progress={guitarProgress}
          />
          <SummaryBar
            icon={<Layers size={16} className='text-zinc-400' />}
            label='Pedals'
            progress={effectProgress}
          />
        </div>
      </div>

      <section>
        <div className='mb-5 flex items-center gap-2'>
          <Guitar size={18} className='text-zinc-400' />
          <h3 className='font-display text-lg font-black text-zinc-100'>Guitars</h3>
        </div>
        <DexRarityGroups entries={guitarEntries} />
      </section>

      <section>
        <div className='mb-5 flex items-center gap-2'>
          <Layers size={18} className='text-zinc-400' />
          <h3 className='font-display text-lg font-black text-zinc-100'>Pedals</h3>
        </div>
        <DexRarityGroups entries={effectEntries} />
      </section>
    </div>
  );
};
