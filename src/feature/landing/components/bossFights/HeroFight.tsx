"use client";

import { cn } from "assets/lib/utils";
import { BoonIcon, RARITY_TEXT } from "feature/bosses/components/BoonIcon";
import { BossArt } from "feature/bosses/components/BossArt";
import { FRETWEAVER } from "feature/bosses/data/fretweaver";
import { stageStyle } from "feature/bosses/utils/bossArt";
import type {
  BoonCard,
  HeroFrame,
  HeroRun,
} from "feature/landing/lib/bossFightsProps";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Sword } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** The replay runs faster than the phase's real 60 BPM — a whole phase in about fifteen seconds. */
const NOTE_MS = 190;
const BREAK_MS = 5200;
/** The frame a still page (reduced motion) shows: mid-phase, a strike just landed. */
const STILL_FRAME = 44;

const GRADE: Record<HeroFrame["grade"], { label: string; className: string }> =
  {
    4: { label: "Dead on", className: "text-emerald-300" },
    3: { label: "On time", className: "text-emerald-400" },
    2: { label: "Close", className: "text-zinc-300" },
    1: { label: "Loose", className: "text-zinc-400" },
    0: { label: "Miss", className: "text-orange-400" },
  };

/** The draft's own tints; a pick lights its card the way hovering does in the game. */
const RARITY_CARD = {
  common: { idle: "bg-zinc-900", picked: "bg-zinc-800" },
  rare: { idle: "bg-purple-950/50", picked: "bg-purple-950/80" },
  epic: { idle: "bg-amber-950/40", picked: "bg-amber-950/70" },
} as const;
/** When the replay "picks" — long enough to read the three cards. */
const PICK_AFTER_MS = 2600;

/** Six strings, low E at the bottom, the way the session's tab reads. */
const STRING_Y = (string: number) => 10 + (string - 1) * 12;
const STEP = 34;
const HIT_X = 64;

const TabStrip = ({ frames, at }: { frames: HeroFrame[]; at: number }) => {
  const from = Math.max(0, at - 2);
  const to = Math.min(frames.length, at + 9);
  return (
    <div className='relative h-[84px] overflow-hidden rounded-md bg-zinc-950/60'>
      <svg
        className='absolute inset-0 h-full w-full'
        aria-hidden='true'
        preserveAspectRatio='none'>
        {[1, 2, 3, 4, 5, 6].map((string) => (
          <line
            key={string}
            x1='0'
            x2='100%'
            y1={STRING_Y(string) + 2}
            y2={STRING_Y(string) + 2}
            className='stroke-zinc-800'
            strokeWidth='1'
          />
        ))}
      </svg>
      <div
        className='absolute inset-y-0 w-px bg-zinc-500/60'
        style={{ left: HIT_X + 11 }}
        aria-hidden='true'
      />
      <motion.div
        className='absolute inset-0'
        animate={{ x: -at * STEP }}
        transition={{ duration: NOTE_MS / 1000, ease: "linear" }}>
        {frames.slice(from, to).map((frame, i) => {
          const index = from + i;
          const played = index < at;
          return (
            <span
              key={index}
              className={cn(
                "absolute flex h-[14px] w-[22px] items-center justify-center rounded-sm font-teko text-[15px] tabular-nums leading-none transition-colors",
                !played && "bg-zinc-800 text-zinc-100",
                played &&
                  frame.grade === 0 &&
                  "bg-orange-500/25 text-orange-300",
                played &&
                  frame.grade > 0 &&
                  "bg-emerald-500/20 text-emerald-300",
              )}
              style={{
                left: HIT_X + index * STEP,
                top: STRING_Y(frame.string) - 5,
              }}>
              {frame.fret}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
};

const HpBar = ({
  value,
  max,
  side,
  label,
}: {
  value: number;
  max: number;
  side: "player" | "boss";
  label: string;
}) => (
  <div className={cn("min-w-0 flex-1", side === "boss" && "text-right")}>
    <div
      className={cn(
        "mb-1.5 flex items-baseline gap-2",
        side === "boss" && "justify-end",
      )}>
      <span className='truncate text-xs text-zinc-400'>{label}</span>
      <span className='shrink-0 font-teko text-2xl tabular-nums leading-none text-zinc-50'>
        {value}
        {/* The max is in the bar; a phone has no room for it twice. */}
        <span className='hidden text-base text-zinc-500 sm:inline'>
          {" "}
          / {max}
        </span>
      </span>
    </div>
    <div className='h-3 overflow-hidden rounded-sm bg-zinc-950/70'>
      <motion.div
        className={cn(
          "h-full",
          side === "player"
            ? "origin-left bg-gradient-to-r from-emerald-600 to-emerald-400"
            : "ml-auto origin-right bg-gradient-to-l from-purple-700 to-purple-400",
        )}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
    </div>
  </div>
);

interface HeroFightProps {
  run: HeroRun;
  /** The cards of the draft the run ends on, as the game words them. */
  draft: BoonCard[];
}

/**
 * The hero: phase 1 of a simulated run, every note put through the game's own
 * fight engine at build time (`buildBossFightsProps`), replayed over the real
 * Fretweaver art. A note charges the sword by its grade, a full sword strikes,
 * a miss bites; the phase breaks into the draft and the replay starts over.
 */
export const HeroFight = ({ run, draft }: HeroFightProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduceMotion = useReducedMotion();
  const [at, setAt] = useState(reduceMotion ? STILL_FRAME : 0);
  // Which pass of the replay this is — a pick belongs to the break it was made in.
  const [loop, setLoop] = useState(0);
  const [pickedLoop, setPickedLoop] = useState<number | null>(null);
  const done = at >= run.frames.length;
  const playing = inView && !reduceMotion;

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setTimeout(
      () => {
        if (done) setLoop((n) => n + 1);
        setAt((i) => (i >= run.frames.length ? 0 : i + 1));
      },
      done ? BREAK_MS : NOTE_MS,
    );
    return () => window.clearTimeout(id);
  }, [playing, at, done, run.frames.length]);

  useEffect(() => {
    if (!done || !playing) return undefined;
    const id = window.setTimeout(() => setPickedLoop(loop), PICK_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [done, playing, loop]);

  const shown =
    at === 0 ? null : run.frames[Math.min(at, run.frames.length) - 1];
  const bossHp = shown ? shown.bossHp : run.bossMaxHp;
  const playerHp = shown ? shown.playerHp : run.playerMaxHp;
  const charge = shown ? shown.charge : 0;
  const ticks = useMemo(() => {
    const played = run.frames.slice(0, at);
    return {
      strikes: played.filter((f) => f.strike !== null).length,
      bites: played.filter((f) => f.bite !== null).length,
    };
  }, [run.frames, at]);
  const piecesLost = Math.min(7, Math.floor((1 - bossHp / run.bossMaxHp) * 8));
  const pickedId = done && pickedLoop === loop ? (draft[0]?.id ?? null) : null;

  return (
    <div
      ref={ref}
      className='relative overflow-hidden rounded-lg bg-zinc-900/40'
      style={stageStyle("fretweaver", 0)}>
      <div className='flex flex-wrap items-start gap-x-4 gap-y-3 px-5 pt-5 sm:flex-nowrap sm:px-6'>
        <HpBar
          value={playerHp}
          max={run.playerMaxHp}
          side='player'
          label='You'
        />
        {/* On a phone the phase heads the stage and the two bars share the row under it. */}
        <div className='order-first basis-full pt-0.5 text-center sm:order-none sm:shrink-0 sm:basis-auto'>
          <p className='font-landingHeading text-lg font-bold leading-none text-white'>
            Phase 1
          </p>
          <p className='mt-1 text-[11px] tabular-nums text-zinc-500'>
            {run.bpm} BPM · {run.rhythm}
          </p>
        </div>
        <HpBar
          value={bossHp}
          max={run.bossMaxHp}
          side='boss'
          label={FRETWEAVER.name}
        />
      </div>

      <div className='relative mx-auto -mt-1 h-52 w-64 sm:h-60 sm:w-72'>
        <BossArt
          boss={FRETWEAVER}
          className='h-full w-full'
          strikeTick={ticks.strikes}
          biteTick={ticks.bites}
          pattern={run.pattern}
          webTorn={1 - bossHp / run.bossMaxHp}
          piecesLost={done ? 0 : piecesLost}
          molting={done}
          intro
        />
        <AnimatePresence>
          {shown?.strike != null && !done && (
            <motion.span
              key={`strike-${at}`}
              className='pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 font-teko text-5xl leading-none text-white'
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: -10 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35 }}>
              −{shown.strike}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className='space-y-3 px-5 pb-5 sm:px-6'>
        <div className='flex items-center gap-3'>
          <Sword
            className={cn(
              "h-4 w-4 shrink-0",
              charge / run.chargeMax >= 0.8
                ? "text-amber-300"
                : "text-zinc-500",
            )}
            aria-hidden='true'
          />
          <div className='h-2 flex-1 overflow-hidden rounded-sm bg-zinc-950/70'>
            <motion.div
              className='h-full bg-gradient-to-r from-amber-600 to-amber-300'
              animate={{
                width: `${Math.min(1, charge / run.chargeMax) * 100}%`,
              }}
              transition={{ duration: 0.15 }}
            />
          </div>
          <span className='w-28 shrink-0 text-right text-xs tabular-nums text-zinc-400'>
            Streak {shown?.combo ?? 0} · ×{(shown?.multiplier ?? 1).toFixed(1)}
          </span>
        </div>

        <TabStrip frames={run.frames} at={Math.min(at, run.frames.length)} />

        <div className='flex h-5 items-center justify-between text-xs'>
          <AnimatePresence mode='wait'>
            {shown && !done && (
              <motion.span
                key={at}
                className={cn("font-semibold", GRADE[shown.grade].className)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}>
                {GRADE[shown.grade].label}
                {shown.bite !== null && (
                  <span className='ml-2 text-orange-400'>−{shown.bite} HP</span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
          <span className='ml-auto text-zinc-600'>Simulated run, sped up</span>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            className='absolute inset-0 flex flex-col justify-center bg-zinc-950/95 px-5 sm:px-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>
            <p className='text-sm text-zinc-400'>
              Phase 1 cleared · +{run.next.heal} HP
            </p>
            <p className='mt-1 font-landingHeading text-2xl font-bold text-white'>
              Phase {run.next.phase} · {run.next.bpm} BPM
            </p>
            <p className='mt-1 text-sm text-zinc-500'>
              Pick one boon before it starts.
            </p>
            <ul className='mt-5 grid gap-2.5 sm:grid-cols-3'>
              {draft.map((boon, i) => (
                <motion.li
                  key={boon.id}
                  className={cn(
                    "rounded-lg p-3.5 transition-colors duration-300",
                    pickedId === boon.id
                      ? RARITY_CARD[boon.rarity].picked
                      : RARITY_CARD[boon.rarity].idle,
                  )}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{
                    opacity: pickedId && pickedId !== boon.id ? 0.4 : 1,
                    y: 0,
                  }}
                  transition={{
                    delay: pickedId ? 0 : 0.5 + i * 0.15,
                    duration: 0.4,
                  }}>
                  <div className='flex items-center gap-2'>
                    <BoonIcon id={boon.id} className='h-5 w-5' />
                    <span className='text-sm font-semibold text-white'>
                      {boon.name}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      RARITY_TEXT[boon.rarity],
                    )}>
                    {boon.rarity[0].toUpperCase() + boon.rarity.slice(1)}
                  </p>
                  <p className='mt-2 text-xs leading-relaxed text-zinc-400'>
                    {boon.body}
                  </p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
