import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metalTremoloPickingExercise: Exercise = {
  id: "metal_tremolo_picking",
  title: "Phrygian Assault Thrash Tremolo Picking",
  description: "Develop high-speed tremolo picking endurance and precise low-end palm muting using the aggressive, minor-second Phrygian scale structure.",
  whyItMatters: "This exercise builds speed and endurance for your picking hand. It tightens your alternate picking accuracy, locks in palm-mute consistency, and trains your hand to stay completely relaxed during high-intensity metal riffing.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Coordinate each pick stroke with precise finger placement to ensure clean articulation.",
    "Maintain a steady alternate picking pattern, keeping pick depth minimal and consistent.",
    "Practice at a slow tempo first, focusing on rhythmic precision and fluid position shifts."
  ],
  tips: [
    "Keep your fretting hand fingers hovered close to the fretboard to minimize unnecessary movement.",
    "Position your thumb behind the middle of the neck to support a curved, relaxed hand arch.",
    "Avoid excess tension in your shoulder and wrist; efficiency of movement builds speed naturally."
  ],
  metronomeSpeed: { min: 90, max: 200, recommended: 130 },
  relatedSkills: ["alternate_picking"],
  tablature: [
    // M1: Czyste tremolo E (fret 0) — 16 × 16tka PM
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M2: E × 8 → F (fret 1) × 4 → E × 4 — interwał b2 Phrygianu
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // F (fret 1) × 4
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        // E × 4
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M3: E × 8 → Bb (fret 6) × 2 → A (fret 5) × 2 → Bb × 2 → E × 2 — tryton, diabolus in musica
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // Bb (fret 6) × 2 — tryton E
        { duration: 0.25, notes: [{ string: 6, fret: 6, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isPalmMute: true }] },
        // A (fret 5) × 2 — chromatyczny sąsiad
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        // Bb × 2 — powrót do trytonowego napięcia
        { duration: 0.25, notes: [{ string: 6, fret: 6, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isPalmMute: true }] },
        // E × 2 — snap back
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M4: E × 8 → G (fret 3) × 4 → E × 4 — mała tercja, ciemny minorowy kolor
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // G (fret 3) × 4
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        // E × 4
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M5: E × 8 → B (fret 7) × 2 → C (fret 8) × 2 → B × 2 → E × 2 — kwinta i mała seksta
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // B (fret 7) × 2 — kwinta
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        // C (fret 8) × 2 — mała seksta (pół tonu wyżej od kwinty)
        { duration: 0.25, notes: [{ string: 6, fret: 8, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8, isPalmMute: true }] },
        // B × 2 — powrót
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        // E × 2 — snap back
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M6: Zejście przez całą skalę E Phrygian — D C B A G F E (wszystkie 7 stopni)
    {
      timeSignature: [4, 4],
      beats: [
        // D (fret 10) × 2 — mała septyma
        { duration: 0.25, notes: [{ string: 6, fret: 10, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 10, isPalmMute: true }] },
        // C (fret 8) × 2 — mała seksta
        { duration: 0.25, notes: [{ string: 6, fret: 8, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8, isPalmMute: true }] },
        // B (fret 7) × 2 — kwinta
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isPalmMute: true }] },
        // A (fret 5) × 2 — kwarta
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        // G (fret 3) × 2 — mała tercja
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        // F (fret 1) × 2 — mała sekunda (b2)
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 1, isPalmMute: true }] },
        // E (fret 0) × 4 — powrót do korzenia
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
  ],
};
