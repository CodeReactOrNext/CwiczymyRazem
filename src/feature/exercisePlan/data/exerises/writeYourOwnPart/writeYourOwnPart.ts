import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const writeYourOwnPartExercise: Exercise = {
  id: "write_your_own_part",
  title: "Composition — Your Own Part",
  description:
    "Take a favourite song, riff or section and write your own guitar part on top of it — a harmony line or a completely new part that fits the original.",
  whyItMatters:
    "Most real-world guitar playing means fitting into music that already exists — in a band, a session or a cover. Writing a part over a finished track trains you to hear the chords, the groove and the free space in an arrangement, and to make choices that serve the song instead of just playing what you already know.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 15,
  instructions: [
    "Pick a favourite song, riff or short section (4–16 bars) and loop it in any player.",
    "Listen a few times without playing: find the key, the chords and where the space in the arrangement is.",
    "Choose your role: a harmony line (the same melody a third or sixth above or below), or a new part — a counter-melody, a different rhythm part or fills in the gaps.",
    "Improvise over the loop until an idea sticks, then shape it into a fixed part you can play the same way every time.",
    "Play your part along with the loop several times until it sits tight with the recording.",
  ],
  tips: [
    "Less is more — a part that leaves room for the vocal or the main riff usually sounds better than a busy one.",
    "For a harmony line, stay in the key of the song and move with the original melody's rhythm.",
    "Change something on purpose: register, rhythm or sound. Play high when the original is low, sparse when it is busy.",
    "Record yourself over the track — you will hear clashes and gaps much better on playback.",
    "Next session, take the same song and write a completely different part for it.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["composition"],
};
