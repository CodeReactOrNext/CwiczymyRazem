import { PRESSABLE } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import { SearchInput } from "components/SearchInput/SearchInput";
import {
  Segment,
  SegmentedControl,
  SegmentGroup,
} from "components/SegmentedControl/SegmentedControl";
import type {
  CollectionScope,
  CollectionSort,
  CollectionView,
} from "feature/arsenal/utils/collectionFilter";
import {
  COLLECTION_SCOPES,
  isStashOnlySort,
} from "feature/arsenal/utils/collectionFilter";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDown,
  Cog,
  Guitar,
  Layers,
  LayoutGrid,
  Rows3,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

interface CollectionToolbarProps {
  scope: CollectionScope;
  onScopeChange: (scope: CollectionScope) => void;
  /** How many pieces each shelf holds, shown after its name. */
  counts: Record<CollectionScope, number>;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  /**
   * Whether ordering means anything here. Parts and Builder pieces have no
   * level or rarity to sort by, so in the card view the dropdown would only
   * offer choices that change nothing.
   */
  showSort?: boolean;
  /** Same for search: the card view of parts and Builder pieces is a short list with no filter. */
  showSearch?: boolean;
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
  /** The shelf's own keys (tidy up, clear duplicates), at the end of the bar. */
  actions?: ReactNode;
}

const SCOPE_META: Record<CollectionScope, { label: string; Icon: LucideIcon }> =
  {
    guitars: { label: "Guitars", Icon: Guitar },
    pedals: { label: "Pedals", Icon: Layers },
    parts: { label: "Parts", Icon: Cog },
    builder: { label: "Builder", Icon: Wrench },
  };

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
];

const VIEWS: { id: CollectionView; label: string; Icon: LucideIcon }[] = [
  { id: "stash", label: "Stash", Icon: LayoutGrid },
  { id: "cards", label: "Cards", Icon: Rows3 },
];

/**
 * The collection's one bar: which shelf, then how to find and order what is
 * on it.
 *
 * Shelves are the inventory tabs of any game — guitars, pedals, parts and the
 * Builder's pieces — rather than a filter over one board that held everything
 * at once. The tools sit on a row of their own under them, with whatever the
 * shelf can do in bulk at its end, so there is no second header under the bar.
 */
export const CollectionToolbar = ({
  scope,
  onScopeChange,
  counts,
  sort,
  onSortChange,
  showSort = true,
  showSearch = true,
  query,
  onQueryChange,
  view,
  onViewChange,
  showViewSwitch = true,
  actions,
}: CollectionToolbarProps) => {
  const { t } = useTranslation("arsenal");
  const sortLabel = (id: CollectionSort, fallback: string) =>
    t(`collection.sort.${id}`, fallback);

  // Only the stash view can honour manual ordering — see `isStashOnlySort`.
  const visibleSorts = SORTS.filter(
    (s) => view === "stash" || !isStashOnlySort(s.id),
  );

  return (
    <div className='flex flex-col gap-4'>
      {/* The same switch as the Songs board (Learning / Want to learn /
          Mastered): one tray, the shelf's icon and how much it holds. */}
      <div className='flex flex-wrap items-center gap-2'>
        <SegmentedControl
          label={t("collection.shelf", "Shelf")}
          selected={[scope]}
          onSelect={onScopeChange}
          options={COLLECTION_SCOPES.map((id) => {
            const { label, Icon } = SCOPE_META[id];
            return {
              value: id,
              label: t(`collection.scope.${id}`, label),
              icon: <Icon size={15} />,
              count: counts[id],
            };
          })}
        />

        {showViewSwitch && (
          <SegmentGroup
            aria-label={t("collection.view_switch", "View")}
            className='ml-auto shrink-0'>
            {VIEWS.map(({ id, Icon }) => (
              <Segment
                key={id}
                active={view === id}
                onClick={() => onViewChange(id)}>
                <span className='sr-only'>
                  {t(`collection.view_title.${id}`)}
                </span>
                <Icon size={15} aria-hidden />
              </Segment>
            ))}
          </SegmentGroup>
        )}
      </div>

      {(showSearch || showSort || actions) && (
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          {showSearch && (
            <SearchInput
              containerClassName='min-w-0 sm:max-w-xs'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onClear={() => onQueryChange("")}
              placeholder={t("collection.search")}
              aria-label={t("collection.search")}
              className='h-9'
            />
          )}

          {showSort && (
            <Select
              value={sort}
              onValueChange={(value) => onSortChange(value as CollectionSort)}>
              <SelectTrigger
                aria-label={t("collection.sort_by")}
                className={cn(
                  PRESSABLE,
                  "h-9 w-full shrink-0 gap-2 border-0 border-b-black/30 bg-arsenal-section px-3 text-xs font-semibold text-arsenal-text-primary sm:w-[9.5rem]",
                )}>
                <span className='flex items-center gap-1.5 text-arsenal-text-tertiary'>
                  <ArrowUpDown size={13} aria-hidden />
                  {t("collection.sort_prefix")}
                </span>
                {/* Explicit children rather than the auto-detected label — Radix
                  only knows an item's label once it has mounted inside the
                  (closed by default) content portal, so the trigger would show
                  blank until the menu had been opened once. */}
                <SelectValue>
                  {sortLabel(
                    sort,
                    visibleSorts.find((s) => s.id === sort)?.label ?? "",
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {visibleSorts.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={s.id}
                    title={t(`collection.sort_hint.${s.id}`, s.hint)}>
                    {sortLabel(s.id, s.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {actions && (
            <div className='flex flex-wrap gap-2 sm:ml-auto'>{actions}</div>
          )}
        </div>
      )}
    </div>
  );
};
