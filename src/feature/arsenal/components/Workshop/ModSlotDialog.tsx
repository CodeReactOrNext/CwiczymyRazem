import { buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { SearchInput } from "components/SearchInput/SearchInput";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";
import type { FittedMod, ModQuote } from "feature/arsenal/data/workshop";
import { MOD_REMOVE_FAME_COST } from "feature/arsenal/data/workshop";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import {
  formatModSlot,
  groupSlotChoices,
} from "feature/arsenal/utils/modSlotOptions";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Dices, Trash2, X } from "lucide-react";
import { useState } from "react";

import { CostChips } from "./CostChips";
import { GO_KEY } from "./goKey";
import { ModArt } from "./ModArt";
import { ModRemoveDialog } from "./ModRemoveDialog";

/** Which socket on the bench was clicked. */
export type ModSlotTarget =
  | { kind: "free"; index: number }
  | {
      kind: "fitted";
      index: number;
      mod: FittedMod;
      /**
       * Set by the socket's dice shortcut. The dialog has one screen for a
       * fitted mod, re-roll included, so it opens the same way either way.
       */
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
  /** The parts wallet — the re-roll bill's "Make" reads it. */
  wallet: ScrapPart[];
  /** Feature id to have picked when an empty socket opens. */
  preferModId?: string | null;
  onClose: () => void;
}

/** The last roll this dialog made, so the player sees it land. */
interface LastRoll {
  before: number;
  after: number;
  /** Bumps on every roll so an identical result still replays its entrance. */
  seq: number;
}

const SECONDARY = buttonVariants({ variant: "ghost", size: "lg" });

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
  const { t } = useArsenalLabels();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div
      className='flex gap-1.5'
      role='img'
      aria-label={t("mods.rolls_aria", { min, max, current })}>
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
            {v === was ? t("mods.was") : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * What one socket on the bench opens.
 *
 * An empty socket asks one question — which of the mods you own goes in here —
 * so it is the list and one green key that says what the install is worth.
 *
 * An occupied socket is one screen, not a menu of two more: the mod, where its
 * value sits on the range it can roll, the bill in chips, and the re-roll key.
 * After a roll the result lands over the same bill and the key becomes "Roll
 * again", so chasing a number is one click a roll. Taking the mod off is the
 * quiet key at the bottom and asks on its own alert, because nothing comes back.
 */
export const ModSlotDialog = ({
  slot,
  entry,
  modQuote,
  salvagedOptions,
  fame,
  wallet,
  preferModId = null,
  onClose,
}: ModSlotDialogProps) => {
  // Installing into an empty socket plays the fit scene; re-rolls stay here.
  const mod = useWorkshopMod({ scene: true });
  const labels = useArsenalLabels();
  const { t } = labels;
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(preferModId);
  const [removing, setRemoving] = useState(false);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);

  const close = () => {
    setQuery("");
    setPicked(null);
    setRemoving(false);
    setLastRoll(null);
    onClose();
  };

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
  // The first row is picked until the player picks another, so the install key
  // is never sitting there disabled over a list of perfectly good mods.
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

  const slotLabel = slot
    ? t("mods.slot", { slot: formatModSlot(slot.index) })
    : "";
  const delta = lastRoll ? lastRoll.after - lastRoll.before : 0;
  const canInstall = !!chosen && modQuote.slots.free > 0;

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
        className='flex max-h-[100dvh] flex-col gap-6 bg-zinc-900 p-6 sm:max-h-[90vh] sm:overflow-y-auto'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 flex-col gap-1'>
            <DialogTitle className='text-xl font-bold text-zinc-100'>
              {slot?.kind !== "fitted"
                ? t("mods.install_mod")
                : live
                  ? labels.mod(live.id, live.label)
                  : t("mods.manage_mod")}
            </DialogTitle>
            <DialogDescription className='truncate text-sm text-zinc-400'>
              {entry.name} · {slotLabel}
            </DialogDescription>
          </div>
          <button
            type='button'
            onClick={close}
            disabled={mod.isPending}
            aria-label={t("common.close")}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
            <X size={18} />
          </button>
        </div>

        {slot?.kind === "free" && (
          <>
            {/* Search only earns its place on a long list. */}
            {salvagedOptions.length > 6 && (
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("mods.search_placeholder")}
                aria-label={t("mods.search")}
              />
            )}

            {salvagedOptions.length === 0 ? (
              <div className='flex flex-col gap-1 rounded-lg bg-zinc-800/40 p-5 text-sm text-zinc-400'>
                <p className='font-semibold text-zinc-200'>
                  {t("mods.nothing_in_stash")}
                </p>
                <p className='text-xs'>
                  {t("mods.would_take")}{" "}
                  <span className='text-zinc-300'>
                    {modQuote.compatible
                      .map((c) => labels.mod(c.id, c.label))
                      .join(", ")}
                  </span>
                  .
                </p>
              </div>
            ) : choices.length === 0 ? (
              <p className='py-6 text-center text-sm text-zinc-500'>
                {t("mods.no_match")}
              </p>
            ) : (
              <div className='flex max-h-80 flex-col gap-2 overflow-y-auto pr-1'>
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
                          ? "bg-zinc-100/10 ring-2 ring-inset ring-zinc-100/70"
                          : "bg-zinc-800/40 hover:bg-zinc-800/70",
                      )}>
                      <ModArt modId={choice.featureId} size={56} />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-semibold text-zinc-100'>
                          {labels.mod(choice.featureId, choice.label)}
                        </span>
                        {choice.owned > 1 && (
                          <span className='mt-0.5 block text-xs tabular-nums text-zinc-500'>
                            ×{choice.owned}
                          </span>
                        )}
                      </span>
                      <span className='shrink-0 text-2xl font-black tabular-nums text-purple-300'>
                        +{choice.points}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className='flex flex-col gap-3 sm:flex-row'>
              <button
                type='button'
                onClick={close}
                disabled={mod.isPending}
                className={cn(SECONDARY, "sm:w-40")}>
                {t("common.cancel")}
              </button>
              {salvagedOptions.length > 0 && (
                <button
                  type='button'
                  onClick={install}
                  disabled={!canInstall || mod.isPending}
                  className={cn(
                    buttonVariants({ size: "xl" }),
                    canInstall && GO_KEY,
                    "flex-1",
                  )}>
                  {mod.isPending
                    ? t("salvage.installing")
                    : chosen
                      ? t("workshop.job_with_gain", {
                          job: t("mods.install_named", {
                            name: labels.mod(chosen.featureId, chosen.label),
                          }),
                          count: chosen.points,
                        })
                      : t("mods.install_mod")}
                </button>
              )}
            </div>
          </>
        )}

        {slot?.kind === "fitted" && live && (
          <>
            <div className='flex items-center gap-5 rounded-lg bg-zinc-800/40 p-5'>
              <ModArt modId={live.id} size={88} />
              <div className='flex min-w-0 flex-col'>
                <span className='text-4xl font-black tabular-nums text-purple-300'>
                  +{live.points}
                </span>
                <span className='text-sm text-zinc-400'>
                  {t("mods.bonus_word")}
                </span>
              </div>
            </div>

            <RollScale
              min={live.min}
              max={live.max}
              current={live.points}
              was={lastRoll && delta !== 0 ? lastRoll.before : null}
            />

            <CostChips
              lines={live.recipe}
              wallet={wallet}
              playerFame={fame}
              busy={mod.isPending}
            />

            {live.points > live.min && !lastRoll && (
              <p className='flex items-center justify-center gap-2 text-sm text-amber-300'>
                <AlertTriangle size={16} className='shrink-0' />
                {t("mods.can_roll_lower", { points: live.points })}
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
                      ? t("mods.better", { count: delta })
                      : delta < 0
                        ? t("mods.worse", { count: -delta })
                        : t("mods.same_value")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type='button'
              onClick={reroll}
              disabled={!live.affordable || mod.isPending}
              className={cn(buttonVariants({ size: "xl" }), "w-full")}>
              <Dices size={18} />
              {mod.isPending
                ? t("mods.rolling")
                : lastRoll
                  ? t("mods.roll_again")
                  : t("mods.reroll_range", { min: live.min, max: live.max })}
            </button>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <button
                type='button'
                onClick={() => setRemoving(true)}
                disabled={!modQuote.canRemove || mod.isPending}
                className={cn(
                  SECONDARY,
                  "gap-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-300 sm:w-auto",
                )}>
                <Trash2 size={16} />
                {t("mods.take_off_for", { fame: MOD_REMOVE_FAME_COST })}
              </button>
              <button
                type='button'
                onClick={close}
                disabled={mod.isPending}
                className={cn(SECONDARY, "sm:flex-1")}>
                {lastRoll ? t("mods.done") : t("common.close")}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
