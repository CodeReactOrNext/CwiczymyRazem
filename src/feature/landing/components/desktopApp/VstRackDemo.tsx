import { cn } from "assets/lib/utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Slot {
  id: string;
  name: string;
  bypassed: boolean;
}

const START: Slot[] = [
  { id: "gate", name: "Noise gate", bypassed: false },
  { id: "amp", name: "Amp sim", bypassed: false },
  { id: "chorus", name: "Chorus", bypassed: false },
  { id: "reverb", name: "Reverb", bypassed: false },
];

/** What a player does to a rack, one move every few seconds, then back to the start. */
const MOVES: ((slots: Slot[]) => Slot[])[] = [
  // Chorus after the reverb.
  (s) => [s[0], s[1], s[3], s[2]],
  // Bypass the gate.
  (s) =>
    s.map((slot) => (slot.id === "gate" ? { ...slot, bypassed: true } : slot)),
  // Chorus back in front.
  (s) => [s[0], s[1], s[3], s[2]],
  // Gate back on.
  (s) => s.map((slot) => ({ ...slot, bypassed: false })),
];

const MOVE_MS = 2400;

/**
 * A plugin rack being rearranged, the way the VST mode of Tone Studio lets
 * you: drag a plugin to another place in the chain, bypass one, put it back.
 * Generic names on purpose — the rack holds whatever VST3 plugins the player
 * owns. Decorative; the text beside it says the same in words.
 */
export const VstRackDemo = () => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState(START);

  useEffect(() => {
    if (still || !inView) return undefined;
    const id = window.setTimeout(() => {
      setSlots((current) => MOVES[step % MOVES.length](current));
      setStep((value) => value + 1);
    }, MOVE_MS);
    return () => window.clearTimeout(id);
  }, [step, inView, still]);

  return (
    <div ref={ref} aria-hidden className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='mb-4 flex items-center justify-between text-xs text-zinc-500'>
        <span>Guitar in</span>
        <span>Master out</span>
      </div>
      <ol className='space-y-2'>
        {slots.map((slot, idx) => (
          <motion.li
            key={slot.id}
            layout={!still}
            transition={transitions.spring}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3 transition-opacity duration-base",
              slot.bypassed && "opacity-40",
            )}>
            <GripVertical className='h-4 w-4 shrink-0 text-zinc-600' />
            <span className='w-5 font-teko text-xl tabular-nums leading-none text-zinc-500'>
              {idx + 1}
            </span>
            <span className='flex-1 text-sm font-semibold text-zinc-100'>
              {slot.name}
            </span>
            <span className='text-xs text-zinc-500'>
              {slot.bypassed ? "Bypassed" : "VST3"}
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
};
