import { cn } from "assets/lib/utils";
import type { BackingSourceCopy } from "feature/landing/data/ownMaterial";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { fade, transitions } from "lib/motion/motion";
import { useRef, useState } from "react";

/** A level meter that moves like a part playing, or lies flat when muted. */
const Meter = ({
  seed,
  muted,
  play,
}: {
  seed: number;
  muted?: boolean;
  play: boolean;
}) => {
  // Deterministic "music": a few levels per bar, different per part.
  const levels = [0.55, 0.8, 0.45, 0.9, 0.6, 0.75, 0.5, 0.85].map(
    (v, idx) => 0.25 + ((v * (seed + 3) + idx * 0.13) % 0.75),
  );
  return (
    <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
      <motion.span
        className={cn(
          "block h-full origin-left rounded-full",
          muted ? "bg-zinc-700" : "bg-zinc-300",
        )}
        initial={{ scaleX: muted ? 0.02 : levels[0] }}
        animate={
          muted || !play
            ? { scaleX: muted ? 0.02 : levels[0] }
            : { scaleX: levels }
        }
        transition={
          muted || !play
            ? transitions.base
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </span>
  );
};

const MixerRows = ({
  rows,
  play,
}: {
  rows: { name: string; note?: string; muted?: boolean }[];
  play: boolean;
}) => (
  <ul className='space-y-3'>
    {rows.map((row, idx) => (
      <li key={row.name} className='flex items-center gap-4'>
        <span className='w-32 shrink-0 text-sm text-zinc-200'>
          {row.name}
          {row.note && (
            <span className='ml-2 text-xs text-cyan-400'>{row.note}</span>
          )}
        </span>
        <Meter seed={idx} muted={row.muted} play={play} />
      </li>
    ))}
  </ul>
);

/** Peaks the recording has: one per beat, the downbeats loudest. */
const WAVE = Array.from({ length: 64 }, (_, idx) => {
  const inBeat = idx % 8;
  const downbeat = idx % 32 === 0;
  const base =
    inBeat === 0 ? (downbeat ? 1 : 0.8) : 0.22 + ((idx * 37) % 9) / 40;
  return Math.max(0.12, base - inBeat * 0.06);
});

/**
 * The sync editor's one move, played over and over: the tab's bar lines sit
 * off the recording, the first one is dragged onto the downbeat and the rest
 * follow it into place.
 */
const SyncDemo = ({ play }: { play: boolean }) => {
  const offset = 9; // % the tab starts out late by
  return (
    <div className='space-y-3'>
      <div className='relative h-24 overflow-hidden rounded bg-zinc-900/60'>
        <div className='absolute inset-x-0 top-1/2 flex h-16 -translate-y-1/2 items-center gap-[2px] px-1'>
          {WAVE.map((level, idx) => (
            <span
              key={idx}
              className='flex-1 rounded-full bg-zinc-600'
              style={{ height: `${level * 100}%` }}
            />
          ))}
        </div>
        {[0, 1].map((bar) => (
          <motion.span
            key={bar}
            className='absolute bottom-0 top-0 w-0.5 bg-cyan-400'
            initial={{ left: `${bar * 50}%` }}
            animate={
              play
                ? {
                    left: [
                      `${bar * 50 + offset}%`,
                      `${bar * 50 + offset}%`,
                      `${bar * 50}%`,
                      `${bar * 50}%`,
                    ],
                  }
                : { left: `${bar * 50}%` }
            }
            transition={
              play
                ? {
                    duration: 3.6,
                    times: [0, 0.35, 0.6, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : undefined
            }
          />
        ))}
      </div>
      <div className='flex justify-between text-xs text-zinc-500'>
        <span>Bar 1</span>
        <span>Bar 2</span>
        <span />
      </div>
    </div>
  );
};

/**
 * Where the band comes from, by what you brought: a tab you wrote, a Guitar
 * Pro file, or a song with its record. Three tabs, each with the one picture
 * that explains it. The pictures only move while the section is on screen.
 */
export const BackingSources = ({
  sources,
  progression,
  parts,
}: {
  sources: BackingSourceCopy[];
  /** The generated backing's chords for the hero's example. */
  progression: string[];
  parts: string[];
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const play = inView && !still;
  const [active, setActive] = useState(sources[0].id);
  const current = sources.find((source) => source.id === active)!;

  return (
    <div
      ref={ref}
      className='grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14'>
      <div>
        <div
          role='tablist'
          aria-label='Where the backing comes from'
          className='flex flex-wrap gap-2'>
          {sources.map((source) => (
            <button
              key={source.id}
              type='button'
              role='tab'
              id={`backing-tab-${source.id}`}
              aria-selected={source.id === active}
              aria-controls={`backing-panel-${source.id}`}
              onClick={() => setActive(source.id)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                source.id === active
                  ? "bg-zinc-100 font-semibold text-zinc-950"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}>
              {source.tab}
            </button>
          ))}
        </div>
        <div
          role='tabpanel'
          id={`backing-panel-${current.id}`}
          aria-labelledby={`backing-tab-${current.id}`}
          className='mt-8'>
          <h3 className='text-2xl font-bold text-white'>{current.title}</h3>
          <p className='mt-3 leading-relaxed text-zinc-400'>{current.text}</p>
        </div>
      </div>

      <div className='min-h-[15rem] rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={active}
            variants={fade}
            initial='hidden'
            animate='visible'
            exit='hidden'
            aria-hidden>
            {active === "generated" && (
              <div className='space-y-6'>
                <div className='flex flex-wrap gap-2'>
                  {progression.map((chord, idx) => (
                    <motion.span
                      key={`${chord}-${idx}`}
                      className='rounded bg-zinc-800 px-2.5 py-1 text-sm font-semibold text-zinc-200'
                      initial={still ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...transitions.base, delay: idx * 0.12 }}>
                      {chord}
                    </motion.span>
                  ))}
                </div>
                <MixerRows rows={parts.map((name) => ({ name }))} play={play} />
              </div>
            )}
            {active === "gp" && (
              <MixerRows
                play={play}
                rows={[
                  { name: "Drums" },
                  { name: "Bass" },
                  { name: "Rhythm guitar" },
                  { name: "Lead guitar", note: "you", muted: true },
                ]}
              />
            )}
            {active === "recording" && <SyncDemo play={play} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
