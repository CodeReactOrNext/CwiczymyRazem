 import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Transcribed from a user-provided rhythm tab — the riff's five notes
// (fret 7-7-10-7-5, then 3-2) are all on the A string (string 5), not the
// low E string despite how it sounds on the record (that's a pitch-shift
// pedal, not a different string). Rhythm, confirmed against the owner's
// count: bar 1 opens with a dotted-quarter (twice the length of the
// sixteenth that follows it), then two more sixteenths, each preceded by a
// sixteenth rest (not an eighth rest — shorter gaps than the first pass),
// and closes on a plain quarter note, not another sixteenth. Bar 2 is just
// two half notes with no trailing rest, filling the bar evenly.
export const sevenNationArmyRiffPreviewExercise: Exercise = {
  id: "seven_nation_army_riff_preview",
  title: "Main Riff — Seven Nation Army",
  description: "The song's iconic four-note riff, all on the A string.",
  whyItMatters:
    "One string, one repeating shape — the syncopated pickup and the held notes are what make it instantly recognizable, not the fretting.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Palm-mute the other five strings so only the A string rings — that's the real skill here, not the fretting.",
    "Nail the syncopated pickup on the first two notes before worrying about speed.",
  ],
  tips: [
    "Start well under tempo and lock the held notes to a metronome before adding the muting.",
  ],
  metronomeSpeed: { min: 60, max: 140, recommended: 120 },
  relatedSkills: ["rhythm"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { notes: [{ string: 5, fret: 7 }], duration: 1.5 },
        { notes: [{ string: 5, fret: 7 }], duration: 0.25 },
        { notes: [], duration: 0.25 },
        { notes: [{ string: 5, fret: 10 }], duration: 0.25 },
        { notes: [], duration: 0.5 },
        { notes: [{ string: 5, fret: 7 }], duration: 0.25 },
        { notes: [], duration: 0.5 },
        { notes: [{ string: 5, fret: 5 }], duration: 0.25},
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { notes: [{ string: 5, fret: 3 }], duration: 2 },
        { notes: [{ string: 5, fret: 2 }], duration: 2 },
      ],
    },
  ],
};
