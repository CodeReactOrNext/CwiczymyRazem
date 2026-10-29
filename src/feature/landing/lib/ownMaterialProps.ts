import { generateAutoBacking } from "feature/autoBacking/generateAutoBacking";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import {
  OWN_MATERIAL_SHOWCASE_BARS,
  OWN_MATERIAL_SHOWCASE_EXERCISE,
} from "feature/landing/data/ownMaterial";

export interface ShowcaseBeat {
  /** Quarter notes. */
  duration: number;
  /** 1 = high e … 6 = low E, as the tab draws them. */
  notes: { string: number; fret: number }[];
}

export interface ShowcaseBar {
  beats: ShowcaseBeat[];
  /** The chord the generated backing plays under this bar. */
  chord: string;
}

export interface OwnMaterialShowcase {
  exerciseTitle: string;
  bpm: number;
  bars: ShowcaseBar[];
  /** "G major", or null when the notes never settle on a key. */
  key: string | null;
  /** The whole loop's chords, in order. */
  progression: string[];
  groove: string;
  /** The parts the backing plays, in the order the band lists them. */
  parts: string[];
}

export interface OwnMaterialPageProps {
  showcase: OwnMaterialShowcase;
}

const PART_NAMES: Record<string, string> = {
  "auto-drums": "Drums",
  "auto-bass": "Bass",
  "auto-keys": "Keys",
  "auto-arp": "Arpeggio",
};

/** "minorPentatonic" → "minor pentatonic". */
const scaleName = (scale: string) =>
  scale.replace(/([A-Z])/g, " $1").toLowerCase();

/**
 * The hero's example, computed by the same code that writes a backing in a
 * practice session: the exercise's tab goes through `generateAutoBacking` at
 * build time, and the key, chords and parts it picks are what the page shows.
 * Nothing about the harmony is typed in by hand.
 */
export const buildOwnMaterialProps = (): OwnMaterialPageProps => {
  const exercise = exercisesAgregat.find(
    (entry) => entry.id === OWN_MATERIAL_SHOWCASE_EXERCISE,
  );
  if (!exercise?.tablature?.length) {
    throw new Error(
      `Own material landing: "${OWN_MATERIAL_SHOWCASE_EXERCISE}" has no tab`,
    );
  }
  const bpm = exercise.metronomeSpeed?.recommended ?? 90;
  const backing = generateAutoBacking({
    measures: exercise.tablature,
    bpm,
    title: exercise.title,
    description: exercise.description,
    seed: exercise.id,
  });
  if (!backing) {
    throw new Error(
      `Own material landing: no backing generated for "${OWN_MATERIAL_SHOWCASE_EXERCISE}"`,
    );
  }
  const { summary, tracks } = backing;

  // One chord per bar holds when the harmony loop is as long as the tab and
  // changes once a bar — true for this exercise, checked here so a change in
  // the harmoniser fails the build instead of mislabelling the bars.
  if (
    summary.bars !== exercise.tablature.length ||
    summary.chords.length !== summary.bars
  ) {
    throw new Error(
      `Own material landing: expected one chord per bar, got ${summary.chords.length} over ${summary.bars} bars`,
    );
  }

  return {
    showcase: {
      exerciseTitle: exercise.title,
      bpm,
      bars: exercise.tablature
        .slice(0, OWN_MATERIAL_SHOWCASE_BARS)
        .map((measure, index) => ({
          beats: measure.beats.map((beat) => ({
            duration: beat.duration,
            notes: beat.notes.map((note) => ({
              string: note.string,
              fret: note.fret,
            })),
          })),
          chord: summary.chords[index],
        })),
      key: summary.key
        ? [summary.key.tonic, summary.key.scale && scaleName(summary.key.scale)]
            .filter(Boolean)
            .join(" ")
        : null,
      progression: summary.chords,
      groove: summary.groove,
      parts: tracks.map((track) => PART_NAMES[track.id] ?? track.name),
    },
  };
};
