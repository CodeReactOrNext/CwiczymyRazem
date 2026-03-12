import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metalTremoloPickingExercise: Exercise = {
  id: "metal_tremolo_picking",
  title: "Phrygian Assault — Thrash Tremolo Picking",
  description:
    "Pure tremolo picking on the low E string using the E Phrygian scale (E F G A B C D). 16th notes, palm mute, no chords — pure mechanical aggression. The b2 interval (E→F, one half-step) is the sound of danger in thrash and death metal. Each measure is a loop. Inspired by Slayer, Kreator, Sepultura.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Measure 1: Pure tremolo on open E (fret 0). 16 identical 16th notes, palm mute. Nothing else. Set the metronome and lock in the time — this is the foundation.",
    "Measure 2: E × 8, then F (fret 1) × 4, then E × 4. A half-step up and back. This is the b2 interval of Phrygian — sounds aggressive and unsettling.",
    "Measure 3: E × 8, then Bb (fret 6) × 2 → A (fret 5) × 2 → Bb × 2 → E × 2. The tritone (E→Bb) is the 'diabolus in musica' — the forbidden interval. This is the Slayer sound.",
    "Measure 4: E × 8, then G (fret 3) × 4, E × 4. G is the minor 3rd — the dark, minor color of Phrygian.",
    "Measure 5: E × 8, then B (fret 7) × 2 → C (fret 8) × 2 → B × 2 → E × 2. B is the 5th, C is the minor 6th — together they create the tension typical of Kreator/Sepultura.",
    "Measure 6: Full E Phrygian scale descending — D(10)×2, C(8)×2, B(7)×2, A(5)×2, G(3)×2, F(1)×2, E(0)×4. All 7 scale degrees.",
    "Loop: play M1→M2→M3→M4→M5→M6→M1→... non-stop.",
  ],
  tips: [
    "Tremolo picking = alternate picking (DOWN-UP-DOWN-UP). Wrist anchored on the bridge, motion comes from the wrist, not the elbow.",
    "Every 16th note takes up exactly the same amount of time. Most common mistake: rushing. The metronome is your judge.",
    "Fret 1 (F) in measure 2: don't shift your whole hand — only one finger moves one fret. The hand stays in position 0.",
    "Tritone (fret 6, Bb) in measure 3: deeper palm mute than on open E. Closer to the bridge = more aggression. Experiment with hand position.",
    "Start at 100 BPM, increase by 5 BPM only when the tone is clean and even across all 6 measures without a single mistake.",
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
