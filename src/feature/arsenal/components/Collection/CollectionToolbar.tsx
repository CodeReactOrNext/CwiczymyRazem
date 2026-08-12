import { Input } from "assets/components/ui/input";
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

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-center'>
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

      <div className='relative min-w-0 flex-1 sm:min-w-[11rem]'>
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

      {/* Six orders is more than one row can hold on a narrow screen, so the
          chips wrap rather than shrinking into unreadable stubs — and the group
          says what it is, since "Equipped" next to the scope chips could as
          easily be read as another filter. */}
      <div className='flex flex-wrap items-center gap-1 rounded-lg bg-zinc-950/50 p-1'>
        <ArrowUpDown
          size={13}
          aria-hidden
          className='mx-1.5 shrink-0 text-zinc-500'
        />
        {SORTS.filter((s) => view === "stash" || !isStashOnlySort(s.id)).map(
          (s) => (
            <button
              key={s.id}
              onClick={() => onSortChange(s.id)}
              aria-pressed={sort === s.id}
              title={s.hint}
              className={cn(
                segmentClass(sort === s.id),
                "flex-1 sm:flex-none",
              )}>
              {s.label}
            </button>
          ),
        )}
      </div>

      {showViewSwitch && (
        <div className='flex gap-1 rounded-lg bg-zinc-950/50 p-1'>
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
