import { TablatureMeasure, ExerciseRiddleConfig } from "feature/exercisePlan/types/exercise.types";

export const generateRiddle = (config: ExerciseRiddleConfig): TablatureMeasure[] => {
  const { noteCount, difficulty, range } = config;

  // Default ranges if not specified
  const minFret = range?.minFret ?? 0;
  const maxFret = range?.maxFret ?? 12;
  const validStrings = range?.strings ?? [1, 2, 3, 4, 5, 6]; // 1 = High E

  // Helper to get random item
  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

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
    for (let i = 0; i < config.noteCount; i++) {
      generatedNotes.push(getRandom(validNotes));
    }
  } else if (difficulty === 'medium') {
    // Medium: Try to create simple intervals, maybe stick to a scale? 
    // For this MVP, we will ensure notes aren't too far apart (physically)
    let prevNote = getRandom(validNotes);
    generatedNotes.push(prevNote);

    for (let i = 1; i < config.noteCount; i++) {
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
    for (let i = 0; i < config.noteCount; i++) {
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
  // For Ear Training: Always Add a 4-beat REST measure after the notes to give user time to think/answer
  const measures: TablatureMeasure[] = [];
  let currentBeats = [];

  for (let i = 0; i < beats.length; i++) {
    currentBeats.push(beats[i]);
    if (currentBeats.length === 4 || i === beats.length - 1) {
      measures.push({
        beats: currentBeats,
        timeSignature: [4, 4]
      });
      currentBeats = [];
    }
  }

  // FORCE: Add a full rest measure at the end for spacing/count-in effect
  measures.push({
    beats: Array(4).fill({ notes: [], duration: 1 }), // 4 beats of silence
    timeSignature: [4, 4]
  });

  return measures;
};
