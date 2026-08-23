import type { SequenceRepeatRiddleConfig,TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

const BEATS_PER_MEASURE = 4;

export const generateRiddle = (config: SequenceRepeatRiddleConfig): TablatureMeasure[] => {
  const { noteCount, difficulty, range } = config;

  // Default ranges if not specified
  const minFret = range?.minFret ?? 0;
  const maxFret = range?.maxFret ?? 12;
  const validStrings = range?.strings ?? [1, 2, 3, 4, 5, 6]; // 1 = High E

  // Helper to get random item
  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const validNotes: { string: number, fret: number }[] = [];

  // Generate pool of valid notes
  validStrings.forEach(str => {
    for (let f = minFret; f <= maxFret; f++) {
      validNotes.push({ string: str, fret: f });
    }
  });

  const generatedNotes: { string: number, fret: number }[] = [];

  // Difficulty Logic
  if (difficulty === 'easy') {
    // Easy: Random notes from the pool, but stick to one or two adjacent strings for simplicity if possible
    // For now, just purely random from the allowed set is fine for "Easy" if the config restricts usage (e.g. only string 1)
    for (let i = 0; i < noteCount; i++) {
      generatedNotes.push(getRandom(validNotes));
    }
  } else if (difficulty === 'medium') {
    // Medium: Try to create simple intervals, maybe stick to a scale? 
    // For this MVP, we will ensure notes aren't too far apart (physically)
    let prevNote = getRandom(validNotes);
    generatedNotes.push(prevNote);

    for (let i = 1; i < noteCount; i++) {
      // Find notes close to the previous one
      const closeNotes = validNotes.filter(n =>
        Math.abs(n.string - prevNote.string) <= 1 &&
        Math.abs(n.fret - prevNote.fret) <= 3
      );

      const nextNote = closeNotes.length > 0 ? getRandom(closeNotes) : getRandom(validNotes);
      generatedNotes.push(nextNote);
      prevNote = nextNote;
    }

  } else {
    // Hard: Anything goes, larger jumps allowed
    for (let i = 0; i < noteCount; i++) {
      generatedNotes.push(getRandom(validNotes));
    }
  }


  // Construct TablatureMeasure
  // mapping notes to beats. 
  // For riddles, we usually want them to be played sequentially, e.g. quarter notes
  const beats = generatedNotes.map(note => ({
    notes: [{
      string: note.string,
      fret: note.fret
    }],
    duration: 1 // Quarter note
  }));

  // Group into measures of 4/4 (4 beats per measure)
  const measures: TablatureMeasure[] = [];
  for (let i = 0; i < beats.length; i += BEATS_PER_MEASURE) {
    measures.push({
      beats: beats.slice(i, i + BEATS_PER_MEASURE),
      timeSignature: [4, 4]
    });
  }

  // The phrase ends on a whole bar padded with rests, not followed by a whole
  // silent one. A riddle plays a single pass and then stops itself, and the
  // answer matcher only arms once playback is silent (see useSessionAudio's
  // autoStopAfterFirstLoop and useRiddleSequenceMatcher) — so a trailing empty
  // bar was four beats of dead air in which the player's answer went unheard.
  const lastMeasure = measures[measures.length - 1];
  while (lastMeasure && lastMeasure.beats.length < BEATS_PER_MEASURE) {
    lastMeasure.beats.push({ notes: [], duration: 1 });
  }

  return measures;
};
