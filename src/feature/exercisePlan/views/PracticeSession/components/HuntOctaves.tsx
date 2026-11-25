import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";

import { HUNT_MAX_FRET, huntPositions } from "../hooks/useNoteHunt";

/** Index = string number (1 = high e … 6 = low E). */
const STRING_LETTERS = ["", "e", "B", "G", "D", "A", "E"];

/** "C₄" — a real subscript, sized the same for every octave. */
export const HuntOctaveLabel = ({ note, octave }: { note: string; octave: number }) => (
  <span translate='no'>
    {note}
    <sub className='relative bottom-auto top-[0.2em] ml-px align-baseline text-[0.58em] font-bold leading-none'>{octave}</sub>
  </span>
);

/** Where an octave sits on the neck, low strings first: "A 3, E 8". */
export function octavePlaces(note: string, octave: number, tuningShift = 0): string {
  return huntPositions(note, [0, HUNT_MAX_FRET])
    // The target sounds `tuningShift` away from what the fret reads in standard.
    .filter(({ midiNote }) => Math.floor((midiNote + tuningShift) / 12) - 1 === octave)
    .sort((a, b) => b.string - a.string)
    .map(({ string, fret }) => `${STRING_LETTERS[string]} ${fret}`)
    .join(", ");
}

interface HuntOctavesProps {
  note: string;
  octaves: number[];
  foundOctaves: number[];
  /** The octave sounding right now, if it is the target. */
  liveOctave: number | null;
  tuningShift?: number;
  /** Marks an octave by hand; left out where the mic does it. */
  onMark?: (octave: number) => void;
}

/**
 * One equal tile per octave. A found one fills in and says where on the neck it
 * was, so the row reads as the round's progress without a counter beside it.
 */
export const HuntOctaves = ({ note, octaves, foundOctaves, liveOctave, tuningShift, onMark }: HuntOctavesProps) => (
  <div className='grid gap-3 shortwide:gap-2' style={{ gridTemplateColumns: `repeat(${octaves.length}, minmax(0, 1fr))` }}>
    {octaves.map((octave) => {
      const found = foundOctaves.includes(octave);
      const className = cn(
        "flex min-h-[5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-3 text-center transition-colors duration-fast shortwide:min-h-[4rem] shortwide:py-2",
        found
          ? octave === liveOctave ? "bg-emerald-500/30 text-emerald-200" : "bg-emerald-500/15 text-emerald-300"
          : "bg-zinc-800 text-zinc-100",
      );
      const content = (
        <>
          <span className='font-display text-2xl font-extrabold leading-none'>
            <HuntOctaveLabel note={note} octave={octave} />
          </span>
          {found && (
            <span translate='no' className='text-xs font-medium leading-tight text-emerald-200/80'>
              {octavePlaces(note, octave, tuningShift)}
            </span>
          )}
        </>
      );

      return onMark ? (
        <button
          key={octave}
          type='button'
          aria-pressed={found}
          onClick={() => onMark(octave)}
          className={cn(
            PRESSABLE_KEY,
            className,
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            !found && "hover:bg-zinc-700",
          )}>
          {content}
        </button>
      ) : (
        <div key={octave} className={className}>{content}</div>
      );
    })}
  </div>
);
