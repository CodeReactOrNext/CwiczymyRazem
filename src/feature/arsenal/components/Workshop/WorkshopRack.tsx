import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ConditionMeter } from "../ConditionMeter";
import { SectionLabel } from "../SectionLabel";

type RackFilter = "all" | "guitar" | "effect";

interface WorkshopRackProps {
  entries: WorkshopEntry[];
  selectedId: string | null;
  onSelect: (entry: WorkshopEntry) => void;
  /**
   * Drops the panel's own surface and its inner scroll — for the mobile sheet,
   * where the sheet is already the surface and already scrolls.
   */
  bare?: boolean;
}

const FILTERS: { id: RackFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "guitar", label: "Guitars" },
  { id: "effect", label: "Pedals" },
];

/** The rack on the wall: pick what goes on the bench. */
export const WorkshopRack = ({
  entries,
  selectedId,
  onSelect,
  bare = false,
}: WorkshopRackProps) => {
  const [filter, setFilter] = useState<RackFilter>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== "all" && entry.kind !== filter) return false;
      if (!needle) return true;
      return `${entry.brand} ${entry.name}`.toLowerCase().includes(needle);
    });
  }, [entries, filter, search]);

  const counts = useMemo(
    () => ({
      all: entries.length,
      guitar: entries.filter((e) => e.kind === "guitar").length,
      effect: entries.filter((e) => e.kind === "effect").length,
    }),
    [entries],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        !bare && "rounded-lg bg-zinc-900/40 p-5",
      )}>
      <SectionLabel>Your gear</SectionLabel>

      <div className='flex gap-1 rounded-lg bg-zinc-950/50 p-1'>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
              filter === f.id
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}>
            {f.label}
            <span className='tabular-nums opacity-60'>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className='relative'>
        <Search
          size={14}
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search the rack'
          className='h-9 border-0 bg-zinc-950/50 pl-9 text-sm text-zinc-200 placeholder:text-zinc-600'
        />
      </div>

      <div
        className={cn(
          "no-scrollbar flex flex-col gap-2 py-1",
          !bare && "max-h-[600px] overflow-y-auto",
        )}>
        {visible.length === 0 ? (
          <p className='py-10 text-center text-xs text-zinc-500'>
            Nothing matches that.
          </p>
        ) : (
          visible.map((entry) => {
            const rs = RARITY_STYLES[entry.rarity];
            const isSelected = entry.id === selectedId;

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
                  isSelected
                    ? "bg-zinc-800/70 ring-1 ring-cyan-500/40"
                    : "bg-zinc-800/30 hover:bg-zinc-800/60",
                )}>
                {/* Rarity as a single mark rather than a wash across the whole row —
                    the wash sat under the name and made both hard to read. */}
                <span
                  className='h-8 w-1 shrink-0 rounded-full'
                  style={{ backgroundColor: rs.baseColor }}
                  aria-hidden
                />

                <span className='flex h-11 w-11 shrink-0 items-center justify-center'>
                  <img
                    src={entry.imageSrc}
                    alt=''
                    aria-hidden
                    loading='lazy'
                    className={cn(
                      "h-11 w-11 object-contain",
                      entry.rotate && "-rotate-90 scale-[1.6]",
                    )}
                  />
                </span>

                <span className='flex min-w-0 flex-1 flex-col gap-2'>
                  <span className='truncate text-sm font-bold leading-tight text-zinc-100'>
                    {entry.name}
                  </span>
                  <ConditionMeter
                    condition={entry.condition}
                    showLabel={false}
                  />
                </span>

                <span className='flex shrink-0 flex-col items-end gap-1'>
                  <span className='text-sm font-black tabular-nums leading-none text-white'>
                    {entry.level}
                  </span>
                  {entry.buildLevel > 0 && (
                    <span className='rounded bg-cyan-950/50 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-cyan-400'>
                      +{entry.buildLevel}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
