import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
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
import {
  buildDiscoveredSet,
  buildOwnershipMap,
  getDexProgress,
} from "feature/arsenal/utils/dex";
import type {
  DexRarityFilter,
  DexStatusFilter,
  DexWallEntry,
} from "feature/arsenal/utils/dexWall";
import {
  DEX_RARITY_CHIPS,
  filterDexEntries,
  paginateDexEntries,
} from "feature/arsenal/utils/dexWall";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import {
  ChevronLeft,
  ChevronRight,
  Guitar,
  Layers,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "../RarityBadge";
import { DexCard } from "./DexCard";

type DexEntry = DexWallEntry & {
  imageSrc: string;
  imageRotated?: boolean;
  preview?: ReactNode;
};

type DexKind = DexWallEntry["kind"];

interface DexViewProps {
  data: ArsenalUserData;
}

/** One pill of a segmented control — the toolbar is made of nothing else. */
const Segment = ({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      active
        ? "bg-zinc-100/10 text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-100/5 hover:text-zinc-200",
      className,
    )}>
    {children}
  </button>
);

const SegmentGroup = ({ children }: { children: ReactNode }) => (
  <div className='no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-arsenal-section p-1'>
    {children}
  </div>
);

export const DexView = ({ data }: DexViewProps) => {
  const [kind, setKind] = useState<DexKind>("guitar");
  const [rarity, setRarity] = useState<DexRarityFilter>("all");
  const [status, setStatus] = useState<DexStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // Every toolbar change lands the player back on the first wall: a page index
  // carried over from a longer list would point past the end of a shorter one.
  const changeKind = (next: DexKind) => {
    setKind(next);
    setPage(0);
  };
  const changeRarity = (next: DexRarityFilter) => {
    setRarity(next);
    setPage(0);
  };
  const changeStatus = (next: DexStatusFilter) => {
    setStatus(next);
    setPage(0);
  };
  const changeQuery = (next: string) => {
    setQuery(next);
    setPage(0);
  };

  const guitarOwnership = useMemo(
    () =>
      buildOwnershipMap(
        data.inventory,
        (item) => item.guitarId,
        (item) => {
          const def = GUITARS_BY_ID.get(item.guitarId);
          return def ? getItemLevel(item, def) : 0;
        },
      ),
    [data.inventory],
  );

  const effectOwnership = useMemo(
    () =>
      buildOwnershipMap(
        data.effectInventory || [],
        (item) => item.effectId,
        (item) => {
          const def = EFFECTS_BY_ID.get(item.effectId);
          return def ? getEffectLevel(item, def) : 0;
        },
      ),
    [data.effectInventory],
  );

  // Discovery outlives ownership: the account's record plus whatever is in the
  // stash right now. Sell a guitar and its entry stays revealed, only faded.
  const discoveredGuitars = useMemo(
    () =>
      buildDiscoveredSet(data.dexGuitars, data.inventory, (i) => i.guitarId),
    [data.dexGuitars, data.inventory],
  );
  const discoveredEffects = useMemo(
    () =>
      buildDiscoveredSet(
        data.dexEffects,
        data.effectInventory,
        (i) => i.effectId,
      ),
    [data.dexEffects, data.effectInventory],
  );

  const guitarEntries = useMemo<DexEntry[]>(
    () =>
      GUITAR_DEFINITIONS.map((def, index) => {
        const ownership = guitarOwnership.get(def.id);
        return {
          key: `guitar-${def.id}`,
          kind: "guitar",
          id: def.id,
          number: index + 1,
          name: def.name,
          brand: def.brand,
          rarity: def.rarity,
          imageSrc: getRankBadgeSrc(def.imageId, "medium"),
          imageRotated: true,
          discovered: discoveredGuitars.has(def.id),
          ownedCount: ownership?.count ?? 0,
          preview: ownership ? (
            <GuitarCard item={ownership.best} readOnly />
          ) : undefined,
        };
      }),
    [discoveredGuitars, guitarOwnership],
  );

  const effectEntries = useMemo<DexEntry[]>(
    () =>
      EFFECT_DEFINITIONS.map((def, index) => {
        const ownership = effectOwnership.get(def.id);
        return {
          key: `effect-${def.id}`,
          kind: "effect",
          id: def.id,
          number: index + 1,
          name: def.name,
          brand: def.brand,
          rarity: def.rarity,
          imageSrc: getEffectImageSrc(def.imageId, "medium"),
          discovered: discoveredEffects.has(def.id),
          ownedCount: ownership?.count ?? 0,
          preview: ownership ? (
            <EffectCard item={ownership.best} readOnly />
          ) : undefined,
        };
      }),
    [discoveredEffects, effectOwnership],
  );

  const guitarProgress = useMemo(
    () => getDexProgress(GUITAR_DEFINITIONS, discoveredGuitars),
    [discoveredGuitars],
  );
  const effectProgress = useMemo(
    () => getDexProgress(EFFECT_DEFINITIONS, discoveredEffects),
    [discoveredEffects],
  );

  const totalOwned = guitarProgress.owned + effectProgress.owned;
  const totalAll = guitarProgress.total + effectProgress.total;
  const totalPct =
    totalAll === 0 ? 0 : Math.round((totalOwned / totalAll) * 100);

  const wall = useMemo(() => {
    const source = kind === "guitar" ? guitarEntries : effectEntries;
    return paginateDexEntries(
      filterDexEntries(source, { rarity, status, query }),
      page,
    );
  }, [kind, guitarEntries, effectEntries, rarity, status, query, page]);

  const kindLabel = kind === "guitar" ? "Guitars" : "Pedals";

  return (
    <div className='flex flex-col gap-5'>
      {/* Header: title and the one number that matters, with its bar. */}
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <span className='h-6 w-0.5 rounded-full bg-cyan-400' aria-hidden />
          <h2 className='font-display text-2xl font-black text-zinc-100'>
            Discoveries
          </h2>
        </div>
        <div className='min-w-[14rem] flex-1 sm:max-w-xs'>
          <p className='text-right text-sm text-zinc-400'>
            <span className='font-bold tabular-nums text-zinc-100'>
              {totalOwned}
            </span>{" "}
            / {totalAll} discovered ·{" "}
            <span className='font-semibold tabular-nums text-zinc-200'>
              {totalPct}%
            </span>
          </p>
          <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
            <div
              className='h-full rounded-full bg-cyan-400 transition-all'
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar: which wall, which rarity, seen or not, and search. */}
      <div className='flex flex-wrap items-center gap-3'>
        <SegmentGroup>
          <Segment
            active={kind === "guitar"}
            onClick={() => changeKind("guitar")}
            className={cn(kind === "guitar" && "text-cyan-300")}>
            <Guitar size={14} />
            Guitars
            <span className='text-zinc-500'>
              {guitarProgress.owned} / {guitarProgress.total}
            </span>
          </Segment>
          <Segment
            active={kind === "effect"}
            onClick={() => changeKind("effect")}
            className={cn(kind === "effect" && "text-cyan-300")}>
            <Layers size={14} />
            Pedals
            <span className='text-zinc-500'>
              {effectProgress.owned} / {effectProgress.total}
            </span>
          </Segment>
        </SegmentGroup>

        <SegmentGroup>
          <Segment
            active={rarity === "all"}
            onClick={() => changeRarity("all")}>
            All
          </Segment>
          {DEX_RARITY_CHIPS.map((r) => (
            <Segment
              key={r}
              active={rarity === r}
              onClick={() => changeRarity(r)}>
              <span
                className='h-1.5 w-1.5 rounded-full'
                style={{ backgroundColor: RARITY_STYLES[r].baseColor }}
              />
              {r}
            </Segment>
          ))}
        </SegmentGroup>

        <SegmentGroup>
          <Segment
            active={status === "all"}
            onClick={() => changeStatus("all")}>
            All
          </Segment>
          <Segment
            active={status === "discovered"}
            onClick={() => changeStatus("discovered")}
            className={cn(status === "discovered" && "text-cyan-300")}>
            Discovered
          </Segment>
          <Segment
            active={status === "missing"}
            onClick={() => changeStatus("missing")}>
            Missing
          </Segment>
        </SegmentGroup>

        <div className='w-full sm:ml-auto sm:w-56'>
          <Input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder='Search...'
            aria-label='Search discoveries'
            startIcon={<Search size={14} className='ml-1 text-zinc-500' />}
            className='h-9 border-0 bg-arsenal-section text-sm text-zinc-100 placeholder:text-zinc-500'
          />
        </div>
      </div>

      {/* The wall itself: one darker surface, the slots hung on it. */}
      <div className='rounded-lg bg-arsenal-bg p-3 sm:p-4'>
        {wall.items.length === 0 ? (
          <p className='py-16 text-center text-sm text-zinc-500'>
            Nothing on this wall matches. Clear a filter or two.
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'>
            {wall.items.map(({ key, kind: _kind, id: _id, ...entry }) => (
              <DexCard key={key} {...entry} />
            ))}
          </div>
        )}

        <div className='mt-5 flex flex-col items-center gap-2'>
          <div className='flex items-center gap-6'>
            <button
              type='button'
              onClick={() => setPage(wall.page - 1)}
              disabled={wall.page === 0}
              aria-label='Previous wall'
              className='rounded-md p-1.5 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-zinc-700 hover:bg-zinc-100/10 hover:text-zinc-100 disabled:hover:bg-transparent'>
              <ChevronLeft size={18} />
            </button>
            <p className='text-sm text-zinc-300'>
              {kindLabel} ·{" "}
              <span className='font-semibold tabular-nums text-zinc-100'>
                {wall.page + 1} / {wall.pageCount}
              </span>
            </p>
            <button
              type='button'
              onClick={() => setPage(wall.page + 1)}
              disabled={wall.page >= wall.pageCount - 1}
              aria-label='Next wall'
              className='rounded-md p-1.5 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-zinc-700 hover:bg-zinc-100/10 hover:text-zinc-100 disabled:hover:bg-transparent'>
              <ChevronRight size={18} />
            </button>
          </div>
          {wall.pageCount > 1 && wall.pageCount <= 12 && (
            <div className='flex items-center gap-1.5'>
              {Array.from({ length: wall.pageCount }, (_, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setPage(i)}
                  aria-label={`Wall ${i + 1}`}
                  aria-current={i === wall.page ? "page" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === wall.page
                      ? "w-4 bg-cyan-400"
                      : "w-1.5 bg-zinc-700 hover:bg-zinc-500",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
