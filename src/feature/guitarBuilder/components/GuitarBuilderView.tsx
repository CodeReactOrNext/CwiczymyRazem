import { Button } from "assets/components/ui/button";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { Dices } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ComponentSlot,
  Loadout,
  OwnedComponent,
} from "../types/guitarBuilder.types";
import {
  createDemoStash,
  dropComponent,
  getComponent,
  type Owned,
} from "../utils/components";
import { ComponentThumb } from "./ComponentThumb";
import { GuitarWorkbench } from "./GuitarWorkbench";

/** First copy of each starter part, so the demo opens on a playable guitar. */
function starterLoadout(stash: OwnedComponent[]): Loadout {
  const first = (defId: string) =>
    stash.find((item) => item.defId === defId)?.uid ?? null;
  return {
    body: first("body:t-style"),
    neck: first("neck:maple-dots"),
    head: first("head:six-inline"),
    pickups: first("pickups:stock-singles"),
    finish: first("finish:candy-red"),
    pickguard: null,
  };
}

/** The dev demo: the bench on a seeded fake stash, plus free rolls. */
export const GuitarBuilderView = () => {
  const [stash, setStash] = useState<OwnedComponent[]>(() => createDemoStash());
  const [initialLoadout] = useState(() => starterLoadout(stash));
  const [slot, setSlot] = useState<ComponentSlot>("body");
  const [lastDrop, setLastDrop] = useState<Owned | null>(null);
  const newUids = useMemo(
    () => new Set(lastDrop ? [lastDrop.uid] : []),
    [lastDrop],
  );

  const rollPart = () => {
    const drop = dropComponent(Math.random);
    const def = getComponent(drop.defId);
    if (!def) return;
    setStash((current) => [drop, ...current]);
    setLastDrop({ ...drop, def });
    setSlot(def.slot);
  };

  return (
    <div className='mx-auto max-w-6xl space-y-8 px-4 py-8'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='font-display text-2xl font-semibold text-zinc-100'>
            Guitar Builder
          </h1>
          <p className='text-sm text-zinc-400'>
            Demo stash: one of every part plus 40 extra drops.
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {lastDrop && (
            <button
              type='button'
              onClick={() => setSlot(lastDrop.def.slot)}
              className='flex items-center gap-3 rounded-lg py-1 pl-1 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-zinc-800/60'>
              <ComponentThumb def={lastDrop.def} className='h-9 w-12' />
              <span className='text-left text-xs leading-tight'>
                <span
                  className='block'
                  style={{ color: getRarityColor(lastDrop.def.rarity) }}>
                  {lastDrop.def.name}
                </span>
                <span className='text-zinc-400'>Lvl {lastDrop.level}</span>
              </span>
            </button>
          )}
          <Button variant='secondary' onClick={rollPart}>
            <Dices className='mr-2' />
            Roll a part
          </Button>
        </div>
      </header>

      <GuitarWorkbench
        stash={stash}
        initialLoadout={initialLoadout}
        slot={slot}
        onSlotChange={setSlot}
        newUids={newUids}
      />
    </div>
  );
};
