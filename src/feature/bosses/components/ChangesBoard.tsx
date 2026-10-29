import { cn } from "assets/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { transitions } from "lib/motion/motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useBossText } from "../hooks/useBossText";
import { changesPlayhead, onPlayhead, useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition, ChangesVariation } from "../types/boss.types";
import { isWebbed } from "../utils/bossEngine";
import { windowFor } from "../utils/changesFretboard";
import type { NoteRole } from "../utils/changesHarmony";
import { chordScale, chordTones, inKey, keyLabel, noteName } from "../utils/changesHarmony";
import { STRONG_BEAT_EVERY } from "../utils/changesJudge";
import type { ChangesLive, ChangesMiss } from "../utils/changesLive";
import { strongBeatKey } from "../utils/changesLive";
import { BEATS_PER_BAR, unitSpans } from "../utils/changesTab";
import { ChangesFretboard } from "./ChangesFretboard";
import { ComboHud, useComboEnding } from "./ComboHud";

/** The chords the lane shows: the one being played and the two after it. */
export const LANE_CHORDS = 3;

const isTone = (role: NoteRole) => role !== "passing" && role !== "outside";

/** A strong beat as played: a chord tone on it (true), another note (false), nothing yet (undefined). */
type StrongResult = boolean | undefined;

/** The colour a played strong beat shows in: hit green, missed orange. */
const strongClass = (result: StrongResult) =>
  result === true ? "bg-emerald-500" : result === false ? "bg-orange-500" : null;

const isStrong = (beat: number) => beat % STRONG_BEAT_EVERY === 0;

const wrap = (value: number, length: number) => ((value % length) + length) % length;

/** The last notes heard, newest on the right: the note and what it was to the chord. */
const NoteTrail = ({
  trail,
  variation,
  t,
  className,
}: {
  trail: ChangesLive["trail"];
  variation: ChangesVariation;
  t: Translate;
  className?: string;
}) => (
  <ol className={cn("flex h-7 items-center gap-1.5", className)} aria-label={t("board.heard")}>
    <AnimatePresence initial={false}>
      {trail.map((note, i) => (
        <m.li
          key={note.tick}
          layout
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.35 + (0.65 * (i + 1)) / trail.length, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex items-baseline gap-1 rounded-md px-2 py-0.5 text-sm tabular-nums",
            note.verdict === "miss"
              ? "bg-orange-950/40 text-orange-300"
              : isTone(note.role)
                ? "bg-emerald-950/50 text-emerald-300"
                : "bg-zinc-800/60 text-zinc-400",
          )}>
          <span className='font-semibold'>{noteName(note.pc, variation.key)}</span>
          <span className='text-xs opacity-80'>
            {note.verdict === "miss" ? "✕" : isTone(note.role) ? note.degree : "·"}
          </span>
        </m.li>
      ))}
    </AnimatePresence>
  </ol>
);

/** What the two sizes of dot on the neck are for: the chord on beats 1 and 3, the scale in between. */
const Legend = ({ chord, scale, t }: { chord: string; scale: string; t: Translate }) => (
  <ul className='flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-xs text-zinc-400'>
    <li className='flex items-center gap-1.5'>
      <span className='h-3 w-3 rounded-full bg-zinc-200' aria-hidden />
      {t("board.legend_chord", { chord })}
    </li>
    <li className='flex items-center gap-1.5'>
      <span className='h-2 w-2 rounded-full bg-zinc-500' aria-hidden />
      {t("board.legend_scale", { scale })}
    </li>
  </ul>
);

/** How long the reason for a bite stays up, ms. */
const MISS_SHOWN_MS = 2000;

/** The last bite while it is fresh; null once it has been up for MISS_SHOWN_MS. */
const useFreshMiss = (miss: ChangesMiss | null) => {
  const [gone, setGone] = useState<ChangesMiss | null>(null);
  useEffect(() => {
    if (!miss) return undefined;
    const timer = window.setTimeout(() => setGone(miss), MISS_SHOWN_MS);
    return () => window.clearTimeout(timer);
  }, [miss]);
  return miss && miss !== gone ? miss : null;
};

/**
 * Why the fight just bit, in a line: the note and what it was against — the
 * key, the chord on beat 1 or 3, the chord let go by — and the chord's own
 * notes, what would have worked. Under the curtain it names no chord.
 */
const MissLine = ({
  miss,
  variation,
  veiled,
  t,
}: {
  miss: ChangesMiss;
  variation: ChangesVariation;
  veiled: boolean;
  t: Translate;
}) => {
  const { chord } = variation.units[miss.unit];
  const note = miss.pc === null ? "" : noteName(miss.pc, variation.key, chord);
  const veil = veiled ? "_veiled" : "";
  // 1 or 3 of the bar: the pass is whole bars from its first beat.
  const beat = ((unitSpans(variation)[miss.unit].start + (miss.beat ?? 0)) % BEATS_PER_BAR) + 1;
  const text =
    miss.reason === "outside"
      ? !veiled && !inKey(chord, variation.key)
        ? t("board.miss.outside_chord", { note, chord })
        : t("board.miss.outside", { note })
      : miss.reason === "strongBeat"
        ? t(`board.miss.strong${veil}`, { note, chord, beat })
        : t(`board.miss.silent${veil}`, { chord });
  const tones =
    veiled || miss.reason === "outside"
      ? null
      : chordTones(chord)
          .map((pc) => noteName(pc, variation.key, chord))
          .join(" ");
  return (
    <m.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className='text-sm font-medium text-orange-300'>
      {text}
      {tones && <span className='ml-2 font-normal tabular-nums text-zinc-400'>{tones}</span>}
    </m.p>
  );
};

/**
 * A chord's beats as marks, the strong ones taller — green or orange once
 * played on. Whatever rides over them (the playhead) comes as children.
 */
const BeatMarks = ({
  beats,
  result,
  label,
  children,
}: {
  beats: number;
  result?: (beat: number) => StrongResult;
  label?: string;
  children?: ReactNode;
}) => (
  <div className='relative' role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <div className='flex items-end gap-1'>
      {Array.from({ length: beats }, (_, beat) => (
        <span
          key={beat}
          className={cn(
            "flex-1 rounded-full transition-colors duration-fast",
            isStrong(beat) ? "h-2.5" : "h-1",
            strongClass(result?.(beat)) ?? cn("bg-current", isStrong(beat) ? "opacity-50" : "opacity-20"),
          )}
        />
      ))}
    </div>
    {children}
  </div>
);

/**
 * Where the run is in the chord being played, a line over its beats — moved
 * as the playhead moves (onPlayhead), not through React and not while nothing
 * plays. A `still` holds it that many beats in, for a picture of the board.
 */
const Playhead = ({
  start,
  beats,
  passBeats,
  still,
}: {
  start: number;
  beats: number;
  passBeats: number;
  still?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (still !== undefined) return undefined;
    const draw = () => {
      const el = ref.current;
      const beat = changesPlayhead.beat;
      if (!el) return;
      if (beat === null || beat < 0 || passBeats <= 0 || beats <= 0) {
        el.style.opacity = "0";
      } else {
        // Past the chord's end the lane is a frame from moving on: wait at its end.
        const into = wrap(wrap(beat, passBeats) - start, passBeats);
        el.style.opacity = "1";
        el.style.left = `${(Math.min(into, beats) / beats) * 100}%`;
      }
    };
    draw();
    return onPlayhead(draw);
  }, [start, beats, passBeats, still]);
  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-zinc-950",
        still === undefined && "opacity-0",
      )}
      style={still === undefined ? undefined : { left: `${(Math.min(still, beats) / beats) * 100}%` }}
      aria-hidden
    />
  );
};

interface LaneProps {
  variation: ChangesVariation;
  live: ChangesLive;
  /** The chord being played, or — before the run — the first. */
  current: number;
  started: boolean;
  veiled: boolean;
  t: Translate;
  /** A picture of the lane: the playhead held this many beats into the chord being played. */
  stillAt?: number;
}

/**
 * The chord being played and the two after it, always three, left to right.
 * The first has the run's playhead over its beats; at every change the lane
 * moves on — the next card slides into its place and a new one comes in at
 * the end — so what comes next is always where it will be played from.
 */
export const ChordLane = ({ variation, live, current, started, veiled, t, stillAt }: LaneProps) => {
  const { units } = variation;
  const spans = unitSpans(variation);
  const passBeats = spans[spans.length - 1]?.end ?? 0;
  // Keyed by the changes the run has made, so a card keeps its key from slot to slot.
  const base = live.changeTick + (started ? 0 : 1);
  const changing = started && live.beatsLeft <= 1;

  const labelOf = (slot: number) => {
    if (slot === 0) {
      if (started) return t("board.now");
      return live.beatsLeft > 0 ? t("board.first_in", { count: live.beatsLeft }) : t("board.first_chord");
    }
    if (slot === 1) return started ? t("board.next_in", { count: live.beatsLeft }) : t("board.next");
    return t("board.then");
  };

  return (
    <ol className='relative flex gap-2' aria-label={t("board.ahead")}>
      <AnimatePresence initial={false} mode='popLayout'>
        {Array.from({ length: LANE_CHORDS }, (_, slot) => {
          const unit = (current + slot) % units.length;
          const { chord, beats, quake } = units[unit];
          const now = slot === 0;
          const landed = now ? started && live.landed[unit] : slot === 1 && live.landed[unit];
          const hidden = veiled && !now;
          return (
            <m.li
              key={base + slot}
              layout='position'
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={transitions.base}
              data-slot={slot}
              className={cn(
                "min-w-0 flex-1 space-y-3 rounded-lg px-4 py-3 transition-colors duration-fast",
                now
                  ? "bg-zinc-100 text-zinc-950"
                  : slot === 1
                    ? changing
                      ? "bg-zinc-700 text-zinc-50"
                      : "bg-zinc-800/80 text-zinc-200"
                    : "bg-zinc-800/30 text-zinc-500",
              )}>
              <p className='flex items-center justify-between gap-2 text-xs tabular-nums opacity-70'>
                <span className='truncate'>{labelOf(slot)}</span>
                {landed && <Check className='h-4 w-4 shrink-0' aria-label={t("board.landed")} />}
              </p>
              <p
                className={cn(
                  "truncate font-display text-3xl font-semibold leading-none",
                  !now && quake && !hidden && "text-orange-300",
                )}>
                {hidden ? "?" : chord}
              </p>
              <BeatMarks
                beats={beats}
                result={now && started ? (beat) => live.strongBeats[strongBeatKey(unit, beat)] : undefined}
                label={now ? t("board.beats_left", { count: started ? live.beatsLeft : beats }) : undefined}>
                {now && started && <Playhead start={spans[unit].start} beats={beats} passBeats={passBeats} still={stillAt} />}
              </BeatMarks>
            </m.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
};

/**
 * What the changeling's player reads in place of a tab: the lane of chords —
 * the one being played, its beats and where the run is in them, and the two
 * after it; the last notes heard, or the combo while one is strung; and the
 * neck — the chord's notes and the scale's, the one place they are shown —
 * with where the note just played sits. Laid over the session's tab
 * (TabOverlayContext) — the rests under it only keep the clock. A curtain
 * hides the tones and the way ahead.
 */
export const ChangesBoard = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  const plan = useBossFightStore((s) => s.fight.plan);
  const live = useBossFightStore((s) => s.changesLive);
  const veiled = useBossFightStore((s) => isWebbed(s.fight) && !s.fight.outcome && !s.fight.holding);
  const comboLive = useBossFightStore((s) => s.fight.changeCombo !== null);
  const comboEnding = useComboEnding();
  const miss = useFreshMiss(live.lastMiss);
  if (plan.kind !== "changes") return null;

  const { variation } = plan;
  const { units } = variation;
  const started = live.unit !== null;
  // A unit from a pass just left behind is read on the new one's length.
  const current = (live.unit ?? 0) % units.length;
  const chord = units[current].chord;
  const position = windowFor(variation.key.tonic, live.trail);
  // The key by name while the chord is its own; over a chord from outside it, the scale is the chord's.
  const scaleName = inKey(chord, variation.key)
    ? keyLabel(variation.key, t)
    : t("board.scale_for", { chord });

  return (
    <div className='absolute inset-0 z-20 flex flex-col gap-3 overflow-hidden rounded-lg bg-zinc-900 px-5 py-4 text-left'>
      <ChordLane variation={variation} live={live} current={current} started={started} veiled={veiled} t={t} />

      <div className='relative flex min-h-9 flex-wrap items-center justify-between gap-x-6 gap-y-2'>
        <NoteTrail
          trail={live.trail}
          variation={variation}
          t={t}
          className={comboLive || comboEnding ? "invisible" : undefined}
        />
        {/* A bite's reason takes the legend's place while it is fresh. */}
        <div className='ml-auto' aria-live='polite'>
          {miss ? (
            <MissLine key={miss.tick} miss={miss} variation={variation} veiled={veiled} t={t} />
          ) : (
            !veiled && <Legend chord={chord} scale={scaleName} t={t} />
          )}
        </div>
        <ComboHud ending={comboEnding} t={t} className='absolute inset-y-0 left-0 z-10' />
      </div>

      <div className='flex min-h-0 flex-1 items-center justify-center'>
        {veiled ? (
          <p className='text-center text-sm font-medium text-zinc-400'>{t("arena.webbed")}</p>
        ) : (
          <ChangesFretboard
            chord={chord}
            scale={chordScale(chord, variation.key)}
            musicKey={variation.key}
            start={position}
            guideTones={plan.weakSpots}
            played={live.lastNote}
            label={t("board.fretboard", { chord })}
          />
        )}
      </div>
    </div>
  );
};
