import type { PitchClass } from "feature/autoBacking/theory";
import { m } from "framer-motion";

import type { ChangesVariation } from "../types/boss.types";
import type { FretSpot } from "../utils/changesFretboard";
import { inWindow, NECK_FRETS, OPEN_MIDI, pcAt, spotsOf, WINDOW_FRETS } from "../utils/changesFretboard";
import type { NoteRole } from "../utils/changesHarmony";
import { chordTones, isGuideTone, noteName, toneRole } from "../utils/changesHarmony";
import type { PlayedNote } from "../utils/changesLive";

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"] as const;
const NUT_X = 48;
const FRET_W = 50;
const STRING_Y0 = 16;
const STRING_GAP = 19;
const BOTTOM = STRING_Y0 + STRING_GAP * 5;
const HEIGHT = BOTTOM + 26;
const WIDTH = NUT_X + NECK_FRETS * FRET_W + 8;
/** Fret numbers instead of inlay dots — dots would read as notes. */
const NUMBERED = [3, 5, 7, 9, 12] as const;

const fretX = (fret: number) => (fret === 0 ? NUT_X - 20 : NUT_X + (fret - 0.5) * FRET_W);
const stringY = (string: number) => STRING_Y0 + string * STRING_GAP;

const isTone = (role: NoteRole) => role !== "passing" && role !== "outside";

/** What a played note was, as a colour: a chord tone, a note of the scale, a wrong one. */
const playedStroke = (played: PlayedNote) =>
  played.verdict === "miss" ? "#fb923c" : isTone(played.role) ? "#34d399" : "#d4d4d8";

interface ChangesFretboardProps {
  chord: string;
  /** The key's scale with every chord's tones — the notes to play between the strong beats. */
  scale: ReadonlySet<PitchClass>;
  /** The key the note names are spelled in. */
  musicKey: ChangesVariation["key"];
  /** First fret of the position the player is shown (see windowFor). */
  start: number;
  /** Thirds and sevenths in the weak-spot colour. */
  guideTones: boolean;
  /** The note just played: a ring flashes where it sits — in the position, if it can be played there. */
  played: PlayedNote | null;
  label: string;
}

/**
 * The neck, read like a tab (high e on top), with one position lit — where
 * to play now, following the player's hand. In it the chord's notes, big,
 * and the rest of the scale, small, all by name; outside it the chord's notes
 * are only hinted at. The one place the board shows what to play.
 */
export const ChangesFretboard = ({
  chord,
  scale,
  musicKey,
  start,
  guideTones,
  played,
  label,
}: ChangesFretboardProps) => {
  const tones = chordTones(chord);
  const end = Math.min(NECK_FRETS, start + WINDOW_FRETS - 1);

  const spots: FretSpot[] = OPEN_MIDI.flatMap((_, string) =>
    Array.from({ length: NECK_FRETS + 1 }, (__, fret) => ({ string, fret })),
  );
  const inside = (spot: FretSpot) => inWindow(spot.fret, start);
  const flashSpots = played ? spotsOf(played.midi) : [];
  const flashes = flashSpots.some(inside) ? flashSpots.filter(inside) : flashSpots;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className='h-full max-h-40 w-full'
      preserveAspectRatio='xMidYMid meet'
      role='img'
      aria-label={label}>
      {/* The position to play in. */}
      <rect
        x={start === 0 ? NUT_X - 38 : NUT_X + (start - 1) * FRET_W + 2}
        y={STRING_Y0 - 12}
        width={(start === 0 ? 38 : 0) + (end - Math.max(start, 1) + 1) * FRET_W - 4}
        height={BOTTOM - STRING_Y0 + 24}
        rx={10}
        fill='#27272a'
      />

      {Array.from({ length: NECK_FRETS + 1 }, (_, fret) => (
        <line
          key={fret}
          x1={NUT_X + fret * FRET_W}
          x2={NUT_X + fret * FRET_W}
          y1={STRING_Y0}
          y2={BOTTOM}
          stroke={fret === 0 ? "#71717a" : "#3f3f46"}
          strokeWidth={fret === 0 ? 4 : 1.5}
        />
      ))}
      {STRING_NAMES.map((name, string) => (
        <g key={name + string}>
          <line
            x1={NUT_X - 32}
            x2={WIDTH - 8}
            y1={stringY(string)}
            y2={stringY(string)}
            stroke='#52525b'
            strokeWidth={1 + string * 0.3}
          />
          <text x={6} y={stringY(string) + 3.5} fontSize={10} fill='#71717a'>
            {name}
          </text>
        </g>
      ))}
      {NUMBERED.map((fret) => (
        <text
          key={fret}
          x={fretX(fret)}
          y={BOTTOM + 20}
          textAnchor='middle'
          fontSize={10}
          fill={inWindow(fret, start) ? "#d4d4d8" : "#52525b"}>
          {fret}
        </text>
      ))}

      {/* Outside the position: the chord's tones, only hinted at. */}
      {spots
        .filter((spot) => !inside(spot) && tones.includes(pcAt(spot.string, spot.fret)))
        .map((spot) => (
          <circle key={`far-${spot.string}-${spot.fret}`} cx={fretX(spot.fret)} cy={stringY(spot.string)} r={4.5} fill='#52525b' />
        ))}

      {/* The rest of the scale, in the position. */}
      {spots
        .filter((spot) => {
          const pc = pcAt(spot.string, spot.fret);
          return inside(spot) && scale.has(pc) && !tones.includes(pc);
        })
        .map((spot) => {
          const cx = fretX(spot.fret);
          const cy = stringY(spot.string);
          return (
            <g key={`scale-${spot.string}-${spot.fret}`}>
              <circle cx={cx} cy={cy} r={6.5} fill='#3f3f46' />
              <text x={cx} y={cy + 2.6} textAnchor='middle' fontSize={7} fontWeight={600} fill='#a1a1aa'>
                {noteName(pcAt(spot.string, spot.fret), musicKey, chord)}
              </text>
            </g>
          );
        })}

      {/* The chord being played, in the position. */}
      {spots
        .filter((spot) => inside(spot) && tones.includes(pcAt(spot.string, spot.fret)))
        .map((spot) => {
          const pc = pcAt(spot.string, spot.fret);
          const role = toneRole(chord, pc);
          const guide = guideTones && role !== null && isGuideTone(role);
          const cx = fretX(spot.fret);
          const cy = stringY(spot.string);
          return (
            <g key={`now-${spot.string}-${spot.fret}`}>
              <circle cx={cx} cy={cy} r={9} fill={guide ? "#34d399" : role === "root" ? "#fafafa" : "#d4d4d8"} />
              <text x={cx} y={cy + 3.5} textAnchor='middle' fontSize={9.5} fontWeight={700} fill='#09090b'>
                {noteName(pc, musicKey, chord)}
              </text>
            </g>
          );
        })}

      {played &&
        flashes.map(({ string, fret }) => (
          <m.circle
            key={`${played.tick}-${string}-${fret}`}
            cx={fretX(fret)}
            cy={stringY(string)}
            fill='none'
            stroke={playedStroke(played)}
            strokeWidth={3}
            initial={{ r: 10, opacity: 1 }}
            animate={{ r: 16, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        ))}
    </svg>
  );
};
