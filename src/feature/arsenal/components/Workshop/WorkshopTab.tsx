import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { getWorkshopEntries } from "feature/arsenal/utils/workshopEntries";
import { Hammer } from "lucide-react";
import { useMemo, useState } from "react";

import { PartsWallet } from "../Parts/PartsWallet";
import { WorkshopBench } from "./WorkshopBench";
import { WorkshopRack } from "./WorkshopRack";

interface WorkshopTabProps {
  data: ArsenalUserData | undefined;
  fame: number;
}

/**
 * The crafting half of the scrap loop: spend salvaged parts to restore gear and
 * push its build level. There is no level cap — the cost curve in `data/workshop.ts`
 * is what stops you.
 */
export const WorkshopTab = ({ data, fame }: WorkshopTabProps) => {
  const entries = useMemo(() => getWorkshopEntries(data), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Derived rather than synced: the item can vanish under us (scrapped, sold,
  // listed on the market), and falling back to the top of the rack keeps the
  // bench occupied without an effect chasing the inventory.
  const selected =
    entries.find((e) => e.id === selectedId) ?? entries[0] ?? null;

  if (entries.length === 0) {
    return (
      <div className='flex flex-col items-center gap-6 rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
        <Hammer size={40} className='text-zinc-700' />
        <div className='flex flex-col items-center gap-2'>
          <h2 className='text-xl font-black tracking-wide text-white'>
            Workshop
          </h2>
          <p className='max-w-sm text-sm text-zinc-400'>
            Open a case first. Once you own a guitar or a pedal you can restore
            it and keep building it up with salvaged parts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      <PartsWallet parts={data?.parts ?? []} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]'>
        <WorkshopRack
          entries={entries}
          selectedId={selected?.id ?? null}
          onSelect={(entry) => setSelectedId(entry.id)}
        />

        {selected && (
          // Keyed on the item so switching gear resets the bench's reward state.
          <WorkshopBench
            key={selected.id}
            entry={selected}
            wallet={data?.parts ?? []}
            fame={fame}
          />
        )}
      </div>
    </div>
  );
};
