import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";
import type {
  FittedMod,
  ModFeatureDef,
  ModOption,
} from "feature/arsenal/data/workshop";
import { motion } from "framer-motion";
import { Dices, Trash2 } from "lucide-react";

import { PartRow } from "../Parts/PartRow";
import { SectionLabel } from "../SectionLabel";
import { FameCoin } from "./FameCoin";
import { ModArt } from "./ModArt";

/**
 * The bill for one mod, small enough to sit inside a row.
 *
 * `CostList` is the full-width version for a job the player has already
 * committed to; here a dozen mods are being compared at once, so each bill is
 * reduced to its parts and quantities — still the real numbers, still tier
 * coloured, just quiet enough to scan down the column.
 */
const MiniBill = ({ recipe }: { recipe: ModOption["recipe"] }) => (
  <div className='flex flex-wrap items-center gap-2'>
    {recipe.map((line, i) => (
      <PartRow
        key={`${line.partId}:${line.tier}`}
        partId={line.partId}
        tier={line.tier}
        need={line.need}
        have={line.have}
        variant='compact'
        index={i}
      />
    ))}
  </div>
);

/**
 * A row's one button, with what it will do to the instrument behind it.
 *
 * The consequence lives in a tooltip rather than in the row: with a dozen mods
 * listed, a paragraph under every bill turned the list into an essay, and the
 * player only needs the fine print for the row they are about to commit to. The
 * hint is written with that mod's own numbers in it, so it is never generic.
 */
const ActionButton = ({
  label,
  hint,
  rolls,
  disabled,
  onAction,
}: {
  label: string;
  hint?: string;
  /** A re-roll — dice on the label and the quieter zinc treatment. */
  rolls: boolean;
  disabled: boolean;
  onAction: () => void;
}) => {
  const button = (
    <button
      onClick={onAction}
      disabled={disabled}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-colors click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400",
        "disabled:pointer-events-none disabled:opacity-40",
        rolls
          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
      )}>
      {rolls && <Dices size={16} />}
      {label}
    </button>
  );

  if (!hint) return button;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        {/* `asChild` keeps the row's own button — the trigger adds no box of its own. */}
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent className='max-w-[280px] leading-relaxed'>
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * The other way a fitted mod can leave the instrument.
 *
 * Quiet zinc that only turns red under the cursor, and always *beside* the
 * re-roll rather than in its place: one of the two buys the mod again, the other
 * throws it away, and the pair has to read as a choice rather than as one button
 * with a hidden second meaning. The price is on the face of it because it is the
 * only job on this bench paid for in Fame.
 */
const RemoveButton = ({
  fame,
  disabled,
  onRemove,
}: {
  fame: number;
  disabled: boolean;
  onRemove: () => void;
}) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Take this mod off for ${fame} Fame`}
          className={cn(
            "flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-3.5 text-sm font-bold text-zinc-400 transition-colors click-behavior",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/60",
            "disabled:pointer-events-none disabled:opacity-40",
            "hover:bg-red-500/15 hover:text-red-300",
          )}>
          <Trash2 size={16} />
          <FameCoin size={16} />
          <span className='tabular-nums'>{fame}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className='max-w-[280px] leading-relaxed'>
        Takes the mod off the instrument for {fame} Fame and frees its slot. The
        mod is destroyed on the way out — it is not put in your stash and cannot
        be fitted again.
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface ModRowProps {
  mod: ModOption;
  /** Present on a fitted mod — its current value. */
  points?: number;
  actionLabel: string;
  /** Tooltip on the button, for a consequence its label cannot carry. */
  actionHint?: string;
  disabled: boolean;
  onAction: () => void;
  /** Fitted mods only — the second, destructive way off the instrument. */
  onRemove?: () => void;
  removeFame?: number;
  removeDisabled?: boolean;
  index?: number;
}

const ModRow = ({
  mod,
  points,
  actionLabel,
  actionHint,
  disabled,
  onAction,
  onRemove,
  removeFame = 0,
  removeDisabled = false,
  index = 0,
}: ModRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
    className={cn(
      "flex flex-col gap-4 rounded-lg p-5 transition-colors sm:flex-row sm:items-center sm:gap-6",
      mod.affordable ? "bg-zinc-800/40 hover:bg-zinc-800/60" : "bg-zinc-800/20",
    )}>
    <ModArt
      modId={mod.id}
      size={96}
      dimmed={!mod.affordable}
      className='self-start sm:self-center'
    />

    <div className='flex min-w-0 flex-1 flex-col gap-3'>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        {points != null && (
          <span className='shrink-0 text-2xl font-black tabular-nums text-purple-300'>
            +{points}
          </span>
        )}
        <span
          className={cn(
            "min-w-0 truncate text-base font-bold",
            mod.affordable ? "text-zinc-100" : "text-zinc-400",
          )}>
          {mod.label}
        </span>
        <span className='shrink-0 text-sm tabular-nums text-zinc-500'>
          {points != null ? "re-rolls" : "rolls"} +{mod.min} to +{mod.max}
        </span>
      </div>

      <MiniBill recipe={mod.recipe} />
    </div>

    <div className='flex shrink-0 flex-wrap items-center gap-2'>
      <ActionButton
        label={actionLabel}
        hint={actionHint}
        rolls={points != null}
        disabled={disabled}
        onAction={onAction}
      />
      {onRemove && (
        <RemoveButton
          fame={removeFame}
          disabled={removeDisabled}
          onRemove={onRemove}
        />
      )}
    </div>
  </motion.div>
);

/**
 * A mod the player already owns, offered to this instrument.
 *
 * Deliberately not a `ModRow`: this one has no range to roll and no bill to pay,
 * because it is not being made — it already exists, it was paid for with the
 * instrument it came off or with a day's Fame at the Trader, and it arrives at
 * the exact value it carries. Where the bill would be, the row says where it
 * came from instead.
 */
const SalvagedRow = ({
  mod,
  slotsFull,
  busy,
  onFit,
  index,
}: {
  mod: SalvagedModOption;
  slotsFull: boolean;
  busy: boolean;
  onFit: () => void;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
    className='flex flex-col gap-4 rounded-lg bg-purple-500/10 p-5 transition-colors hover:bg-purple-500/15 sm:flex-row sm:items-center sm:gap-6'>
    <ModArt
      modId={mod.featureId}
      size={96}
      className='self-start sm:self-center'
    />

    <div className='flex min-w-0 flex-1 flex-col gap-2'>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <span className='shrink-0 text-2xl font-black tabular-nums text-purple-300'>
          +{mod.points}
        </span>
        <span className='min-w-0 truncate text-base font-bold text-zinc-100'>
          {mod.label}
        </span>
      </div>
      <span className='text-sm text-zinc-500'>
        From {mod.sourceName} — goes on as it is, nothing re-rolled
      </span>
    </div>

    <button
      onClick={onFit}
      disabled={slotsFull || busy}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-colors click-behavior",
        "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400",
        "disabled:pointer-events-none disabled:opacity-40",
      )}>
      Install
    </button>
  </motion.div>
);

interface ModPickerProps {
  /** Mods the player owns that this instrument could take — the only way one goes on. */
  salvaged: SalvagedModOption[];
  fitted: FittedMod[];
  /** What this build would take and does not carry. Reference, not a menu. */
  compatible: ModFeatureDef[];
  /** No free slot — owned mods are still listed, but none of them can go on. */
  slotsFull: boolean;
  /** Flat Fame the bench charges to strip a mod off, whatever it is worth. */
  removeFame: number;
  /** Whether the player's Fame covers that charge. */
  canRemove: boolean;
  busy: boolean;
  onReroll: (featureId: string) => void;
  onFitSalvaged: (salvagedId: string) => void;
  onRemove: (featureId: string) => void;
}

/**
 * The three lists on the mod bench: what you own and could bolt on, what is
 * already on, and what this build would take if one ever turned up.
 *
 * Only the first two are transactions. The third is reference — the bench does
 * not sell mods, so a row there with a bill and a button would advertise a shop
 * that does not exist, which is exactly what the old fit menu was.
 */
export const ModPicker = ({
  salvaged,
  fitted,
  compatible,
  slotsFull,
  removeFame,
  canRemove,
  busy,
  onReroll,
  onFitSalvaged,
  onRemove,
}: ModPickerProps) => (
  <div className='flex flex-col gap-7'>
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <SectionLabel>From your stash</SectionLabel>
        {/*
          The one rule of this bench, written where the player is standing when
          it matters. It is the thing that changed, and the thing every empty
          list below is explained by.
        */}
        <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
          A mod is a component, and the bench fits the one you hand it — it
          cannot make one. Mods come off gear you scrap and off the
          Trader&apos;s counter, and they go on at the value they already carry:
          nothing is re-rolled and nothing is charged.
        </p>
        {slotsFull && salvaged.length > 0 && (
          <p className='max-w-xl text-sm leading-relaxed text-amber-400/80'>
            Every mod slot at this rarity is filled — a promotion buys the room
            for these.
          </p>
        )}
      </div>

      {salvaged.length === 0 ? (
        <div className='rounded-lg bg-zinc-800/20 p-6 text-base leading-relaxed text-zinc-400'>
          Nothing you own fits this instrument. Scrap something carrying a mod —
          one always survives a teardown — or see what the Trader has today.
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {salvaged.map((mod, i) => (
            <SalvagedRow
              key={mod.salvagedId}
              mod={mod}
              index={i}
              slotsFull={slotsFull}
              busy={busy}
              onFit={() => onFitSalvaged(mod.salvagedId)}
            />
          ))}
        </div>
      )}
    </div>

    {fitted.length > 0 && (
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <SectionLabel>Installed</SectionLabel>
          {/*
            The tooltips carry each row's own numbers, but a tooltip is nothing on
            a phone — so the rule that costs a player levels is written once here,
            where it cannot be missed.
          */}
          <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
            A re-roll is the one job here that spends parts. It buys a brand-new
            value from the mod&apos;s range, and whatever comes up replaces what
            the mod is worth now — there is no keeping the better of the two.
          </p>
          <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
            Taking one off costs {removeFame} Fame and frees its slot. The mod
            comes off the instrument for good: it is not put back in your stash,
            it cannot be fitted anywhere else, and the level it was worth goes
            with it.
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          {fitted.map((mod, i) => (
            <ModRow
              key={mod.id}
              mod={mod}
              index={i}
              points={mod.points}
              actionLabel='Re-roll'
              actionHint={`Pays this bill again for one fresh roll between +${mod.min} and +${mod.max}. It replaces +${mod.points} either way — ${
                mod.points > mod.min
                  ? `${mod.points - mod.min} of the ${mod.max - mod.min + 1} results are worse than what it carries now`
                  : "the only way from here is up or sideways"
              }.`}
              disabled={!mod.affordable || busy}
              onAction={() => onReroll(mod.id)}
              onRemove={() => onRemove(mod.id)}
              removeFame={removeFame}
              removeDisabled={!canRemove || busy}
            />
          ))}
        </div>
      </div>
    )}

    {compatible.length > 0 && (
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <SectionLabel>Would fit this build</SectionLabel>
          <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
            What to keep an eye out for. Any of these would go onto this
            instrument the day one reaches your stash.
          </p>
        </div>
        {/*
          Chips rather than rows: there is no bill to read and no button to press,
          and twenty of these at row height would bury the two lists that are
          actually jobs.
        */}
        <div className='flex flex-wrap gap-2'>
          {compatible.map((mod) => (
            <span
              key={mod.id}
              className='flex items-center gap-2.5 rounded-lg bg-zinc-800/40 py-2 pl-2 pr-4'>
              <ModArt modId={mod.id} size={32} />
              <span className='text-sm font-semibold text-zinc-300'>
                {mod.label}
              </span>
              <span className='text-xs tabular-nums text-zinc-500'>
                +{mod.min} to +{mod.max}
              </span>
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);
