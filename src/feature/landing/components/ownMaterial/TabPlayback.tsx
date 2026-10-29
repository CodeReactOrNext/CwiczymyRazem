import { cn } from "assets/lib/utils";
import type {
  OwnMaterialShowcase,
  ShowcaseBar,
} from "feature/landing/lib/ownMaterialProps";
import type { AnimationPlaybackControls, MotionValue } from "framer-motion";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Mic } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The practice session's default look (tablatureSettings.ts): the "rainbow"
 * palette, high e first, the "midnight" board, emerald hits, black fret text.
 */
export const STRING_COLORS = [
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#c084fc",
];
export const STRING_LABELS = ["E", "B", "G", "D", "A", "E"];
export const HIT_FILL = "#10b981";
export const BOARD = "#09090b";

/** Horizontal room one quarter note gets. */
const PX_PER_QUARTER = 88;
const ROW = 26;
const PILL = 18;
const GAP = 3;
/** Where the playhead stands, from the lane's left edge. */
const PLAYHEAD = 120;
/** A still frame, for reduced motion: this far into the loop. */
const STILL_AT = 0.18;

interface PlacedNote {
  x: number;
  width: number;
  string: number;
  fret: number;
}

const layout = (bars: ShowcaseBar[]) => {
  const notes: PlacedNote[] = [];
  const barStarts: number[] = [];
  let quarters = 0;
  for (const bar of bars) {
    barStarts.push(quarters * PX_PER_QUARTER);
    for (const beat of bar.beats) {
      for (const note of beat.notes) {
        notes.push({
          x: quarters * PX_PER_QUARTER,
          width: Math.max(beat.duration * PX_PER_QUARTER - GAP, 16),
          string: note.string,
          fret: note.fret,
        });
      }
      quarters += beat.duration;
    }
  }
  return { notes, barStarts, width: quarters * PX_PER_QUARTER, quarters };
};

/** A note pill that fills with the hit colour once it has crossed the playhead. */
const NotePill = ({
  note,
  offset,
  scroll,
}: {
  note: PlacedNote;
  /** Which copy of the loop this is (0 or the loop's width). */
  offset: number;
  scroll: MotionValue<number>;
}) => {
  const hit = useTransform(scroll, (x) =>
    note.x + offset + x <= PLAYHEAD ? 1 : 0,
  );
  return (
    <div
      className='absolute flex items-center overflow-hidden rounded'
      style={{
        left: note.x + offset,
        top: (note.string - 1) * ROW + (ROW - PILL) / 2,
        width: note.width,
        height: PILL,
        background: STRING_COLORS[note.string - 1],
      }}>
      <motion.span
        className='absolute inset-0'
        style={{ background: HIT_FILL, opacity: hit }}
      />
      <span className='relative pl-1.5 text-[11px] font-bold leading-none text-black'>
        {note.fret}
      </span>
    </div>
  );
};

/**
 * The hero's moving picture, drawn the way a practice session draws a tab:
 * a fixed red playhead, the tab running under it at the exercise's tempo,
 * one coloured pill per note sized by its length, and every note filling
 * with the hit colour as it is played. Above each bar, the chord the
 * generated backing plays there; below, the session's toolbar with the band
 * that backs it. Tab, key and chords are real: a library exercise run
 * through the backing generator at build time.
 *
 * DOM, not the session's canvas worker, so the landing ships none of the
 * player. Two copies of the tab sit end to end, so the loop never jumps.
 */
export const TabPlayback = ({
  showcase,
}: {
  showcase: OwnMaterialShowcase;
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const { notes, barStarts, width, quarters } = useMemo(
    () => layout(showcase.bars),
    [showcase.bars],
  );
  const loopSeconds = (quarters * 60) / Math.max(showcase.bpm, 1);

  // How far the tab has run, 0 → 1 per loop; the lane slides by it.
  const progress = useMotionValue(still ? STILL_AT : 0);
  const scroll = useTransform(progress, (p) => PLAYHEAD - p * width);

  // Runs while on screen, picking up where it paused; every finished loop
  // starts the next from the top.
  useEffect(() => {
    if (still || !inView) return undefined;
    let controls: AnimationPlaybackControls | null = null;
    let stopped = false;
    const run = () => {
      const from = progress.get() >= 1 ? 0 : progress.get();
      progress.set(from);
      controls = animate(progress, 1, {
        duration: loopSeconds * (1 - from),
        ease: "linear",
        onComplete: () => {
          if (stopped) return;
          progress.set(0);
          run();
        },
      });
    };
    run();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [still, inView, loopSeconds, progress]);

  const [bar, setBar] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const at = p * width;
    const current = barStarts.reduce(
      (found, start, idx) => (at >= start ? idx : found),
      0,
    );
    if (current !== bar) setBar(current);
  });

  return (
    <div
      ref={ref}
      role='img'
      aria-label={`A practice session playing a ${showcase.bars.length}-bar tab at ${showcase.bpm} BPM: the notes run under the playhead and light up as they are played, over a generated backing in ${showcase.key ?? "no fixed key"} with the chords ${showcase.progression.join(", ")}`}
      className='overflow-hidden rounded-lg bg-zinc-900/40 p-2'>
      <div className='overflow-hidden rounded' style={{ background: BOARD }}>
        {/* Bar numbers, the current one framed, as the session's minimap. */}
        <div className='flex gap-1.5 px-4 pt-4'>
          {showcase.bars.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold tabular-nums transition-colors duration-fast",
                idx === bar
                  ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/70"
                  : "bg-zinc-800/80 text-zinc-400",
              )}>
              {idx + 1}
            </span>
          ))}
          <span className='ml-auto self-center text-xs text-zinc-500'>
            {showcase.key ? `${showcase.key} · ` : ""}
            {showcase.groove}
          </span>
        </div>

        <div className='relative mt-3 flex'>
          <div className='z-10 flex shrink-0 flex-col pl-3 pr-2 pt-6'>
            {STRING_LABELS.map((label, idx) => (
              <span
                key={idx}
                className='flex items-center'
                style={{ height: ROW }}>
                <span
                  className='flex h-[18px] w-[22px] items-center justify-center rounded text-[11px] font-bold text-black'
                  style={{ background: STRING_COLORS[idx] }}>
                  {label}
                </span>
              </span>
            ))}
          </div>

          <div
            className='relative flex-1 overflow-hidden'
            style={{ height: ROW * 6 + 24 + 12 }}>
            {STRING_LABELS.map((_, idx) => (
              <span
                key={idx}
                className='absolute inset-x-0 h-px bg-zinc-800'
                style={{ top: 24 + idx * ROW + ROW / 2 }}
              />
            ))}

            <motion.div
              className='absolute left-0 top-0 h-full'
              style={{ x: scroll, width: width * 3 }}>
              {/* The loop before (already played), this one, and the next. */}
              {[-width, 0, width].map((offset) => (
                <div key={offset}>
                  {barStarts.map((start, idx) => (
                    <div key={idx}>
                      <span
                        className='absolute top-0 text-xs font-semibold text-zinc-200'
                        style={{ left: start + offset + 2 }}>
                        {showcase.bars[idx].chord}
                      </span>
                      <span
                        className='absolute w-px bg-zinc-700'
                        style={{
                          left: start + offset - GAP / 2,
                          top: 24,
                          height: ROW * 6,
                        }}
                      />
                    </div>
                  ))}
                  <div className='absolute inset-x-0' style={{ top: 24 }}>
                    {notes.map((note, idx) => (
                      <NotePill
                        key={idx}
                        note={note}
                        offset={offset}
                        scroll={scroll}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>

            <span
              aria-hidden
              className='absolute bottom-2 top-5 w-0.5 bg-red-500'
              style={{ left: PLAYHEAD }}
            />
          </div>
        </div>

        {/* The session toolbar, reduced to what this example is about. */}
        <div className='flex flex-wrap items-center gap-2 bg-zinc-900/80 px-4 py-3 text-xs'>
          <span className='inline-flex items-center gap-1.5 rounded bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-400'>
            <Mic className='h-3.5 w-3.5' aria-hidden='true' />
            Pitch Detect
          </span>
          <span className='rounded bg-zinc-800 px-2.5 py-1 text-zinc-300'>
            Backing · {showcase.parts.join(", ")}
          </span>
          <span className='ml-auto font-teko text-lg font-semibold tabular-nums leading-none text-amber-400'>
            {showcase.bpm}
            <span className='ml-1 font-sans text-[11px] font-normal text-zinc-500'>
              BPM
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
