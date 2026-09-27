import { heldChord } from "feature/exercisePlan/data/exerises/gMajorInversions/gMajorInversions";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Gm — root position, open (3-1-0-0-3-3)
const openShape = heldChord("Gm", [
  { string: 6, fret: 3 },
  { string: 5, fret: 1 },
  { string: 4, fret: 0 },
  { string: 3, fret: 0 },
  { string: 2, fret: 3 },
  { string: 1, fret: 3 },
]);
// Gm — Em-shape barre (3-5-5-3-3-3)
const barreShape = heldChord("Gm", [
  { string: 6, fret: 3 },
  { string: 5, fret: 5 },
  { string: 4, fret: 5 },
  { string: 3, fret: 3 },
  { string: 2, fret: 3 },
  { string: 1, fret: 3 },
]);
// Gm — Dm-shape on the top four strings (x-x-5-7-8-6)
const dShape = heldChord("Gm", [
  { string: 4, fret: 5 },
  { string: 3, fret: 7 },
  { string: 2, fret: 8 },
  { string: 1, fret: 6 },
]);
// Gm — Am-shape barre (x-10-12-12-11-10)
const aShape = heldChord("Gm", [
  { string: 5, fret: 10 },
  { string: 4, fret: 12 },
  { string: 3, fret: 12 },
  { string: 2, fret: 11 },
  { string: 1, fret: 10 },
]);

export const gMinorInversionsExercise: Exercise = {
  id: "g_minor_inversions",
  title: "Chords — Minor Position",
  description:
    "Walk one G minor chord up the neck through four voicings — open, barre, Dm-shape and Am-shape — then back down the same way, holding each for two bars.",
  whyItMatters:
    "The same three notes (G, B♭, D) can be stacked in many ways across the neck. Knowing several voicings of one minor chord lets you pick the shape closest to your hand, build smoother progressions and hear how the order of the notes changes the colour of a chord.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Strike each chord once on beat 1 and let it ring for the full two bars.",
    "Up the neck: open Gm → Gm barre (Em-shape) at the 3rd fret → Dm-shape on the top four strings at the 5th–8th fret → Am-shape barre at the 10th fret.",
    "Then come back down through the same shapes: Dm-shape → barre → and loop to the open Gm.",
    "Use the ringing bar to prepare the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Find the G notes inside every shape first — they anchor each voicing on the neck.",
    "Play the major version right after and listen to how only the third (B vs B♭) changes.",
    "Mute unused strings with the side of your fretting fingers so only the written strings ring.",
    "Once it feels easy, find the same four voicings for A and D minor.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [...openShape, ...barreShape, ...dShape, ...aShape, ...dShape, ...barreShape],
};
