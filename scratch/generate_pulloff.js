const fs = require('fs');

const baseMeasure = {
  timeSignature: [4, 4],
  beats: [
    { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 3, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 4, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 5, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 4, fret: 5, isPullOff: true }] }
  ]
};

const finalMeasure = {
  timeSignature: [4, 4],
  beats: [
    { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 3, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 4, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
    { duration: 0.5, notes: [{ string: 5, fret: 5, isPullOff: true }] },
    { duration: 1, notes: [] }
  ]
};

// 14 standard measures + 1 final measure = 15 total
const tablature = [];
for (let i = 0; i < 14; i++) {
  tablature.push(baseMeasure);
}
tablature.push(finalMeasure);

const tabString = JSON.stringify(tablature, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, '"');

const fileContent = `import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const pullOffPentatonicRunExercise: Exercise = {
  id: "pull_off_pentatonic_run",
  title: "Dark Pull-off Pentatonic Run",
  description:
    "Legato pull-off exercise using the A minor pentatonic scale across the middle strings (G→D→A→D). This avoids the bright upper strings for a darker, heavier sound, eliminating the 'happy' feel. One bar of 8th notes: pick the 7th fret, pull-off to the 5th.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.15,
  instructions: [
    "Hold both fingers down before picking — the pull-off finger must already be in place.",
    "Follow the string order: G (7→5), D (7→5), A (7→5), then back to D (7→5).",
    "Pull the fretting finger sideways (toward the floor) to sound the lower note clearly.",
    "Keep both notes equal in volume — the pulled note should ring as loud as the picked one.",
    "Repeat the pattern continuously without stopping between cycles."
  ],
  tips: [
    "Pre-plant both fingers before picking — don't place the pull-off finger after the pick.",
    "Pull sideways, not straight off the string — this gives the lower note its volume.",
    "Keep fingers close to the fretboard to minimise movement between strings.",
    "The direction change at the bottom (A→D) is the trickiest part — isolate it if needed.",
    "Once comfortable, combine with the Hammer-on Pentatonic Run for a full legato loop."
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/pull-off.mp3", sourceBpm: 50 },
  relatedSkills: ["legato"],
  tablature: ${tabString},
};
`;

fs.writeFileSync('g:/cw/sss/CwiczymyRazem/src/feature/exercisePlan/data/exerises/pullOffPentatonicRun/pullOffPentatonicRun.ts', fileContent);
console.log("Written successfully 15 measures (14 standard + 1 with pause).");
