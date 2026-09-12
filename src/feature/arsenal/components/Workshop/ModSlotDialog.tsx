import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";
import type { FittedMod, ModQuote } from "feature/arsenal/data/workshop";
import { MOD_REMOVE_FAME_COST } from "feature/arsenal/data/workshop";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import {
  formatModSlot,
  groupSlotChoices,
} from "feature/arsenal/utils/modSlotOptions";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import {
  CheckCircle2,
  ChevronRight,
  Dices,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { FameCoin } from "./FameCoin";
import { ModArt } from "./ModArt";
import { ModRemoveDialog } from "./ModRemoveDialog";

/** Which socket on the bench was clicked. */
export type ModSlotTarget =
  | { kind: "free"; index: number }
  | { kind: "fitted"; index: number; mod: FittedMod };

interface ModSlotDialogProps {
  /** `null` keeps the dialog shut. */
  slot: ModSlotTarget | null;
  entry: WorkshopEntry;
  modQuote: ModQuote;
  /** Mods the player owns that this instrument could take. */
  salvagedOptions: SalvagedModOption[];
  fame: number;
  onClose: () => void;
  /** A re-roll has a bill and a before → after; the full job sheet shows both. */
  onReroll: () => void;
}

/** The one primary button in these dialogs: white, not the interaction cyan. */
const PRIMARY =
  "rounded-lg bg-zinc-100 px-6 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400";
const SECONDARY =
  "rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/**
 * What one socket on the bench opens.
 *
 * An empty socket asks one question — which of the mods you own goes in here —
 * so it is a list to pick from and one button. An occupied socket has two
 * answers, re-roll or remove, and both already have their own sheets: the
 * re-roll's bill and before → after live on the job modal, the removal's
 * warning on its own confirm. This dialog is the doorway to each, with the
 * mod's card at the top so the player knows which slot they are standing at.
 */
export const ModSlotDialog = ({
  slot,
  entry,
  modQuote,
  salvagedOptions,
  fame,
  onClose,
  onReroll,
}: ModSlotDialogProps) => {
  const mod = useWorkshopMod();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const close = () => {
    setQuery("");
    setPicked(null);
    setRemoving(false);
    onClose();
  };

  const choices = groupSlotChoices(salvagedOptions, query);
  // The first row is picked until the player picks another, so the primary
  // button is never sitting there disabled over a list of perfectly good mods.
  const chosen =
    choices.find((c) => c.featureId === picked) ?? choices[0] ?? null;

  const install = () => {
    if (!chosen) return;
    mod.mutate(
      {
        itemId: entry.id,
        kind: entry.kind,
        featureId: null,
        action: "fit-salvaged",
        salvagedId: chosen.salvagedId,
      },
      { onSuccess: close },
    );
  };

  const remove = () => {
    if (slot?.kind !== "fitted") return;
    mod.mutate(
      {
        itemId: entry.id,
        kind: entry.kind,
        featureId: slot.mod.id,
        action: "remove",
      },
      { onSuccess: close },
    );
  };

  const slotLabel = slot ? `Slot ${formatModSlot(slot.index)}` : "";

  return (
    <Dialog
      open={slot !== null}
      onOpenChange={(open) => {
        if (!open && !mod.isPending) close();
      }}>
      {slot?.kind === "fitted" && (
        <ModRemoveDialog
          mod={removing ? slot.mod : null}
          itemName={entry.name}
          fameCost={MOD_REMOVE_FAME_COST}
          fame={fame}
          isLoading={mod.isPending}
          onConfirm={remove}
          onCancel={() => setRemoving(false)}
        />
      )}

      <DialogContent
        hideCloseButton
        onEscapeKeyDown={(e) => mod.isPending && e.preventDefault()}
        onInteractOutside={(e) => mod.isPending && e.preventDefault()}
        className='flex max-h-[100dvh] flex-col gap-5 border-0 bg-zinc-900 p-6 sm:max-h-[90vh] sm:max-w-lg sm:overflow-y-auto'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <DialogTitle className='text-xl font-bold text-zinc-100'>
              {slot?.kind === "fitted" ? "Manage mod" : "Install mod"}
            </DialogTitle>
            <DialogDescription className='mt-0.5 text-sm text-zinc-400'>
              {entry.name} · {slotLabel}
            </DialogDescription>
          </div>
          <button
            type='button'
            onClick={close}
            disabled={mod.isPending}
            aria-label='Close'
            className='rounded-md p-1.5 text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
            <X size={18} />
          </button>
        </div>

        {slot?.kind === "free" && (
          <>
            <div className='flex items-center gap-4 rounded-lg bg-zinc-800/40 p-4'>
              <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100/[0.04] text-zinc-500'>
                <Plus size={20} />
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-zinc-100'>
                  Choose a compatible mod
                </p>
                <p className='mt-0.5 text-xs text-zinc-400'>
                  Pick a mod from your stash to fit in this slot. It goes on at
                  the value it carries — nothing is re-rolled.
                </p>
              </div>
            </div>

            {salvagedOptions.length > 0 && (
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search compatible mods...'
                aria-label='Search compatible mods'
                startIcon={<Search size={14} className='ml-1 text-zinc-500' />}
                className='h-10 border-0 bg-zinc-800/60 text-sm text-zinc-100 placeholder:text-zinc-500'
              />
            )}

            {salvagedOptions.length === 0 ? (
              <div className='rounded-lg bg-zinc-800/40 p-4 text-sm text-zinc-400'>
                <p className='font-semibold text-zinc-200'>
                  Nothing in your stash fits this build.
                </p>
                <p className='mt-1 text-xs'>
                  Mods come off other instruments at the bench and from the
                  Trader. This one would take:{" "}
                  <span className='text-zinc-300'>
                    {modQuote.compatible.map((c) => c.label).join(", ")}
                  </span>
                  .
                </p>
              </div>
            ) : choices.length === 0 ? (
              <p className='py-6 text-center text-sm text-zinc-500'>
                No compatible mod matches that name.
              </p>
            ) : (
              <div className='flex max-h-72 flex-col gap-2 overflow-y-auto pr-1'>
                {choices.map((choice) => {
                  const active = chosen?.featureId === choice.featureId;
                  return (
                    <button
                      key={choice.featureId}
                      type='button'
                      onClick={() => setPicked(choice.featureId)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        active
                          ? "bg-zinc-100/10 ring-1 ring-inset ring-zinc-100/40"
                          : "bg-zinc-800/40 hover:bg-zinc-800/70",
                      )}>
                      <ModArt modId={choice.featureId} size={56} />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-semibold text-zinc-100'>
                          {choice.label}
                        </span>
                        <span className='mt-0.5 block text-xs text-purple-300'>
                          +{choice.points} bonus
                        </span>
                      </span>
                      <span className='shrink-0 text-right text-xs leading-tight text-zinc-400'>
                        <span className='block text-sm font-bold tabular-nums text-zinc-200'>
                          ×{choice.owned}
                        </span>
                        owned
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {chosen && (
              <div className='flex items-center gap-4 rounded-lg bg-zinc-800/40 p-4'>
                <ModArt modId={chosen.featureId} size={64} />
                <div className='min-w-0'>
                  <p className='flex flex-wrap items-baseline gap-x-3 text-sm font-semibold text-zinc-100'>
                    {chosen.label}
                    <span className='text-xs font-medium text-purple-300'>
                      +{chosen.points} bonus
                    </span>
                  </p>
                  <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400'>
                    <CheckCircle2 size={14} />
                    Compatible with this slot
                  </p>
                </div>
              </div>
            )}

            <div className='flex justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={close}
                disabled={mod.isPending}
                className={SECONDARY}>
                Cancel
              </button>
              <button
                type='button'
                onClick={install}
                disabled={!chosen || mod.isPending || modQuote.slots.free === 0}
                className={PRIMARY}>
                {mod.isPending ? "Installing..." : "Install mod"}
              </button>
            </div>
          </>
        )}

        {slot?.kind === "fitted" && (
          <>
            <div className='flex items-center gap-5 rounded-lg bg-zinc-800/40 p-4'>
              <ModArt modId={slot.mod.id} size={96} />
              <div className='min-w-0'>
                <p className='text-lg font-bold text-zinc-100'>
                  {slot.mod.label}
                </p>
                <span className='mt-1.5 inline-flex items-center rounded-md bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-300'>
                  Installed
                </span>
                <p className='mt-2 text-sm text-zinc-400'>
                  <span className='font-semibold text-purple-300'>
                    +{slot.mod.points}
                  </span>{" "}
                  bonus
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <button
                type='button'
                onClick={onReroll}
                disabled={!slot.mod.affordable || mod.isPending}
                className='flex w-full items-center gap-4 rounded-lg bg-zinc-800/40 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-800/70'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300'>
                  <Dices size={20} />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold text-zinc-100'>
                    Re-roll mod
                  </span>
                  <span className='mt-0.5 block text-xs text-zinc-400'>
                    {slot.mod.affordable
                      ? `Re-spec for parts — rolls +${slot.mod.min} to +${slot.mod.max}, and can come out lower.`
                      : "Your wallet does not cover this mod's bill of parts."}
                  </span>
                </span>
                <ChevronRight size={18} className='shrink-0 text-zinc-500' />
              </button>

              <button
                type='button'
                onClick={() => setRemoving(true)}
                disabled={!modQuote.canRemove || mod.isPending}
                className='flex w-full items-center gap-4 rounded-lg bg-zinc-800/40 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-800/70'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400'>
                  <Trash2 size={20} />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold text-zinc-100'>
                    Remove mod
                  </span>
                  <span className='mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-zinc-400'>
                    Take it off {slotLabel} for
                    <span className='inline-flex items-center gap-1 font-semibold tabular-nums text-amber-300'>
                      <FameCoin size={13} />
                      {MOD_REMOVE_FAME_COST}
                    </span>
                    Fame. The mod is destroyed on the way out.
                  </span>
                </span>
                <ChevronRight size={18} className='shrink-0 text-zinc-500' />
              </button>
            </div>

            <button
              type='button'
              onClick={close}
              disabled={mod.isPending}
              className={cn(SECONDARY, "w-full")}>
              Close
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
