import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import type {
  CollectionScope,
  CollectionSort,
} from "feature/arsenal/utils/collectionFilter";
import { Search } from "lucide-react";

interface CollectionToolbarProps {
  scope: CollectionScope;
  onScopeChange: (scope: CollectionScope) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  query: string;
  onQueryChange: (query: string) => void;
  guitarCount: number;
  pedalCount: number;
}

const SCOPES: { id: CollectionScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "guitars", label: "Guitars" },
  { id: "pedals", label: "Pedals" },
];

const SORTS: { id: CollectionSort; label: string }[] = [
  { id: "rarity", label: "Rarity" },
  { id: "level", label: "Level" },
  { id: "newest", label: "Newest" },
];

/** Same chip language as the workshop rack, so the two lists are operated alike. */
const segmentClass = (isActive: boolean) =>
  cn(
    "flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
    isActive
      ? "bg-zinc-100 text-zinc-900"
      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
  );

/**
 * One bar for the whole collection: what to show, how to order it, what to find.
 *
 * Guitars and pedals used to be two independent walls of cards with no way to
 * narrow either of them down — the only ordering was hard-coded, and the only way
 * to reach a specific item was to scroll. The rack in the workshop already solved
 * this for the same items, so the collection now speaks the same language.
 */
export const CollectionToolbar = ({
  scope,
  onScopeChange,
  sort,
  onSortChange,
  query,
  onQueryChange,
  guitarCount,
  pedalCount,
}: CollectionToolbarProps) => {
  const counts: Record<CollectionScope, number> = {
    all: guitarCount + pedalCount,
    guitars: guitarCount,
    pedals: pedalCount,
  };

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-3 sm:flex-row sm:items-center'>
      <div className='flex gap-1 rounded-lg bg-zinc-950/50 p-1'>
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => onScopeChange(s.id)}
            aria-pressed={scope === s.id}
            className={cn(segmentClass(scope === s.id), "flex-1 sm:flex-none")}>
            {s.label}
            <span className='tabular-nums opacity-60'>{counts[s.id]}</span>
          </button>
        ))}
      </div>

      <div className='relative min-w-0 flex-1'>
        <Search
          size={14}
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'
        />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder='Search your collection'
          aria-label='Search your collection'
          className='h-9 border-0 bg-zinc-950/50 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500'
        />
      </div>

      <div className='flex gap-1 rounded-lg bg-zinc-950/50 p-1'>
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSortChange(s.id)}
            aria-pressed={sort === s.id}
            className={cn(segmentClass(sort === s.id), "flex-1 sm:flex-none")}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};
