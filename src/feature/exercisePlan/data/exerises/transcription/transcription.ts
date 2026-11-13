import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const transcriptionMelodyExercise: Exercise = {
  id: "transcription_melody_by_ear",
  addedAt: "2026-11-13",
  title: "Transcription — Melody You Can Sing",
  description:
    "Pick a tune you know by heart — a nursery rhyme, a theme, a vocal line — and find it on the guitar without looking anything up.",
  whyItMatters:
    "Working out a melody you can already sing is the gentlest way into playing by ear. The tune is in your head, so the only job is connecting the sound you hear to a place on the fretboard — the skill that all transcription, and most improvising, depends on.",
  difficulty: "easy",
  category: "hearing",
  timeInMinutes: 5,
  instructions: [
    "Choose a short melody you can sing from memory. No recording, no tab.",
    "Sing the first note and hunt for it on the B or G string until the guitar matches your voice.",
    "Sing the next note. Decide before you play: is it higher or lower, a small step or a jump?",
    "Find it, then play everything so far from the start before moving on.",
    "When the whole tune is there, play it again starting from a different fret.",
  ],
  tips: [
    "Stay on one string at first — up the neck is higher, down is lower, and nothing else gets in the way.",
    "Wrong notes are information: notice whether you overshot or undershot and adjust.",
    "Keep the tune short. Eight bars found completely beats a whole song found halfway.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription"],
};

export const transcriptionLickExercise: Exercise = {
  id: "transcription_lift_a_lick",
  addedAt: "2026-11-13",
  title: "Transcription — Lift a Lick",
  description:
    "Take one short phrase from a recording you love and work it out note for note by ear, then play it along with the original.",
  whyItMatters:
    "Every player you admire learned by copying records. A lick you lifted yourself stays with you in a way a tab never does, because you had to hear every bend, slide and pause to find it — and that detail is exactly what makes it sound like music.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 7.5,
  instructions: [
    "Pick a phrase of two to four bars — short enough to sing back after a few listens.",
    "Loop it, slowed down if you need to, and sing along until you can sing it without the recording.",
    "Find the first note on the guitar, then the last one. Fill in the notes between them.",
    "Work out the rhythm by tapping it against the beat of the track.",
    "Decide how it is played: which string, which notes are bent, slid or hammered.",
    "Play it with the recording at full speed until you cannot tell the two apart.",
  ],
  tips: [
    "Finding the key first narrows every guess — try the pentatonic scale that fits the track.",
    "The same note exists in several places. Choose the one whose tone matches the recording.",
    "Write the lick down, in tab or in your own shorthand, once you have it. Writing it fixes it in memory.",
    "One lick a week adds up to a vocabulary within a year.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription", "phrasing"],
};

export const transcriptionFindTheKeyExercise: Exercise = {
  id: "transcription_find_the_key",
  addedAt: "2026-11-13",
  title: "Transcription — Find the Key",
  description:
    "Put on a song and find its home note on one string by ear, then decide whether the song is major or minor.",
  whyItMatters:
    "Every other part of working a song out — the chords, the riff, the solo — gets easier once you know the key. Finding the note that feels like home is a small, repeatable skill, and a few songs a day is enough to make it automatic.",
  difficulty: "easy",
  category: "hearing",
  timeInMinutes: 5,
  instructions: [
    "Play a song you do not know the key of. Hum the note that sounds most like home — often the last note of the chorus.",
    "Slide one finger along the low E string until the guitar matches the note you are humming.",
    "Hold that note while the song plays. If it fits almost everywhere, you have the key.",
    "Play the major chord and then the minor chord on that root. Keep the one that matches the mood of the song.",
    "Repeat with three more songs.",
  ],
  tips: [
    "If two notes both seem to fit, try the one a fourth or fifth away — one of them is home, the other is its strongest neighbour.",
    "Check your answer by playing the pentatonic scale in that key over the track.",
    "Songs that start and end on the same chord are the easiest to begin with.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription", "music_theory"],
};

export const transcriptionChordsByEarExercise: Exercise = {
  id: "transcription_chords_by_ear",
  addedAt: "2026-11-13",
  title: "Transcription — Chords by Ear",
  description:
    "Work out the chord progression of a song from the recording: bass notes first, then major or minor for each one.",
  whyItMatters:
    "Being able to hear a progression is what frees you from looking songs up. The method is always the same — follow the bass, then test the chord quality — and most songs use so few chords that the same patterns soon start to recognise themselves.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 7.5,
  instructions: [
    "Choose a song with a clear, repeating section — a verse or a chorus.",
    "Listen only to the bass. Find each bass note on the low E or A string and write the notes down in order.",
    "For every bass note, try a major chord and a minor chord with that root while the track plays. Keep the one that blends in.",
    "Work out how long each chord lasts by counting beats between the changes.",
    "Play the whole section along with the recording.",
  ],
  tips: [
    "Find the key first: in a major key, chords one, four and five are major and two, three and six are minor.",
    "If neither major nor minor fits, the bass may be playing a note other than the root — try chords that contain that note.",
    "Power chords are a good first pass: they fit both major and minor and let you check the roots.",
    "Write the progression as numbers as well as letters. You will start meeting the same ones again and again.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription", "harmony"],
};
