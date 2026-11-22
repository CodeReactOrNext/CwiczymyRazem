import { buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { getModQuote } from "feature/arsenal/data/workshop";
import { useBenchReadiness } from "feature/arsenal/hooks/useBenchReadiness";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useBenchDialogStore } from "./benchDialogStore";
import { WorkshopBench } from "./WorkshopBench";

interface BenchDialogProps {
  data: ArsenalUserData;
}

/**
 * The Workshop's bench, opened over the Collection.
 *
 * The very same `WorkshopBench` the Workshop tab shows — sockets, Restore,
 * Upgrade, the build log — so there is nothing new to learn; it just no longer
 * takes a change of tab and a second search through the rack to reach. The ‹ ›
 * keys walk the rest of the same kind of gear, in the rack's order, so a pass
 * over the whole collection is one dialog.
 */
export const BenchDialog = ({ data }: BenchDialogProps) => {
  const { t } = useTranslation("arsenal");
  const { itemId, modFeatureId, showItem, close } = useBenchDialogStore();
  const { entries, fame } = useBenchReadiness(data);

  const entry = entries.find((e) => e.id === itemId) ?? null;
  const siblings = entry ? entries.filter((e) => e.kind === entry.kind) : [];
  const index = entry ? siblings.indexOf(entry) : -1;
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 ? (siblings[index + 1] ?? null) : null;

  const wallet = data.parts ?? [];
  // A mod handed over from the stash opens its install dialog on the next free
  // socket rather than on the bench.
  const initialSlot =
    entry && modFeatureId
      ? {
          kind: "free" as const,
          index: getModQuote(entry.subject, wallet, fame).slots.used,
        }
      : null;

  const iconKey = cn(buttonVariants({ variant: "ghost", size: "icon" }));

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent
        hideCloseButton
        className='flex max-h-[100dvh] flex-col gap-5 bg-zinc-950 p-4 sm:max-h-[92vh] sm:max-w-3xl sm:overflow-y-auto sm:p-6'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => prev && showItem(prev.id)}
            disabled={!prev}
            aria-label={t("workshop.previous_instrument")}
            className={iconKey}>
            <ChevronLeft size={18} />
          </button>
          <div className='flex min-w-0 flex-1 flex-col'>
            <DialogTitle className='text-lg font-black text-zinc-100'>
              {t("view.tabs.workshop")}
            </DialogTitle>
            <DialogDescription className='text-xs tabular-nums text-zinc-500'>
              {t("workshop.n_of_total", {
                n: index + 1,
                total: siblings.length,
              })}
            </DialogDescription>
          </div>
          <button
            type='button'
            onClick={() => next && showItem(next.id)}
            disabled={!next}
            aria-label={t("workshop.next_instrument")}
            className={iconKey}>
            <ChevronRight size={18} />
          </button>
          <button
            type='button'
            onClick={close}
            aria-label={t("common.close")}
            className={iconKey}>
            <X size={18} />
          </button>
        </div>

        {entry && (
          // Keyed on the item (and the mod handed over) so switching gear resets
          // the bench's own dialogs, exactly as picking from the rack does.
          <WorkshopBench
            key={`${entry.id}:${modFeatureId ?? ""}`}
            entry={entry}
            wallet={wallet}
            salvagedMods={data.salvagedMods ?? []}
            fame={fame}
            initialSlot={initialSlot}
            preferModId={modFeatureId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
