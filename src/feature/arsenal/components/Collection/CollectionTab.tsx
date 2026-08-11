import { useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import type {
  CollectionScope,
  CollectionSort,
} from "feature/arsenal/utils/collectionFilter";
import { isScopeVisible } from "feature/arsenal/utils/collectionFilter";
import { useEffect, useState } from "react";

import { EffectCollection } from "../GuitarInventory/EffectCollection";
import { GuitarInventory } from "../GuitarInventory/GuitarInventory";
import { WalletStrip } from "../Workshop/WalletStrip";
import { CollectionToolbar } from "./CollectionToolbar";

interface CollectionTabProps {
  data: ArsenalUserData;
}

/**
 * Everything the player owns, under one set of controls.
 *
 * The tab used to be three stacked blocks that knew nothing about each other:
 * the full parts wallet (which belongs to the workshop, not the collection),
 * then guitars, then pedals — each an endless grid. Now the parts collapse into
 * the same strip the workshop uses, and one toolbar drives both grids.
 */
export const CollectionTab = ({ data }: CollectionTabProps) => {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<CollectionScope>("all");
  const [sort, setSort] = useState<CollectionSort>("rarity");
  const [query, setQuery] = useState("");

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

  return (
    <div className='flex flex-col gap-6'>
      <WalletStrip parts={data.parts ?? []} />

      {hasAnything && (
        <CollectionToolbar
          scope={scope}
          onScopeChange={setScope}
          sort={sort}
          onSortChange={setSort}
          query={query}
          onQueryChange={setQuery}
          guitarCount={guitarCount}
          pedalCount={pedalCount}
        />
      )}

      {isScopeVisible(scope, "guitars") && (
        <GuitarInventory data={data} query={query} sort={sort} />
      )}

      {isScopeVisible(scope, "pedals") && (
        <EffectCollection data={data} query={query} sort={sort} />
      )}
    </div>
  );
};
