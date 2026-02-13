import type { TablatureBeat, TablatureMeasure } from '../types/exercise.types';
import type { FretPosition } from './fretboardMapper';

export type PatternType =
  | 'ascending'
  | 'descending'
  | 'ascending_descending'
  | 'sequence_3_notes'
  | 'sequence_4_notes'
  | 'intervals_thirds'
  | 'intervals_fourths';

export interface PatternGeneratorOptions {
  patternType: PatternType;
  positions: FretPosition[];
  noteDuration: number; // 0.25 = 16th, 0.5 = 8th, 1 = quarter
  beatsPerMeasure?: number;
}

/**
 * Generate ascending pattern
 */
function generateAscending(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  return positions.map(pos => ({
    duration: noteDuration,
    notes: [{ string: pos.string, fret: pos.fret }]
  }));
}

/**
 * Generate descending pattern
 */
function generateDescending(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  return [...positions].reverse().map(pos => ({
    duration: noteDuration,
    notes: [{ string: pos.string, fret: pos.fret }]
  }));
}

/**
 * Generate ascending then descending
 */
function generateAscendingDescending(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const ascending = generateAscending(positions, noteDuration);
  const descending = generateDescending(positions, noteDuration);
  return [...ascending, ...descending];
}

/**
 * Generate 3-note sequence pattern (1-2-3, 2-3-4, 3-4-5, etc.)
 */
function generateSequence3(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];

  for (let i = 0; i < positions.length - 2; i++) {
    // Play 3 notes starting from position i
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i].string, fret: positions[i].fret }]
    });
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i + 1].string, fret: positions[i + 1].fret }]
    });
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i + 2].string, fret: positions[i + 2].fret }]
    });
  }

  return beats;
}

/**
 * Generate 4-note sequence pattern (1-2-3-4, 2-3-4-5, etc.)
 */
function generateSequence4(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];

  for (let i = 0; i < positions.length - 3; i++) {
    for (let j = 0; j < 4; j++) {
      beats.push({
        duration: noteDuration,
        notes: [{ string: positions[i + j].string, fret: positions[i + j].fret }]
      });
    }
  }

  return beats;
}

/**
 * Generate thirds interval pattern (1-3, 2-4, 3-5, etc.)
 */
function generateIntervalThirds(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];

  for (let i = 0; i < positions.length - 2; i++) {
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i].string, fret: positions[i].fret }]
    });
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i + 2].string, fret: positions[i + 2].fret }]
    });
  }

  return beats;
}

/**
 * Generate fourths interval pattern (1-4, 2-5, 3-6, etc.)
 */
function generateIntervalFourths(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];

  for (let i = 0; i < positions.length - 3; i++) {
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i].string, fret: positions[i].fret }]
    });
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i + 3].string, fret: positions[i + 3].fret }]
    });
  }

  return beats;
}

/**
 * Split beats into measures
 */
function splitIntoMeasures(
  beats: TablatureBeat[],
  beatsPerMeasure: number = 4,
  timeSignature: [number, number] = [4, 4]
): TablatureMeasure[] {
  const measures: TablatureMeasure[] = [];
  let currentBeats: TablatureBeat[] = [];
  let currentDuration = 0;

  for (const beat of beats) {
    currentBeats.push(beat);
    currentDuration += beat.duration;

    if (currentDuration >= beatsPerMeasure) {
      measures.push({
        timeSignature,
        beats: currentBeats
      });
      currentBeats = [];
      currentDuration = 0;
    }
  }

  // Add remaining beats as final measure
  if (currentBeats.length > 0) {
    measures.push({
      timeSignature,
      beats: currentBeats
    });
  }

  return measures;
}

/**
 * Main pattern generator function
 */
export function generatePattern(options: PatternGeneratorOptions): TablatureMeasure[] {
  const { patternType, positions, noteDuration, beatsPerMeasure = 4 } = options;

  let beats: TablatureBeat[] = [];

  switch (patternType) {
    case 'ascending':
      beats = generateAscending(positions, noteDuration);
      break;
    case 'descending':
      beats = generateDescending(positions, noteDuration);
      break;
    case 'ascending_descending':
      beats = generateAscendingDescending(positions, noteDuration);
      break;
    case 'sequence_3_notes':
      beats = generateSequence3(positions, noteDuration);
      break;
    case 'sequence_4_notes':
      beats = generateSequence4(positions, noteDuration);
      break;
    case 'intervals_thirds':
      beats = generateIntervalThirds(positions, noteDuration);
      break;
    case 'intervals_fourths':
      beats = generateIntervalFourths(positions, noteDuration);
      break;
  }

  return splitIntoMeasures(beats, beatsPerMeasure);
}

/**
 * Get pattern display name
 */
export function getPatternName(patternType: PatternType): string {
  const names: Record<PatternType, string> = {
    ascending: 'Ascending',
    descending: 'Descending',
    ascending_descending: 'Up & Down',
    sequence_3_notes: '3-Note Sequence (1-2-3, 2-3-4...)',
    sequence_4_notes: '4-Note Sequence (1-2-3-4, 2-3-4-5...)',
    intervals_thirds: 'Thirds',
    intervals_fourths: 'Fourths'
  };
  return names[patternType];
}
