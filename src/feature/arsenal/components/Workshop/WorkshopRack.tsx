import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ConditionMeter } from "../ConditionMeter";
import { InServiceTags } from "../InServiceTags";
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
        !bare && "rounded-lg bg-arsenal-section p-5",
      )}>
      <SectionLabel>Your gear</SectionLabel>

      <div className='flex gap-1 rounded-lg bg-arsenal-bg p-1'>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
              filter === f.id
                ? "bg-arsenal-accent/15 text-arsenal-accent"
                : "text-arsenal-text-tertiary hover:bg-white/[0.06] hover:text-arsenal-text-primary",
            )}>
            {f.label}
            <span className='tabular-nums opacity-60'>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className='relative'>
        <Search
          size={14}
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-arsenal-text-tertiary'
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search the rack'
          className='h-9 border-0 bg-arsenal-bg pl-9 text-sm text-arsenal-text-primary placeholder:text-arsenal-text-tertiary'
        />
      </div>

      <div
        className={cn(
          "no-scrollbar flex flex-col gap-2 py-1",
          !bare && "max-h-[600px] overflow-y-auto",
        )}>
        {visible.length === 0 ? (
          <p className='py-10 text-center text-xs text-arsenal-text-tertiary'>
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
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
                  isSelected
                    ? "border-arsenal-accent/40 bg-arsenal-card"
                    : "border-transparent bg-arsenal-card/60 hover:border-arsenal-border hover:bg-arsenal-card",
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
                  <span className='truncate text-sm font-semibold leading-tight text-arsenal-text-primary'>
                    {entry.name}
                  </span>
                  {/* Sits above the condition meter rather than off to the side:
                      the rack is scanned down the names, and this is part of
                      what the name means here. */}
                  <InServiceTags uses={entry.uses} />
                  <ConditionMeter
                    condition={entry.condition}
                    showLabel={false}
                  />
                </span>

                <span className='flex shrink-0 flex-col items-end gap-1'>
                  <span className='text-sm font-semibold tabular-nums leading-none text-arsenal-text-primary'>
                    {entry.level}
                  </span>
                  {entry.buildLevel > 0 && (
                    <span className='rounded bg-arsenal-accent/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-arsenal-accent'>
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
