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
  description: "Improvise over a backing track while adhering to a single, rotating creative constraint.",
  whyItMatters: "Random constraints force you to break out of habitual playing patterns. By imposing artificial limitations (like playing only on two strings or avoiding certain rhythms), you are forced to discover new pathways and creative solutions on the spot.",
  requiresBackingTrack: true,
  difficulty: "easy",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Start improvising freely over a backing track or drone.",
    "When a prompt appears on screen, immediately alter your playing to follow that specific constraint.",
    "When the prompt changes, transition your playing to the new rule without stopping.",
  ],
  tips: [
    "Commit fully to the constraint, even if it feels uncomfortable or unnatural at first.",
    "If a prompt is challenging, drastically reduce the number of notes you play to give yourself processing time.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: easyConfig
};

export const improvPromptMedium: Exercise = {
  id: "improv_prompt_medium",
  title: "Improv Prompts — Medium",
  description: "Improvise over a backing track while rapidly adapting to rotating musical and theoretical constraints.",
  whyItMatters: "Faster rotations and more complex constraints test your ability to instantly recall and apply musical vocabulary. It trains your brain to quickly formulate musical ideas that fit specific structural requirements in real-time.",
  requiresBackingTrack: true,
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Improvise over a backing track while following each rotating prompt.",
    "Adapt immediately to new constraints as they rotate every 30 seconds.",
    "Focus on making the constraint sound like an intentional musical choice, not just a forced rule.",
  ],
  tips: [
    "Use the constraint as a seed for inspiration, rather than a cage.",
    "Listen to your phrasing and prioritize musicality over strict technical execution.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: mediumConfig
};

export const improvPromptHard: Exercise = {
  id: "improv_prompt_hard",
  title: "Improv Prompts — Hard",
  description: "Improvise over a backing track while simultaneously adhering to multiple advanced creative constraints.",
  whyItMatters: "Balancing multiple, sometimes conflicting constraints demands extreme cognitive flexibility and advanced fretboard mastery. This workout pushes your improvisational bandwidth to its absolute limit, turning moments of struggle into spontaneous creative breakthroughs.",
  requiresBackingTrack: true,
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 15,
  instructions: [
    "Improvise over a backing track while strictly following BOTH active prompts simultaneously.",
    "Adapt immediately as the pairs of prompts rotate every 30 seconds.",
    "Maintain the musical flow even if the active constraints contradict your natural playing style.",
  ],
  tips: [
    "If two constraints clash, creatively interpret a compromise that satisfies the essence of both.",
    "Slow down your playing significantly to allow your brain to process the dual requirements.",
    "Embrace the struggle; the cognitive friction is the primary benefit of the exercise.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
  riddleConfig: hardConfig
};
