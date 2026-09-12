import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import type {
  CollectionScope,
  CollectionSort,
  CollectionView,
} from "feature/arsenal/utils/collectionFilter";
import { isStashOnlySort } from "feature/arsenal/utils/collectionFilter";
import { ArrowUpDown, LayoutGrid, Rows3, Search } from "lucide-react";

interface CollectionToolbarProps {
  scope: CollectionScope;
  onScopeChange: (scope: CollectionScope) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  query: string;
  onQueryChange: (query: string) => void;
  view: CollectionView;
  onViewChange: (view: CollectionView) => void;
  /**
   * Whether the player gets to choose the view at all. On a phone they don't —
   * the stash board needs a pointer and a wide screen, so the cards are the
   * only view there and a switch with one working option is just noise.
   */
  showViewSwitch?: boolean;
  guitarCount: number;
  pedalCount: number;
}

const SCOPES: { id: CollectionScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "guitars", label: "Guitars" },
  { id: "pedals", label: "Pedals" },
];

const SORTS: {
  id: CollectionSort;
  label: string;
  /** What the order actually does — a one-word chip cannot say it on its own. */
  hint: string;
}[] = [
  // Only the stash can honour a hand-made arrangement; the card grid has no
  // place to put one. Which orders those are is `isStashOnlySort`'s to say.
  {
    id: "manual",
    label: "Manual",
    hint: "Your own arrangement — drag pieces wherever you want them",
  },
  {
    id: "equipped",
    label: "Equipped",
    hint: "What you are playing first: profile guitar, rig slots and pedalboard",
  },
  { id: "rarity", label: "Rarity", hint: "Rarest first, copies side by side" },
  { id: "level", label: "Level", hint: "Highest level first" },
  { id: "newest", label: "Newest", hint: "Most recent drops first" },
  // Same reason as Manual: only a board that hangs all four kinds in one grid
  // has anything to group.
  {
    id: "type",
    label: "Type",
    hint: "Guitars first, then pedals, then mods and parts",
  },
];

const VIEWS: { id: CollectionView; label: string; Icon: typeof LayoutGrid }[] =
  [
    { id: "stash", label: "Stash", Icon: LayoutGrid },
    { id: "cards", label: "Cards", Icon: Rows3 },
  ];

/** Same chip language as the workshop rack, so the two lists are operated alike.
    `h-full` so every chip fills the shared 36px control height set on its group. */
const segmentClass = (isActive: boolean) =>
  cn(
    "flex h-full items-center justify-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
    isActive
      ? "bg-arsenal-accent/15 text-arsenal-accent"
      : "text-arsenal-text-tertiary hover:bg-white/[0.06] hover:text-arsenal-text-primary",
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
  view,
  onViewChange,
  showViewSwitch = true,
  guitarCount,
  pedalCount,
}: CollectionToolbarProps) => {
  const counts: Record<CollectionScope, number> = {
    all: guitarCount + pedalCount,
    guitars: guitarCount,
    pedals: pedalCount,
  };

  // Only the stash view can honour manual/type ordering — see `isStashOnlySort`.
  const visibleSorts = SORTS.filter(
    (s) => view === "stash" || !isStashOnlySort(s.id),
  );

  return (
    <div className='flex flex-col gap-2.5 rounded-lg bg-arsenal-section p-3 sm:flex-row sm:items-center'>
      <div className='flex h-9 shrink-0 gap-1 rounded-lg bg-arsenal-bg p-1'>
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

      {/* The one item that absorbs the row's slack — everything else is
          content-sized, so the placeholder never gets squeezed. */}
      <div className='relative min-w-0 flex-1'>
        <Search
          size={14}
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-arsenal-text-tertiary'
        />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder='Search your collection'
          aria-label='Search your collection'
          className='h-9 border-0 bg-arsenal-bg pl-9 text-sm text-arsenal-text-primary placeholder:text-arsenal-text-tertiary'
        />
      </div>

      {/* A dropdown rather than six chips: at three controls wide it no longer
          needs its own row's worth of space, and the current order still reads
          straight off the trigger. */}
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as CollectionSort)}>
        <SelectTrigger
          aria-label='Sort by'
          className='h-9 w-full shrink-0 gap-2 border-0 bg-arsenal-bg px-3 text-xs font-semibold text-arsenal-text-primary sm:w-[9.5rem]'>
          <span className='flex items-center gap-1.5 text-arsenal-text-tertiary'>
            <ArrowUpDown size={13} aria-hidden />
            Sort:
          </span>
          {/* Explicit children rather than the auto-detected label — Radix only
              knows an item's label once it has mounted inside the (closed by
              default) content portal, so the trigger would show blank until
              the menu had been opened once. */}
          <SelectValue>
            {visibleSorts.find((s) => s.id === sort)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {visibleSorts.map((s) => (
            <SelectItem key={s.id} value={s.id} title={s.hint}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showViewSwitch && (
        <div className='flex h-9 shrink-0 gap-1 rounded-lg bg-arsenal-bg p-1'>
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              aria-pressed={view === id}
              aria-label={`${label} view`}
              title={`${label} view`}
              className={cn(segmentClass(view === id), "flex-1 sm:flex-none")}>
              <Icon size={14} />
              <span className='sm:hidden'>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
