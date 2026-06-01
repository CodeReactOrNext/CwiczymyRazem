import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Shared author links for all "Guitar Playalongs" videos
const guitarPlayalongsLinks = [
  { label: "Patreon", url: "https://patreon.com/guitar_playalongs" },
  { label: "Instagram", url: "https://instagram.com/toni_watzinger" },
  { label: "Facebook", url: "https://facebook.com/profile.php?id=61568130584535" },
  { label: "Website", url: "https://music-passion.ch" },
  { label: "Fashion for Guitarists", url: "https://tinyurl.com/da8237wp" },
];

export const gpPentatonic10MinWorkoutExercise: Exercise = {
  id: "gp_pentatonic_10min_workout",
  title: "10 Min Guitar Play-Along - Pentatonic Scale Workout",
  description: "A 10-minute pentatonic scale workout with tabs. Play along and build fluency across the box shapes.",
  whyItMatters: "Drilling pentatonic shapes in a steady play-along builds muscle memory, evens out your timing, and prepares the scale for real soloing.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Follow the on-screen tabs and keep your fretting hand relaxed.",
    "Stay locked to the backing groove, focusing on clean note transitions.",
  ],
  tips: [
    "Use alternate picking throughout for an even attack.",
    "Keep your fingers close to the fretboard to minimize wasted motion.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "iyIVafaAWn0",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=iyIVafaAWn0",
  links: guitarPlayalongsLinks,
};

export const gpSweepPicking15MinExercise: Exercise = {
  id: "gp_sweep_picking_15min",
  title: "Sweep Picking 15-Minutes Practice - Playalong with Tabs",
  description: "A 15-minute sweep picking play-along with tabs. Work through arpeggio sweeps at a steady pace.",
  whyItMatters: "Sweep picking demands precise hand synchronization and muting. A long play-along trains the consistency needed to make sweeps sound clean.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Follow the tabs and let the pick fall through the strings in one fluid motion.",
    "Roll your fretting fingers to mute each note as you move to the next string.",
  ],
  tips: [
    "Start slow and prioritize clean, separated notes over speed.",
    "Keep your picking hand light — sweeps are about motion, not force.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "Sq9-62gWrj4",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=Sq9-62gWrj4",
  links: guitarPlayalongsLinks,
};

export const gpSpeedBuilderPart1Exercise: Exercise = {
  id: "gp_speed_builder_part1",
  title: "Guitar Speed Builder Part 1 - Pentatonic Scale Workout",
  description: "Pentatonic scale speed-building play-along. Gradually increase your picking speed with the track.",
  whyItMatters: "Building speed progressively over a backing track keeps your technique relaxed and accurate as the tempo climbs.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    "Match the tempo of the track as it gradually increases.",
    "Focus on keeping your picking and fretting hands perfectly in sync.",
  ],
  tips: [
    "If you start tensing up, ease off — relaxation is the key to speed.",
    "Aim for clean notes first; speed follows accuracy.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "uK623oyumY4",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=uK623oyumY4",
  links: guitarPlayalongsLinks,
};

export const gpStaminaPickingWorkoutExercise: Exercise = {
  id: "gp_stamina_picking_workout",
  title: "Stamina Picking Workout - Alternate Picking Playalong",
  description: "An alternate picking stamina workout with tabs. Build endurance in your picking hand.",
  whyItMatters: "Sustained alternate picking builds the endurance and consistency you need to get through long, demanding passages without fatigue.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    "Maintain strict alternate picking for the entire play-along.",
    "Keep a relaxed grip and a steady, economical picking motion.",
  ],
  tips: [
    "Anchor your picking motion from the wrist, not the whole arm.",
    "Shake out tension during any rests to keep your hand fresh.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "KeH-uq6ugHE",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=KeH-uq6ugHE",
  links: guitarPlayalongsLinks,
};

export const gpGallopPicking10LevelsExercise: Exercise = {
  id: "gp_gallop_picking_10_levels",
  title: "10 Levels of Galloping - Gallop Picking Playalong",
  description: "A gallop picking play-along progressing through 10 levels of difficulty.",
  whyItMatters: "The gallop rhythm is a cornerstone of metal rhythm playing. Drilling it across levels sharpens your right-hand precision and palm muting.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Lock the down-up-down gallop pattern into the beat.",
    "Use consistent palm muting for a tight, percussive tone.",
  ],
  tips: [
    "Keep the palm mute pressure even so every note has the same chug.",
    "Move up the levels only once the current one feels effortless.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "kr-jNiob_Us",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=kr-jNiob_Us",
  links: guitarPlayalongsLinks,
};

export const gpAlternatePickingSpeedBuilderExercise: Exercise = {
  id: "gp_alternate_picking_speed_builder",
  title: "How to Get Faster at Alternate Picking - Speed Builder",
  description: "An alternate picking speed builder play-along and tutorial. Develop faster, cleaner picking.",
  whyItMatters: "Targeted speed-builder drills reinforce efficient picking mechanics so your top speed rises without sacrificing clarity.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    "Follow the tutorial cues and play along with each speed step.",
    "Keep your pick attack shallow and consistent as the tempo rises.",
  ],
  tips: [
    "Minimize pick travel — small movements mean more speed.",
    "Practice the slow tempos honestly; they build the foundation.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "_Xktej9ZdrY",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=_Xktej9ZdrY",
  links: guitarPlayalongsLinks,
};

export const gpRockMetalRiffsExercise: Exercise = {
  id: "gp_rock_metal_riffs",
  title: "Rock and Metal Riffs for Guitar - Playalong",
  description: "Play along with a set of rock and metal riffs. Build your rhythm chops and riff vocabulary.",
  whyItMatters: "Learning riffs in a musical context develops your rhythm feel, palm muting, and the ability to lock in with a band.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 12,
  instructions: [
    "Lock in with the rhythm section and keep an aggressive, tight pocket.",
    "Apply palm muting and accents where the riffs call for them.",
  ],
  tips: [
    "Keep your picking wrist loose to sustain fast rhythm parts.",
    "Listen for the groove — riffs live and die by their timing.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "P8m0JfS6KLQ",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=P8m0JfS6KLQ",
  links: guitarPlayalongsLinks,
};

export const gpMusicTheoryEssentialExercise: Exercise = {
  id: "gp_music_theory_essential",
  title: "The Most Important Part of Music Theory - Playalong Tutorial",
  description: "A play-along tutorial covering an essential piece of music theory for guitarists.",
  whyItMatters: "Understanding the core of music theory lets you make musical choices on purpose instead of by accident — it connects what you play to why it works.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 12,
  instructions: [
    "Follow the tutorial and apply each concept on the fretboard as it's explained.",
    "Play along with the examples to hear the theory in action.",
  ],
  tips: [
    "Say the note and interval names out loud as you play them.",
    "Relate every new idea back to a song or lick you already know.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "321hWrLt8qA",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=321hWrLt8qA",
  links: guitarPlayalongsLinks,
};

export const gpDrop2ChordsArpeggiosExercise: Exercise = {
  id: "gp_drop2_chords_arpeggios",
  title: "Chords and Arpeggios for Lead Guitar - Drop 2",
  description: "A play-along on drop 2 chords and arpeggios for lead guitar players.",
  whyItMatters: "Drop 2 voicings and their arpeggios unlock chord-tone soloing, letting your lines outline the harmony instead of just running scales.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 12,
  instructions: [
    "Play the drop 2 voicings, then arpeggiate them as shown.",
    "Connect the arpeggio shapes smoothly across the neck.",
  ],
  tips: [
    "Target chord tones on strong beats for a melodic sound.",
    "Visualize the underlying chord shape behind each arpeggio.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "zMLy7gNPTZc",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=zMLy7gNPTZc",
  links: guitarPlayalongsLinks,
};

export const gpPentatonicTutorialExercise: Exercise = {
  id: "gp_pentatonic_tutorial",
  title: "Do You Use This Pentatonic? - Guitar Playalong",
  description: "A pentatonic-focused play-along tutorial. Explore a pentatonic idea you may be missing.",
  whyItMatters: "Expanding how you use the pentatonic scale keeps your soloing fresh and helps you break out of the same old box shapes.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Follow the tutorial and play the pentatonic idea along with the track.",
    "Experiment with applying the shape over the backing groove.",
  ],
  tips: [
    "Phrase with bends and slides to make the scale sing.",
    "Leave space — not every beat needs a note.",
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  youtubeVideoId: "dDEMX9J4rm4",
  isPlayalong: true,
  videoUrl: "https://www.youtube.com/watch?v=dDEMX9J4rm4",
  links: guitarPlayalongsLinks,
};

export const guitarPlayalongsExercises: Exercise[] = [
  gpPentatonic10MinWorkoutExercise,
  gpSweepPicking15MinExercise,
  gpSpeedBuilderPart1Exercise,
  gpStaminaPickingWorkoutExercise,
  gpGallopPicking10LevelsExercise,
  gpAlternatePickingSpeedBuilderExercise,
  gpRockMetalRiffsExercise,
  gpMusicTheoryEssentialExercise,
  gpDrop2ChordsArpeggiosExercise,
  gpPentatonicTutorialExercise,
];
