import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/** A note that slides to the next one on its string, which is picked on arrival. */
const slide = (string: number, fret: number) => note(string, fret, { slideOut: 1 });

export const slidesOneStringExercise: Exercise = {
  id: "slides_one_string",
  addedAt: "2026-11-13",
  title: "Slides — One String",
  description:
    "Slide between two notes on a single string, first a whole step apart, then further, landing each slide on the beat.",
  whyItMatters:
    "A slide joins two notes into one gesture, and it is also how you change position without the listener hearing a gap. The hard part is the landing: stopping exactly on the target fret, in time, with the note still sounding.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Pick the first note, keep the finger pressed down and glide along the string to the next fret shown.",
    "Pick again as you arrive, so the target note lands exactly on its beat.",
    "Bars 1–2 use the ring finger on the G string, bar 3 moves to the B string.",
    "Bar 4 mixes short and long slides — keep the pressure the same for both.",
  ],
  tips: [
    "Press just hard enough to keep the note alive; too much pressure makes the slide jerky.",
    "Look at the fret you are sliding to before you leave.",
    "Let the thumb travel with the hand instead of staying anchored behind the neck.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["articulation", "phrasing"],
  tablature: [
    bar([
      beat(1, slide(3, 5)),
      beat(1, slide(3, 7)),
      beat(1, slide(3, 5)),
      beat(1, note(3, 7)),
    ]),
    bar([
      beat(1, slide(3, 5)),
      beat(1, slide(3, 9)),
      beat(1, slide(3, 5)),
      beat(1, note(3, 9)),
    ]),
    bar([
      beat(1, slide(2, 5)),
      beat(1, slide(2, 8)),
      beat(1, slide(2, 5)),
      beat(1, note(2, 8)),
    ]),
    bar([
      beat(0.5, slide(3, 7)),
      beat(0.5, slide(3, 9)),
      beat(0.5, slide(3, 7)),
      beat(0.5, note(3, 9)),
      beat(1, slide(3, 7)),
      beat(1, note(3, 12)),
    ]),
  ],
};

export const slidesLinkingBoxesExercise: Exercise = {
  id: "slides_linking_pentatonic_boxes",
  addedAt: "2026-11-13",
  title: "Slides — Linking Pentatonic Boxes",
  description:
    "Run the A minor pentatonic through boxes 1 and 2, using a slide on one string to cross from one position to the other.",
  whyItMatters:
    "Players get stuck in box 1 because they have no way out of it. A single slide on the G or A string is the simplest exit: it moves your whole hand into the next box mid-phrase, and it sounds like a choice rather than a jump.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Start in box 1 (frets 5–8) with one finger per fret.",
    "At each slide, move the whole hand up or down with the sliding finger — you arrive already in the next box.",
    "Pick the note you land on, then carry on in the new position.",
    "Play it in even eighth notes; the slide must not steal time from the notes around it.",
  ],
  tips: [
    "Slide with the ring finger going up and the index finger coming down.",
    "Say the box number out loud as you change — it helps the positions stick.",
    "Once it is comfortable, improvise a phrase that uses the same slide to change box.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["articulation", "scales", "phrasing"],
  tablature: [
    bar([
      beat(0.5, note(5, 5)),
      beat(0.5, note(5, 7)),
      beat(0.5, note(4, 5)),
      beat(0.5, note(4, 7)),
      beat(0.5, note(3, 5)),
      beat(0.5, slide(3, 7)),
      beat(0.5, note(3, 9)),
      beat(0.5, note(2, 8)),
    ]),
    bar([
      beat(0.5, note(2, 10)),
      beat(0.5, note(1, 8)),
      beat(0.5, note(1, 10)),
      beat(0.5, note(1, 8)),
      beat(0.5, note(2, 10)),
      beat(0.5, note(2, 8)),
      beat(0.5, slide(3, 9)),
      beat(0.5, note(3, 7)),
    ]),
    bar([
      beat(0.5, note(4, 7)),
      beat(0.5, note(4, 5)),
      beat(0.5, slide(5, 7)),
      beat(0.5, note(5, 10)),
      beat(0.5, note(4, 7)),
      beat(0.5, note(4, 10)),
      beat(0.5, note(3, 7)),
      beat(0.5, note(3, 9)),
    ]),
    bar([
      beat(0.5, note(2, 8)),
      beat(0.5, note(2, 10)),
      beat(0.5, slide(3, 9)),
      beat(0.5, note(3, 7)),
      beat(0.5, note(4, 5)),
      beat(0.5, note(5, 7)),
      beat(1, note(4, 7)),
    ]),
  ],
};

/** A note approached by a short slide from a fret or two below. */
const slideInto = (string: number, fret: number) => note(string, fret, { slideIn: 1 });

export const slidesIntoNotesExercise: Exercise = {
  id: "slides_into_the_note",
  addedAt: "2026-11-13",
  title: "Slides — Sliding Into Notes",
  description:
    "A simple A minor melody where the important notes are approached with a quick slide from below instead of being fretted straight on.",
  whyItMatters:
    "Sliding into a note is the cheapest way to make a phrase sound like a voice instead of a keyboard. It is an ornament, not a rhythm: the slide happens just before the beat and the target note still lands on time.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "For each marked note, start one or two frets below it and slide up as you pick.",
    "The slide is fast and has no length of its own — the note you arrive on is the one that falls on the beat.",
    "Play the unmarked notes plainly, so you can hear the difference.",
    "Hold the long notes for their full two beats.",
  ],
  tips: [
    "Start the slide slightly early rather than letting the target note arrive late.",
    "Where you start matters less than where you stop. Aim at the target fret.",
    "Add a little vibrato once you land on the long notes.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 70 },
  relatedSkills: ["articulation", "phrasing"],
  tablature: [
    bar([beat(1, slideInto(3, 7)), beat(1, note(3, 5)), beat(2, slideInto(3, 7))]),
    bar([beat(1, slideInto(2, 8)), beat(1, note(2, 5)), beat(2, slideInto(2, 8))]),
    bar([
      beat(1, slideInto(3, 9)),
      beat(1, note(2, 8)),
      beat(1, slideInto(2, 10)),
      beat(1, note(2, 8)),
    ]),
    bar([beat(1, slideInto(3, 7)), beat(1, note(3, 5)), beat(2, slideInto(4, 7))]),
  ],
};
