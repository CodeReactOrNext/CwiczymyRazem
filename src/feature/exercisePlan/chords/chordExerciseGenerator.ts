import type { Exercise, TablatureMeasure, TablatureBeat, TablatureNote } from '../types/exercise.types';
import { commonChords, beginnerChords, intermediateChords, advancedChords, type ChordDefinition } from './chordDefinitions';

export interface ChordExerciseConfig {
  chords: string[]; // ['G', 'C', 'D']
  changesPerMeasure: number; // 1 = every bar, 2 = every 2 beats, 4 = every beat
  beatsPerMeasure: number;
  measures: number;
  includeNotes: boolean;
  tempo: {
    min: number;
    max: number;
    recommended: number;
  };
}

/**
 * Generate a complete chord exercise based on configuration
 */
export function generateChordExercise(config: ChordExerciseConfig): Exercise {
  const {
    chords,
    changesPerMeasure,
    beatsPerMeasure = 4,
    measures = 4,
    includeNotes = false,
    tempo
  } = config;

  const tablature: TablatureMeasure[] = [];

  for (let m = 0; m < measures; m++) {
    const beats: TablatureBeat[] = [];
    const beatsPerChange = beatsPerMeasure / changesPerMeasure;

    for (let b = 0; b < beatsPerMeasure; b++) {
      const isChangeBeat = b % beatsPerChange === 0;
      const chordIndex = (Math.floor((m * beatsPerMeasure + b) / beatsPerChange)) % chords.length;
      const currentChordName = chords[chordIndex];
      const chordDef = commonChords[currentChordName];

      const notes: TablatureNote[] = [];

      if (includeNotes && isChangeBeat && chordDef) {
        chordDef.frets.forEach((fret, stringIdx) => {
          if (fret !== null) {
            notes.push({
              string: 6 - stringIdx, // Fix: index 0 is Low E (String 6), index 5 is High E (String 1)
              fret: fret
            });
          }
        });
      }

      beats.push({
        notes,
        duration: 1, // quarter notes for now
        chordName: isChangeBeat ? currentChordName : undefined
      });
    }

    tablature.push({
      beats,
      timeSignature: [beatsPerMeasure, 4]
    });
  }

  const title = `Chord Changes: ${chords.join(' - ')}`;
  const description = `Practice transitioning between ${chords.join(', ')} with the metronome.`;

  const instructions = [
    `Set your target tempo and prepare to change chords.`,
    `Focus on the transition — move your fingers to the next shape early if needed.`,
    `Ensure every note in the chord rings clearly.`,
    `Keep your strumming hand moving consistently.`,
    `Try to look at the fretboard less as you get comfortable.`
  ];

  if (!includeNotes) {
    instructions.push(`The tablature shows only chord names to help you focus on memory and rhythm.`);
  }

  return {
    id: `chord_changes_${chords.join('_').toLowerCase()}`,
    title,
    description,
    difficulty: chords.length > 2 ? 'medium' : 'easy',
    category: 'technique',
    timeInMinutes: 10,
    instructions,
    tips: [
      `Use the 'anchor finger' technique if chords share a finger position.`,
      `Practice the difficult transitions in isolation first.`,
      `Keep your hand relaxed during changes.`,
    ],
    metronomeSpeed: tempo,
    relatedSkills: ['chords'],
    tablature
  };
}

export function getAvailableChords(): string[] {
  return Object.keys(commonChords);
}

export function getCategorizedChords() {
  return {
    beginner: beginnerChords,
    intermediate: intermediateChords,
    advanced: advancedChords
  };
}
