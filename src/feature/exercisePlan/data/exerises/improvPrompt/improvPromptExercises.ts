import type { Exercise, ImprovPromptRiddleConfig } from "feature/exercisePlan/types/exercise.types";

const easyConfig: ImprovPromptRiddleConfig = {
  mode: 'improvPrompt',
  difficulty: 'medium',
  promptIntervalSeconds: 45,
  simultaneousPrompts: 1,
  prompts: [
    { text: "Play on one string only", category: "position" },
    { text: "Use only quarter notes", category: "rhythm" },
    { text: "Play as quietly as possible", category: "dynamics" },
    { text: "Stay in one 4-fret box", category: "position" },
    { text: "Use only downstrokes", category: "technique" },
    { text: "Leave 2 beats of silence between phrases", category: "phrasing" },
    { text: "Repeat every phrase twice", category: "behavior" },
    { text: "Play only on the top 2 strings", category: "position" },
    { text: "Use only 3 different notes", category: "notes" },
    { text: "Play everything staccato", category: "technique" },
    { text: "Play as loud as possible", category: "dynamics" },
    { text: "Use only eighth notes", category: "rhythm" },
    { text: "Play only on the bottom 2 strings", category: "position" },
    { text: "Play with your eyes closed", category: "behavior" },
    { text: "Use only hammer-ons and pull-offs", category: "technique" },
    { text: "Play only ascending lines", category: "phrasing" },
    { text: "Play only descending lines", category: "phrasing" },
    { text: "Keep every note within 3 frets", category: "position" },
    { text: "Use only whole notes", category: "rhythm" },
    { text: "Gradually get louder over 4 bars", category: "dynamics" },
    { text: "Stay above the 7th fret", category: "position" },
    { text: "Play only open strings and one fretted note", category: "notes" },
  ]
};

const mediumConfig: ImprovPromptRiddleConfig = {
  mode: 'improvPrompt',
  difficulty: 'medium',
  promptIntervalSeconds: 30,
  simultaneousPrompts: 1,
  prompts: [
    { text: "End every phrase on the root note", category: "notes" },
    { text: "Use only chord tones", category: "notes" },
    { text: "Alternate loud and soft every 2 bars", category: "dynamics" },
    { text: "End every phrase on a chord tone", category: "phrasing" },
    { text: "Play in a call-and-response style", category: "behavior" },
    { text: "Use only the pentatonic scale", category: "notes" },
    { text: "Add a bend to every other phrase", category: "technique" },
    { text: "Play rhythmic motifs — repeat a rhythm with different notes", category: "rhythm" },
    { text: "Play only intervals of a 3rd or larger", category: "notes" },
    { text: "Play legato lines — no picking mid-phrase", category: "technique" },
    { text: "Use vibrato on every long note", category: "technique" },
    { text: "Build phrases that crescendo then decrescendo", category: "dynamics" },
    { text: "Play question phrases (end unresolved)", category: "phrasing" },
    { text: "Play answer phrases (resolve to root)", category: "phrasing" },
    { text: "Mirror your last phrase upside-down", category: "behavior" },
    { text: "Use space — at least 50% silence", category: "phrasing" },
    { text: "Shift position every 2 bars", category: "position" },
    { text: "Use double stops in every phrase", category: "technique" },
    { text: "Play triplet-based rhythms only", category: "rhythm" },
    { text: "Target the 3rd of each chord", category: "notes" },
  ]
};

const hardConfig: ImprovPromptRiddleConfig = {
  mode: 'improvPrompt',
  difficulty: 'hard',
  promptIntervalSeconds: 30,
  simultaneousPrompts: 2,
  prompts: [
    { text: "Start every phrase on an upbeat", category: "rhythm" },
    { text: "Use syncopation in every phrase", category: "rhythm" },
    { text: "Play 1 note on 1 bar", category: "rhythm" },
    { text: "Play exclusively with hybrid picking", category: "technique" },
    { text: "Create tension for 4 bars then resolve in 1", category: "phrasing" },
    { text: "Play only in octave displacement", category: "position" },
    { text: "Play with extreme dynamic contrast within phrases", category: "dynamics" },
    { text: "Play only string skipping if you switch strings.", category: 'behavior' },
    { text: "Use only B and G strings. Switch it every 1 Bar", category: 'behavior' },
    { text: "Use tapping to extend your reach", category: "technique" },
    { text: "Play triplet-based rhythms only", category: "rhythm" },
    { text: 'Play sixteenth notes only', category: 'rhythm' },
    { text: "Build an entire solo from a 3-note motif", category: "phrasing" },
    { text: "Play only in one string", category: "position" },
    { text: "Switch positions every bar", category: "position" },
    { text: "Target the 3rd of each chord", category: "notes" },
    { text: "Play only intervals of a 3rd or larger", category: "notes" },
  ]
};

export const improvPromptEasy: Exercise = {
  id: "improv_prompt_easy",
  title: "Improv Prompts — Easy",
  description: "Follow rotating creative constraints while improvising. Simple, single rules that focus your playing.",
  difficulty: "easy",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Start improvising freely over a backing track or drone.",
    "A prompt will appear on screen — follow that constraint in your playing.",
    "When the prompt changes, adapt immediately to the new rule.",
    "Don't stop playing when prompts rotate — transition smoothly."
  ],
  tips: [
    "There are no wrong notes — commit fully to each constraint.",
    "If a prompt feels hard, simplify: play fewer notes but follow the rule.",
    "Use a backing track in a key you're comfortable with."
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: easyConfig
};

export const improvPromptMedium: Exercise = {
  id: "improv_prompt_medium",
  title: "Improv Prompts — Medium",
  description: "Musical concept prompts that push your vocabulary. Faster rotation keeps you on your toes.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Improvise while following each rotating prompt.",
    "Prompts rotate every 30 seconds — adapt quickly.",
    "Focus on musicality, not just following the rule literally.",
    "Try to make each constraint sound intentional, not forced."
  ],
  tips: [
    "Pre-hear the sound before you play it.",
    "Use the constraint as inspiration, not a cage.",
    "Record yourself and listen back — did it sound musical?"
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: mediumConfig
};

export const improvPromptHard: Exercise = {
  id: "improv_prompt_hard",
  title: "Improv Prompts — Hard",
  description: "Two simultaneous advanced constraints. Demands real-time creative problem-solving.",
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 15,
  instructions: [
    "Two prompts appear at the same time — follow BOTH simultaneously.",
    "Prompts rotate every 30 seconds.",
    "This is a creative workout — expect to struggle and embrace it.",
    "The goal is creative flexibility, not perfection."
  ],
  tips: [
    "If both constraints clash, find a creative compromise.",
    "Slow down your playing to give your brain processing time.",
    "Think of this as improvisation gym — the struggle IS the exercise."
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: hardConfig
};
