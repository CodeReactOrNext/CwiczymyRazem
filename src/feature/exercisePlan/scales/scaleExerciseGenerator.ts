import type { Exercise } from '../types/exercise.types';
import { scaleDefinitions, type ScaleType, rootNotes } from './scaleDefinitions';
import { getScalePatternForPosition } from './fretboardMapper';
import { generatePattern, type PatternType, getPatternName } from './patternGenerators';

export interface ScaleExerciseConfig {
  rootNote: string; // 'C', 'D', 'E', etc.
  scaleType: ScaleType;
  patternType: PatternType;
  position: number | 'all'; // 1-12 (fret position) or 'all'
  noteDuration?: number; // 0.25 = 16th, 0.5 = 8th
}

/**
 * Generate a complete scale exercise based on configuration
 */
export function generateScaleExercise(config: ScaleExerciseConfig): Exercise {
  const {
    rootNote,
    scaleType,
    patternType,
    position,
    noteDuration = 0.5 // default to eighth notes
  } = config;

  // Get scale definition
  const scaleDef = scaleDefinitions[scaleType];

  // Calculate root MIDI note
  const rootIndex = rootNotes.indexOf(rootNote);
  const rootMidi = 60 + rootIndex; // Middle C = 60

  let tablature: any[] = [];
  let title = '';
  let description = '';
  let instructions: string[] = [];
  let positionsToPractice: number[] = [];

  if (position === 'all') {
    // For 'all', we practice main positions across the fretboard
    positionsToPractice = [1, 3, 5, 7, 8, 10, 12];
    title = `${rootNote} ${scaleDef.name} - All Positions`;
    description = `Master the entire fretboard with ${rootNote} ${scaleDef.name} across all main positions.`;

    // Generate patterns for each position and concatenate
    positionsToPractice.forEach((pos, index) => {
      const fretPositions = getScalePatternForPosition(rootMidi, scaleDef.intervals, pos);
      const posTab = generatePattern({
        patternType,
        positions: fretPositions,
        noteDuration,
        beatsPerMeasure: 4
      });
      tablature = [...tablature, ...posTab];
    });

    instructions = [
      `Practice ${rootNote} ${scaleDef.name} scale across the ENTIRE fretboard.`,
      `You will move through 7 different positions: ${positionsToPractice.join(', ')}.`,
      `Pattern: ${getPatternName(patternType)}`,
      `Focus on the shift between positions. Use the common notes to transition smoothly.`,
      `Use alternate picking throughout.`,
      `This is a marathon exercise - focus on consistency over speed.`
    ];
  } else {
    // Single position logic
    const fretPositions = getScalePatternForPosition(rootMidi, scaleDef.intervals, position);
    tablature = generatePattern({
      patternType,
      positions: fretPositions,
      noteDuration,
      beatsPerMeasure: 4
    });

    const patternName = getPatternName(patternType);
    title = `${rootNote} ${scaleDef.name} - ${patternName}`;
    description = `Practice ${rootNote} ${scaleDef.name} in position ${position} using ${patternName.toLowerCase()} pattern.`;

    instructions = [
      `Play ${rootNote} ${scaleDef.name} scale in position ${position} (starting around fret ${position}).`,
      `Pattern: ${patternName}`,
      `Use alternate picking throughout (down-up-down-up).`,
      `Keep your hand in position - minimize unnecessary movement.`,
      `Focus on clean notes - every note should ring clearly.`,
      `Start slow and gradually increase tempo as you get comfortable.`
    ];
  }

  // Determine difficulty based on pattern and scope
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (position === 'all') {
    difficulty = 'hard';
  } else if (patternType === 'ascending' || patternType === 'descending') {
    difficulty = 'easy';
  } else if (patternType.startsWith('intervals_')) {
    difficulty = 'hard';
  }

  // Generate tips
  const tips = [
    `${scaleDef.description}`,
    position === 'all'
      ? `Moving across positions helps you understand how the scale is mapped globally.`
      : `Position ${position} spans frets ${position}-${position + 4}.`,
    `Keep your thumb behind the neck for better reach.`,
    `Practice with a metronome to build consistent timing.`,
    `Visualize the scale pattern before you play it.`,
    `Listen to how each note sounds - develop your ear.`
  ];

  // Determine tempo based on note duration and pattern
  const baseMin = noteDuration <= 0.25 ? 50 : 70;
  const baseMax = noteDuration <= 0.25 ? 100 : 140;
  const baseRec = noteDuration <= 0.25 ? 70 : 100;

  return {
    id: `scale_${rootNote.toLowerCase()}_${scaleType}_${patternType}_pos${position}`,
    title,
    description,
    difficulty,
    category: 'theory',
    timeInMinutes: position === 'all' ? 20 : 10,
    instructions,
    tips,
    metronomeSpeed: {
      min: baseMin,
      max: baseMax,
      recommended: baseRec
    },
    relatedSkills: ['scales'],
    tablature
  };
}

/**
 * Get available root notes
 */
export function getAvailableRootNotes(): string[] {
  return rootNotes;
}

/**
 * Get available scale types with descriptions
 */
export function getAvailableScales(): Array<{ value: ScaleType; label: string; description: string }> {
  return Object.entries(scaleDefinitions).map(([key, def]) => ({
    value: key as ScaleType,
    label: def.name,
    description: def.description
  }));
}

/**
 * Get available pattern types
 */
export function getAvailablePatterns(): Array<{ value: PatternType; label: string }> {
  const patterns: PatternType[] = [
    'ascending',
    'descending',
    'ascending_descending',
    'sequence_3_notes',
    'sequence_4_notes'
  ];

  return patterns.map(p => ({
    value: p,
    label: getPatternName(p)
  }));
}

/**
 * Get available positions
 */
export function getAvailablePositions(): Array<number | 'all'> {
  return ['all', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}
