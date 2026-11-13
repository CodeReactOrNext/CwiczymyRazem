import {
  bar,
  beat,
  note,
  powerChord,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

const muted = (string: number) => beat(0.5, note(string, 0, { isPalmMute: true }));
const open = (string: number) => beat(0.5, note(string, 0));

export const palmMuteOpenChugExercise: Exercise = {
  id: "palm_mute_open_chug",
  addedAt: "2026-11-13",
  title: "Palm Muting — Open String Chug",
  description:
    "Steady palm-muted eighth notes on the open low strings, then the same chug with single notes left to ring.",
  whyItMatters:
    "Palm muting is what turns a plain open string into the tight, percussive chug behind most rock and metal riffs. The skill is not the mute itself but switching it on and off without changing your picking motion.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Rest the edge of your picking-hand palm on the strings right where they leave the bridge.",
    "Bars 1 and 3: play every note muted, all downstrokes, one string at a time.",
    "Bars 2 and 4: lift the palm slightly for the unmuted notes and drop it back for the rest.",
    "Keep the pick moving the same distance whether the note is muted or not.",
  ],
  tips: [
    "Too far from the bridge and the note dies completely; too close and it rings open. Slide the hand until you hear a short note with a clear pitch.",
    "The lift is tiny — roll the hand, do not raise it off the guitar.",
    "Use a bit of distortion if you have it: it makes the difference between muted and open obvious.",
  ],
  metronomeSpeed: { min: 40, max: 160, recommended: 70 },
  relatedSkills: ["rhythm", "articulation"],
  tablature: [
    bar(Array.from({ length: 8 }, () => muted(6))),
    bar([open(6), muted(6), muted(6), muted(6), open(6), muted(6), muted(6), muted(6)]),
    bar(Array.from({ length: 8 }, () => muted(5))),
    bar([muted(6), muted(6), open(6), muted(6), muted(5), muted(5), open(5), muted(5)]),
  ],
};

const G5 = powerChord(6, 3, 3);
const A5 = powerChord(6, 5, 3);
const E5 = powerChord(6, 0, 3);

export const palmMuteChugAndStabExercise: Exercise = {
  id: "palm_mute_chug_and_stab",
  addedAt: "2026-11-13",
  title: "Palm Muting — Chug and Stab",
  description:
    "A palm-muted open E chug broken up by power chords that ring out — the basic shape of a rock riff.",
  whyItMatters:
    "Most riffs are a conversation between muted low notes and open chords. Practising the switch in both directions — mute off for the chord, mute back on for the chug — is what makes a riff punch instead of blur.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Chug the open low E with the palm down, all downstrokes.",
    "Lift the palm for each power chord so it rings for its full length.",
    "Bars 1–2: chords land on beats 3 and 4. Bars 3–4: chords land between the chugs.",
    "Fret the next chord while you are still chugging, so it is ready when you need it.",
  ],
  tips: [
    "Hit the chords a little harder than the chug — the contrast is the riff.",
    "Keep the fretting hand hovering in the power chord shape over the strings the whole time.",
    "Stop each chord cleanly by dropping the palm back down, not by lifting the fretting hand away.",
  ],
  metronomeSpeed: { min: 50, max: 170, recommended: 90 },
  relatedSkills: ["rhythm", "articulation", "chords"],
  tablature: [
    bar([
      muted(6), muted(6), muted(6), muted(6),
      beat(1, G5, { chordName: "G5" }),
      beat(1, A5, { chordName: "A5" }),
    ]),
    bar([
      muted(6), muted(6), muted(6), muted(6),
      beat(1, A5, { chordName: "A5" }),
      beat(1, G5, { chordName: "G5" }),
    ]),
    bar([
      muted(6), muted(6), beat(0.5, G5, { chordName: "G5" }),
      muted(6), muted(6), beat(0.5, A5, { chordName: "A5" }),
      muted(6), muted(6),
    ]),
    bar([
      muted(6), muted(6), beat(0.5, A5, { chordName: "A5" }),
      muted(6), muted(6), beat(0.5, G5, { chordName: "G5" }),
      beat(1, E5, { chordName: "E5" }),
    ]),
  ],
};
