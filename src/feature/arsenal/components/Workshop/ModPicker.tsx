import { cn } from "assets/lib/utils";
import type { FittedMod, ModOption } from "feature/arsenal/data/workshop";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";

import { PartRow } from "../Parts/PartRow";
import { SectionLabel } from "./SectionLabel";

/**
 * The bill for one mod, small enough to sit inside a row.
 *
 * `CostList` is the full-width version for a job the player has already
 * committed to; here a dozen mods are being compared at once, so each bill is
 * reduced to its parts and quantities — still the real numbers, still tier
 * coloured, just quiet enough to scan down the column.
 */
const MiniBill = ({ mod }: { mod: ModOption }) => (
  <div className='flex flex-wrap items-center gap-2'>
    {mod.recipe.map((line, i) => (
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

interface ModRowProps {
  mod: ModOption;
  /** Present on a fitted mod — its current value. */
  points?: number;
  actionLabel: string;
  /** Explains a button whose consequence is not obvious from its label. */
  actionHint?: string;
  disabled: boolean;
  onAction: () => void;
  index?: number;
}

const ModRow = ({
  mod,
  points,
  actionLabel,
  actionHint,
  disabled,
  onAction,
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
          rolls +{mod.min} to +{mod.max}
        </span>
      </div>

      <MiniBill mod={mod} />
    </div>

    <button
      onClick={onAction}
      disabled={disabled}
      title={actionHint}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-colors click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400",
        "disabled:pointer-events-none disabled:opacity-40",
        points != null
          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
      )}>
      {points != null && <Dices size={16} />}
      {actionLabel}
    </button>
  </motion.div>
);

interface ModPickerProps {
  candidates: ModOption[];
  fitted: FittedMod[];
  /** No free slot — the fit menu is shown, but nothing in it can be bought. */
  slotsFull: boolean;
  busy: boolean;
  onFit: (featureId: string) => void;
  onReroll: (featureId: string) => void;
}

/**
 * The two halves of the mod bench: what can go on, and what is already on.
 *
 * Both are lists of the same row because they are the same transaction — a named
 * mod, its own bill, one button. The only difference is that a re-roll shows the
 * number it is about to overwrite.
 */
export const ModPicker = ({
  candidates,
  fitted,
  slotsFull,
  busy,
  onFit,
  onReroll,
}: ModPickerProps) => (
  <div className='flex flex-col gap-7'>
    {fitted.length > 0 && (
      <div className='flex flex-col gap-3'>
        <SectionLabel>Fitted</SectionLabel>
        <div className='flex flex-col gap-2'>
          {fitted.map((mod, i) => (
            <ModRow
              key={mod.id}
              mod={mod}
              index={i}
              points={mod.points}
              actionLabel='Re-roll'
              actionHint='Pays the same bill again and always replaces the current roll'
              disabled={!mod.affordable || busy}
              onAction={() => onReroll(mod.id)}
            />
          ))}
        </div>
      </div>
    )}

    <div className='flex flex-col gap-3'>
      <SectionLabel>
        {slotsFull
          ? "Fits this build — but every slot is taken"
          : "Fits this build"}
      </SectionLabel>

      {candidates.length === 0 ? (
        <div className='rounded-lg bg-zinc-800/20 p-6 text-base text-zinc-400'>
          Nothing left to fit — this instrument already carries every mod its
          construction allows.
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {candidates.map((mod, i) => (
            <ModRow
              key={mod.id}
              mod={mod}
              index={i}
              actionLabel='Fit'
              disabled={!mod.affordable || slotsFull || busy}
              onAction={() => onFit(mod.id)}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);
