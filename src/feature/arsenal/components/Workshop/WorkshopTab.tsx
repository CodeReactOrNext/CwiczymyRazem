import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { getWorkshopEntries } from "feature/arsenal/utils/workshopEntries";
import { Guitar, Hammer } from "lucide-react";
import { useMemo, useState } from "react";

import { WalletStrip } from "./WalletStrip";
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
  const [rackOpen, setRackOpen] = useState(false);

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

  const pickInstrument = (id: string) => {
    setSelectedId(id);
    setRackOpen(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      <WalletStrip parts={data?.parts ?? []} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start'>
        {/* Below lg the rack is a sheet: on a phone it used to sit above the
            bench as its own scrolling list, so every visit to the workshop
            started with scrolling past the whole collection. */}
        <button
          onClick={() => setRackOpen(true)}
          className='flex items-center gap-3 rounded-lg bg-zinc-900/40 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 hover:bg-zinc-900/70 lg:hidden'>
          <Guitar size={18} className='shrink-0 text-zinc-500' />
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span className='truncate text-sm font-bold text-zinc-100'>
              {selected?.name}
            </span>
            <span className='text-xs text-zinc-500'>
              Change instrument · {entries.length} in the rack
            </span>
          </span>
        </button>

        <div className='hidden lg:block'>
          <WorkshopRack
            entries={entries}
            selectedId={selected?.id ?? null}
            onSelect={(entry) => pickInstrument(entry.id)}
          />
        </div>

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

      <Sheet open={rackOpen} onOpenChange={setRackOpen}>
        <SheetContent
          side='bottom'
          className='max-h-[85vh] overflow-y-auto p-4 lg:hidden'>
          <SheetTitle className='sr-only'>Pick an instrument</SheetTitle>
          <WorkshopRack
            bare
            entries={entries}
            selectedId={selected?.id ?? null}
            onSelect={(entry) => pickInstrument(entry.id)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
