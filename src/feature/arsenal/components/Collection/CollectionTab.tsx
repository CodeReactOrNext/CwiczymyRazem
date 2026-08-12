import { useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import type {
  CollectionScope,
  CollectionSort,
  CollectionView,
} from "feature/arsenal/utils/collectionFilter";
import {
  isScopeVisible,
  isStashOnlySort,
} from "feature/arsenal/utils/collectionFilter";
import { hasSavedArrangement } from "feature/arsenal/utils/stashLayout";
import { useEffect, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { EffectCollection } from "../GuitarInventory/EffectCollection";
import { GuitarInventory } from "../GuitarInventory/GuitarInventory";
import { CollectionEmptyResult } from "./CollectionEmptyResult";
import { CollectionEmptyState } from "./CollectionEmptyState";
import { CollectionToolbar } from "./CollectionToolbar";
import { SalvageShelf } from "./SalvageShelf";
import { StashInventory } from "./StashInventory";

interface CollectionTabProps {
  data: ArsenalUserData;
}

/**
 * Everything the player owns, under one set of controls.
 *
 * The tab used to be three stacked blocks that knew nothing about each other:
 * the parts wallet, then guitars, then pedals — each an endless grid of cards.
 * It is one stash board now, and the card grids stay on as the second view for
 * anyone who would rather read an item than recognise it — and as the only view
 * on a phone, where a twelve-column pegboard of drag-and-drop sockets is neither
 * readable nor operable.
 */
export const CollectionTab = ({ data }: CollectionTabProps) => {
  const queryClient = useQueryClient();
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [scope, setScope] = useState<CollectionScope>("all");
  // A player who has arranged their stash opens in that arrangement. Their
  // positions live on their account, but only `manual` order draws them, so
  // starting everyone in `rarity` quietly threw the arrangement away on every
  // visit — it was saved and never seen.
  const [sort, setSort] = useState<CollectionSort>(() =>
    hasSavedArrangement(data.stashLayout) ? "manual" : "rarity",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<CollectionView>("stash");

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

  const guitarCount = data.inventory.length;
  const pedalCount = data.effectInventory?.length ?? 0;
  const hasAnything = guitarCount + pedalCount > 0;
  const parts = data.parts ?? [];
  // A player who scrapped everything owns no gear but still has a full bin, and
  // the stash is the only view that shows parts as something you own.
  const hasStash = hasAnything || parts.length > 0;

  // What is actually drawn. A phone never gets the board — it is too dense to
  // read at that width and its sockets are dragged, which fights the scroll — so
  // the collection falls back to the plain single-column card list it always was
  // there. The player's own choice is kept in state and comes back on a wider
  // screen. The orders only the board can honour — a hand-made arrangement, and
  // a split by kind the card grids don't have to make — borrow `rarity` there,
  // so the toolbar never shows a row of chips with none of them pressed.
  const activeView: CollectionView = isMobile ? "cards" : view;
  const activeSort: CollectionSort =
    activeView === "cards" && isStashOnlySort(sort) ? "rarity" : sort;

  return (
    <div className='flex flex-col gap-6'>
      {/* The stash hangs parts and rescued mods in sockets of their own; the
          card view has no sockets, so they get a list above the cards — without
          it a phone could neither see nor sell either of them. */}
      {activeView === "cards" && (
        <SalvageShelf parts={parts} mods={data.salvagedMods ?? []} />
      )}

      {hasAnything && (
        <CollectionToolbar
          scope={scope}
          onScopeChange={setScope}
          sort={activeSort}
          onSortChange={setSort}
          query={query}
          onQueryChange={setQuery}
          view={activeView}
          showViewSwitch={!isMobile}
          // The board's own order is kept in state while the cards borrow
          // `rarity` (see `activeSort`), so a glance at the cards can no longer
          // re-sort the stash for good — nothing to put back on the way out.
          onViewChange={setView}
          guitarCount={guitarCount}
          pedalCount={pedalCount}
        />
      )}

      {!hasStash && <CollectionEmptyState />}

      {hasStash && activeView === "stash" && (
        <StashInventory
          data={data}
          query={query}
          sort={activeSort}
          scope={scope}
          onManualArrange={() => setSort("manual")}
        />
      )}

      {hasAnything && activeView === "cards" && (
        <>
          {isScopeVisible(scope, "guitars") &&
            (guitarCount > 0 ? (
              <GuitarInventory data={data} query={query} sort={activeSort} />
            ) : (
              // Only worth saying when guitars are all the player asked for —
              // under "All" the pedals below already fill the screen.
              scope === "guitars" && <CollectionEmptyResult query={query} />
            ))}

          {isScopeVisible(scope, "pedals") &&
            (pedalCount > 0 ? (
              <EffectCollection data={data} query={query} sort={activeSort} />
            ) : (
              scope === "pedals" && <CollectionEmptyResult query={query} />
            ))}
        </>
      )}
    </div>
  );
};
