import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";
import type { FittedMod, ModQuote } from "feature/arsenal/data/workshop";
import { MOD_REMOVE_FAME_COST } from "feature/arsenal/data/workshop";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import {
  formatModSlot,
  groupSlotChoices,
} from "feature/arsenal/utils/modSlotOptions";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Dices,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { ModArt } from "./ModArt";
import { ModRemoveDialog } from "./ModRemoveDialog";

/** Which socket on the bench was clicked. */
export type ModSlotTarget =
  | { kind: "free"; index: number }
  | {
      kind: "fitted";
      index: number;
      mod: FittedMod;
      /** Open straight on the re-roll confirm (the socket's dice shortcut). */
      intent?: "reroll";
    };

interface ModSlotDialogProps {
  /** `null` keeps the dialog shut. */
  slot: ModSlotTarget | null;
  entry: WorkshopEntry;
  modQuote: ModQuote;
  /** Mods the player owns that this instrument could take. */
  salvagedOptions: SalvagedModOption[];
  fame: number;
  onClose: () => void;
}

/** The last roll this dialog made, so the player sees it land. */
interface LastRoll {
  before: number;
  after: number;
  /** Bumps on every roll so an identical result still replays its entrance. */
  seq: number;
}

/** The one primary button in these dialogs: white, not the interaction cyan. */
const PRIMARY =
  "rounded-lg bg-zinc-100 px-6 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400";
const SECONDARY =
  "rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/**
 * Every value a roll can land on, one cell each: amber below what the mod
 * carries now (a loss), emerald above, and an arrow pointing at the current one.
 * The player reads the odds off the picture instead of doing "+3 – +7" in
 * their head.
 */
const RollScale = ({
  min,
  max,
  current,
  was,
}: {
  min: number;
  max: number;
  current: number;
  /** The value before the last roll, when it changed — marked so the jump reads. */
  was: number | null;
}) => {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div
      className='flex gap-1.5'
      role='img'
      aria-label={`Rolls +${min} to +${max}, currently +${current}`}>
      {values.map((v) => (
        <div key={v} className='flex min-w-0 flex-1 flex-col items-center'>
          {/* The pointer is what marks the current value — a label and an
              arrow over its cell, not a colour the eye has to decode. */}
          <span className='flex h-9 flex-col items-center justify-end text-[11px] font-semibold leading-none text-zinc-200'>
            {v === current && (
              <>
                now
                <ChevronDown size={16} strokeWidth={3} className='-mb-0.5' />
              </>
            )}
          </span>
          <span
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-md text-sm font-bold tabular-nums transition-colors",
              v < current && "bg-amber-500/10 text-amber-300/80",
              v === current && "bg-zinc-700/60 text-white",
              v > current && "bg-emerald-500/10 text-emerald-300/90",
            )}>
            +{v}
          </span>
          <span className='mt-1.5 h-4 text-[11px] font-semibold text-zinc-500'>
            {v === was ? "was" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * The re-roll, confirmed where it is asked for.
 *
 * Only the two things the decision turns on: the range, and a warning when the
 * roll can land below what the mod carries now. The button underneath is the
 * confirmation; after a roll the result goes on top and it becomes "Roll again",
 * so chasing a number is one click a roll.
 */
const RerollStep = ({
  mod,
  lastRoll,
  isPending,
  onReroll,
  onBack,
  onDone,
}: {
  mod: FittedMod;
  lastRoll: LastRoll | null;
  isPending: boolean;
  onReroll: () => void;
  onBack: () => void;
  onDone: () => void;
}) => {
  const delta = lastRoll ? lastRoll.after - lastRoll.before : 0;

  return (
    <>
      <div className='flex flex-col gap-5 rounded-lg bg-zinc-800/40 p-4'>
        <div className='flex items-center gap-4'>
          <ModArt modId={mod.id} size={56} />
          <p className='min-w-0 truncate text-base font-bold text-zinc-100'>
            {mod.label}
          </p>
        </div>
        <RollScale
          min={mod.min}
          max={mod.max}
          current={mod.points}
          was={lastRoll && delta !== 0 ? lastRoll.before : null}
        />
      </div>

      {/* The cost is the headline ("2× Neck"), the stock a whisper under it —
          the compact bill's "40 / 2" read backwards here. */}
      <div className='flex flex-col gap-2.5'>
        <span className='text-sm font-semibold text-zinc-400'>Cost</span>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {mod.recipe.map((line) => {
            const ok = line.have >= line.need;
            const tierColor = PART_TIER_COLORS[line.tier];
            return (
              <div
                key={`${line.partId}:${line.tier}`}
                className='flex items-center gap-3 rounded-lg bg-zinc-800/40 py-2 pl-2 pr-4'>
                <TierPlate color={tierColor} size={36} muted={!ok}>
                  <PartIcon partId={line.partId} size={28} />
                </TierPlate>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-bold text-zinc-100'>
                    <span
                      className={cn(
                        "tabular-nums",
                        ok ? "text-white" : "text-amber-400",
                      )}>
                      {line.need}×
                    </span>{" "}
                    {getPartLabel(line.partId)}
                  </p>
                  <p className='mt-0.5 truncate text-xs'>
                    <span style={{ color: tierColor }}>{line.tier}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        ok ? "text-zinc-500" : "text-amber-400/80",
                      )}>
                      {" · "}
                      {ok
                        ? `you have ${line.have}`
                        : `${line.need - line.have} short`}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {mod.points > mod.min && (
        <p className='flex items-center gap-2 text-sm text-amber-300'>
          <AlertTriangle size={16} className='shrink-0' />
          Can roll lower than your current +{mod.points}.
        </p>
      )}

      <AnimatePresence mode='wait' initial={false}>
        {lastRoll && (
          <motion.div
            key={lastRoll.seq}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center justify-between gap-4 rounded-lg px-4 py-3",
              delta > 0
                ? "bg-emerald-500/10"
                : delta < 0
                  ? "bg-amber-500/10"
                  : "bg-zinc-800/40",
            )}>
            <span className='flex items-baseline gap-2 text-lg font-black tabular-nums'>
              <span className='text-zinc-500'>+{lastRoll.before}</span>
              <span className='text-zinc-600'>→</span>
              <span
                className={
                  delta > 0
                    ? "text-emerald-300"
                    : delta < 0
                      ? "text-amber-300"
                      : "text-zinc-200"
                }>
                +{lastRoll.after}
              </span>
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                delta > 0
                  ? "text-emerald-400"
                  : delta < 0
                    ? "text-amber-400"
                    : "text-zinc-400",
              )}>
              {delta > 0
                ? `${delta} better`
                : delta < 0
                  ? `${-delta} worse`
                  : "same value"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='flex justify-end gap-2 pt-1'>
        <button
          type='button'
          onClick={lastRoll ? onDone : onBack}
          disabled={isPending}
          className={SECONDARY}>
          {lastRoll ? "Done" : "Back"}
        </button>
        <button
          type='button'
          onClick={onReroll}
          disabled={!mod.affordable || isPending}
          className={cn(PRIMARY, "flex items-center gap-2")}>
          <Dices size={16} />
          {isPending
            ? "Rolling…"
            : !mod.affordable
              ? "Not enough parts"
              : lastRoll
                ? "Roll again"
                : "Re-roll"}
        </button>
      </div>
    </>
  );
};

/**
 * What one socket on the bench opens.
 *
 * An empty socket asks one question — which of the mods you own goes in here —
 * so it is a list to pick from and one button. An occupied socket has two
 * answers, re-roll or remove. The removal gives nothing back, so it asks on its
 * own alert. The re-roll is a step inside this dialog: the bill, the odds and
 * one button, and once it lands the result sits over the same bill with "Roll
 * again" beside it — chasing a better roll is one click a roll, and every one of
 * them is made with the price in view.
 */
export const ModSlotDialog = ({
  slot,
  entry,
  modQuote,
  salvagedOptions,
  fame,
  onClose,
}: ModSlotDialogProps) => {
  const mod = useWorkshopMod();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  /** `null` until the player moves — then the socket's intent no longer decides. */
  const [step, setStep] = useState<"manage" | "reroll" | null>(null);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);

  const close = () => {
    setQuery("");
    setPicked(null);
    setRemoving(false);
    setStep(null);
    setLastRoll(null);
    onClose();
  };

  const fittedStep =
    step ??
    (slot?.kind === "fitted" && slot.intent === "reroll" ? "reroll" : "manage");
  // The quote refetches after every roll; the slot target is a snapshot from
  // the click, so the bill and the value are read off the live quote.
  const live =
    slot?.kind === "fitted"
      ? (modQuote.fitted.find((f) => f.id === slot.mod.id) ?? slot.mod)
      : null;

  const reroll = () => {
    if (!live) return;
    mod.mutate(
      {
        itemId: entry.id,
        kind: entry.kind,
        featureId: live.id,
        action: "reroll",
      },
      {
        onSuccess: (data) =>
          setLastRoll((prev) => ({
            before: data.pointsBefore ?? live.points,
            after: data.points,
            seq: (prev?.seq ?? 0) + 1,
          })),
      },
    );
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
          mod={removing ? live : null}
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
              {slot?.kind !== "fitted"
                ? "Install mod"
                : fittedStep === "reroll"
                  ? "Re-roll mod"
                  : "Manage mod"}
            </DialogTitle>
            {/* Screen readers only: the item and slot are already obvious from
                the socket the player just clicked. */}
            <DialogDescription className='sr-only'>
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

        {slot?.kind === "fitted" && live && fittedStep === "reroll" && (
          <RerollStep
            mod={live}
            lastRoll={lastRoll}
            isPending={mod.isPending}
            onReroll={reroll}
            onBack={() => {
              setLastRoll(null);
              setStep("manage");
            }}
            onDone={close}
          />
        )}

        {slot?.kind === "fitted" && live && fittedStep === "manage" && (
          <>
            <div className='flex items-center gap-5 rounded-lg bg-zinc-800/40 p-4'>
              <ModArt modId={live.id} size={96} />
              <div className='min-w-0'>
                <p className='text-lg font-bold text-zinc-100'>{live.label}</p>
                <p className='mt-1 text-sm text-zinc-400'>
                  <span className='font-semibold text-purple-300'>
                    +{live.points}
                  </span>{" "}
                  bonus
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <button
                type='button'
                onClick={() => setStep("reroll")}
                disabled={!live.affordable || mod.isPending}
                className='flex w-full items-center gap-4 rounded-lg bg-zinc-800/40 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-800/70'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300'>
                  <Dices size={20} />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold text-zinc-100'>
                    Re-roll mod
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
