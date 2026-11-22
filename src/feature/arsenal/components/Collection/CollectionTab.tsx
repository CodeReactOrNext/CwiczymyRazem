import { useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useBenchReadiness } from "feature/arsenal/hooks/useBenchReadiness";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { partPieces } from "feature/arsenal/utils/boardPieces";
import type {
  CollectionScope,
  CollectionSort,
  CollectionView,
} from "feature/arsenal/utils/collectionFilter";
import { isStashOnlySort } from "feature/arsenal/utils/collectionFilter";
import { hasSavedArrangement } from "feature/arsenal/utils/stashLayout";
import { BuilderPartsShelf } from "feature/guitarBuilder/components/BuilderPartsShelf";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { EffectCollection } from "../GuitarInventory/EffectCollection";
import { GuitarInventory } from "../GuitarInventory/GuitarInventory";
import { BenchDialog } from "../Workshop/BenchDialog";
import { CollectionEmptyResult } from "./CollectionEmptyResult";
import { CollectionEmptyState } from "./CollectionEmptyState";
import { CollectionToolbar } from "./CollectionToolbar";
import { SalvageShelf } from "./SalvageShelf";
import { StashInventory } from "./StashInventory";

interface CollectionTabProps {
  data: ArsenalUserData;
}

/** Shelves whose card view is a sortable, searchable grid of gear. */
const isGearShelf = (scope: CollectionScope) =>
  scope === "guitars" || scope === "pedals";

/**
 * Everything the player owns, a shelf at a time.
 *
 * It used to be one stash board with every guitar, pedal, part and Builder
 * piece on it — hard to read, and hundreds of sockets drawn at once. Now it is
 * split the way game inventories are: guitars, pedals, parts, Builder. Each
 * shelf is a board of its own, and the card grids stay on as the second view
 * for anyone who would rather read an item than recognise it — and as the only
 * view on a phone, where a twelve-column pegboard of drag-and-drop sockets is
 * neither readable nor operable.
 */
export const CollectionTab = ({ data }: CollectionTabProps) => {
  const queryClient = useQueryClient();
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [scope, setScope] = useState<CollectionScope>("guitars");
  // A player who has arranged their stash opens in that arrangement. Their
  // positions live on their account, but only `manual` order draws them, so
  // starting everyone in `rarity` quietly threw the arrangement away on every
  // visit — it was saved and never seen.
  const [sort, setSort] = useState<CollectionSort>(() =>
    hasSavedArrangement(data.stashLayout) ? "manual" : "rarity",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<CollectionView>("stash");
  const { modTargets } = useBenchReadiness(data);

  // Opening the tab is what marks the drops as seen. It used to fire from both
  // grids, so every visit wrote the flag twice and refetched twice.
  useEffect(() => {
    const hasNew =
      data.inventory.some((item) => item.isNew) ||
      (data.effectInventory ?? []).some((item) => item.isNew);
    if (!hasNew) return;
    clearNewFlags().then(() => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    });
  }, []);

  const parts = data.parts ?? [];
  const mods = data.salvagedMods ?? [];
  const components = data.components ?? [];
  // Stacks, not loose pieces: a shelf counts what it shows.
  const partStacks = useMemo(
    () => partPieces(data.parts ?? []).length,
    [data.parts],
  );
  const counts: Record<CollectionScope, number> = {
    guitars: data.inventory.length,
    pedals: data.effectInventory?.length ?? 0,
    parts: partStacks + mods.length,
    builder: components.length,
  };
  const hasStash = Object.values(counts).some((count) => count > 0);

  // What is actually drawn. A phone never gets the board — it is too dense to
  // read at that width and its sockets are dragged, which fights the scroll — so
  // the collection falls back to the plain card list it always was there. The
  // player's own choice is kept in state and comes back on a wider screen. A
  // hand-made arrangement is the board's alone, so the cards borrow `rarity`
  // meanwhile and the toolbar never shows an order with nothing pressed.
  const activeView: CollectionView = isMobile ? "cards" : view;
  const activeSort: CollectionSort =
    activeView === "cards" && isStashOnlySort(sort) ? "rarity" : sort;
  // The card view of parts and Builder pieces is a short list with no order
  // or filter of its own, so the bar does not offer either there.
  const hasTools = activeView === "stash" || isGearShelf(scope);

  const changeScope = (next: CollectionScope) => {
    setScope(next);
    // A search typed for guitars means nothing on the parts shelf.
    setQuery("");
  };

  const toolbar = (actions?: ReactNode) => (
    <CollectionToolbar
      scope={scope}
      onScopeChange={changeScope}
      counts={counts}
      sort={activeSort}
      onSortChange={setSort}
      showSort={hasTools}
      showSearch={hasTools}
      query={query}
      onQueryChange={setQuery}
      view={activeView}
      showViewSwitch={!isMobile}
      // The board's own order is kept in state while the cards borrow
      // `rarity` (see `activeSort`), so a glance at the cards can no longer
      // re-sort the stash for good — nothing to put back on the way out.
      onViewChange={setView}
      actions={actions}
    />
  );

  if (!hasStash) return <CollectionEmptyState />;

  // The bench, opened from any card or socket below — one dialog for both views.
  const bench = <BenchDialog data={data} />;

  if (activeView === "stash")
    return (
      <>
        <StashInventory
          data={data}
          query={query}
          sort={activeSort}
          scope={scope}
          onManualArrange={() => setSort("manual")}
          renderToolbar={toolbar}
        />
        {bench}
      </>
    );

  const isEmpty = counts[scope] === 0;

  return (
    <div className='flex flex-col gap-6'>
      {toolbar()}

      {isEmpty && <CollectionEmptyResult query='' />}

      {!isEmpty && scope === "guitars" && (
        <GuitarInventory data={data} query={query} sort={activeSort} />
      )}

      {!isEmpty && scope === "pedals" && (
        <EffectCollection data={data} query={query} sort={activeSort} />
      )}

      {/* The board hangs parts and rescued mods in sockets of their own; the
          card view has none, so they get a list — without it a phone could
          neither see nor sell either of them. */}
      {!isEmpty && scope === "parts" && (
        <SalvageShelf parts={parts} mods={mods} modTargets={modTargets} />
      )}

      {!isEmpty && scope === "builder" && (
        <BuilderPartsShelf components={components} />
      )}

      {bench}
    </div>
  );
};
