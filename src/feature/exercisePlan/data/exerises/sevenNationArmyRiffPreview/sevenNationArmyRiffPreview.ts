import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Imported from Guitar Pro via the Tab Editor — the riff's five notes
// (fret 7-7-10-7-5, then 3-2) are all on the A string (string 5), not the
// low E string despite how it sounds on the record (that's a pitch-shift
// pedal, not a different string). Two full repeats of the two-bar riff.
export const sevenNationArmyRiffPreviewExercise: Exercise = {
  id: "seven_nation_army_riff_preview",
  addedAt: "2026-08-06",
  title: "Riff Vault — Seven Nation Army",
  description: "The song's iconic four-note riff, all on the A string.",
  whyItMatters:
    "One string, one repeating shape — the syncopated pickup and the held notes are what make it instantly recognizable, not the fretting.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2,
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
      beats: [
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 1.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 10,
              midiNote: 43,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
        {
          notes: [],
          duration: 0.25,
        },
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.25,
        },
        {
          notes: [],
          duration: 0.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 5,
              midiNote: 38,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
      ],
      timeSignature: [4, 4],
      tempoChange: 1,
    },
    {
      beats: [
        {
          notes: [
            {
              string: 5,
              fret: 3,
              midiNote: 36,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 2,
        },
        {
          notes: [
            {
              string: 5,
              fret: 2,
              midiNote: 35,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 1,
        },
        {
          notes: [],
          duration: 1,
        },
      ],
      timeSignature: [4, 4],
    },
    {
      beats: [
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 1.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 10,
              midiNote: 43,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
        {
          notes: [],
          duration: 0.25,
        },
        {
          notes: [
            {
              string: 5,
              fret: 7,
              midiNote: 40,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.25,
        },
        {
          notes: [],
          duration: 0.5,
        },
        {
          notes: [
            {
              string: 5,
              fret: 5,
              midiNote: 38,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 0.5,
        },
      ],
      timeSignature: [4, 4],
    },
    {
      beats: [
        {
          notes: [
            {
              string: 5,
              fret: 3,
              midiNote: 36,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 2,
        },
        {
          notes: [
            {
              string: 5,
              fret: 2,
              midiNote: 35,
              dynamics: 0.8,
              isGhost: false,
              isLetRing: false,
              isStaccato: false,
              harmonicType: 0,
              slideIn: 0,
              slideOut: 0,
            },
          ],
          duration: 1,
        },
        {
          notes: [],
          duration: 1,
        },
      ],
      timeSignature: [4, 4],
    },
  ],
};
