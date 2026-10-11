import { Button } from "assets/components/ui/button";
import { CollectionSectionHeader } from "feature/arsenal/components/Collection/CollectionSectionHeader";
import { Wrench } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { COMPONENT_DEFS } from "../data/components";
import type {
  ComponentSlot,
  OwnedComponent,
} from "../types/guitarBuilder.types";
import { getComponent, type Owned, RARITY_ORDER } from "../utils/components";
import { ComponentCard } from "./ComponentCard";
import { SLOTS } from "./GuitarWorkbench";
import { SlotTabs } from "./SlotTabs";

interface BuilderPartsShelfProps {
  components: OwnedComponent[];
}

/**
 * Guitar Builder parts in the Collection. They live beside the stash board
 * rather than on it — the board is a hand-arranged pegboard of gear, and a
 * hundred loose parts would bury it. Tapping one opens the Builder.
 */
export const BuilderPartsShelf = ({ components }: BuilderPartsShelfProps) => {
  const router = useRouter();
  const [slot, setSlot] = useState<ComponentSlot>("body");

  const owned = useMemo(
    () =>
      components
        .map((item) => ({ ...item, def: getComponent(item.defId) }))
        .filter((item): item is Owned => Boolean(item.def)),
    [components],
  );
  const counts = useMemo(() => {
    const bySlot = new Map<ComponentSlot, number>();
    for (const item of owned) {
      bySlot.set(item.def.slot, (bySlot.get(item.def.slot) ?? 0) + 1);
    }
    return bySlot;
  }, [owned]);
  const shown = owned
    .filter((item) => item.def.slot === slot)
    .sort(
      (a, b) =>
        RARITY_ORDER.indexOf(b.def.rarity) -
          RARITY_ORDER.indexOf(a.def.rarity) || b.level - a.level,
    );
  const distinct = new Set(owned.map((item) => item.defId)).size;

  const openBuilder = () =>
    router.replace({ query: { ...router.query, tab: "builder" } }, undefined, {
      shallow: true,
    });

  return (
    <section className='flex flex-col gap-5'>
      <CollectionSectionHeader
        eyebrow='Guitar Builder'
        title='Parts'
        owned={distinct}
        total={COMPONENT_DEFS.length}
        unit='parts collected'
        action={
          <Button variant='secondary' size='sm' onClick={openBuilder}>
            <Wrench className='mr-2' />
            Open Builder
          </Button>
        }
      />
      <SlotTabs
        slots={SLOTS}
        active={slot}
        onSelect={setSlot}
        hint={(target) => String(counts.get(target) ?? 0)}
      />
      {shown.length > 0 ? (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6'>
          {shown.map((item) => (
            <ComponentCard
              key={item.uid}
              owned={item}
              active={false}
              isNew={item.isNew}
              onClick={openBuilder}
            />
          ))}
        </div>
      ) : (
        <p className='rounded-lg bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-400'>
          None yet — parts drop from the Standard, Premium Guitar and Elite
          Guitar cases.
        </p>
      )}
    </section>
  );
};
