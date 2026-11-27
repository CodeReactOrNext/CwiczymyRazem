import { intervalClickLessonExercises } from "feature/exercisePlan/data/exerises/intervalClick/intervalClickLessons";
import { intervalClickWholeFretboardExercise } from "feature/exercisePlan/data/exerises/intervalClick/intervalClickWholeFretboard";
import {
  intervalTuneExamBpm,
  intervalTuneExercises,
  OCTAVE,
  TUNE_OPEN_MIDI,
} from "feature/exercisePlan/data/exerises/intervalTunes/intervalTunes";
import { INTERVALS } from "feature/exercisePlan/intervals/intervalDefinitions";

import type { FretDiagramData, FretDiagramString, JourneyModule, JourneyStep } from "../types/journey.types";

// MIDI pitch of each open string, 1 = high e .. 6 = low E. Every interval shape
// drawn below is computed from this tuning rather than typed in by hand, so a
// diagram cannot disagree with the neck.
const OPEN_MIDI: Record<number, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

interface Mark {
  string: number;
  fret: number;
  label: string;
}

/** A neck window with only the marked cells labelled; strings without a mark render dimmed. */
function marksDiagram(startFret: number, endFret: number, marks: Mark[]): FretDiagramData {
  for (const mark of marks) {
    if (mark.fret < startFret || mark.fret > endFret) {
      throw new Error(
        `Interval journey: "${mark.label}" lands on string ${mark.string} fret ${mark.fret}, outside frets ${startFret}-${endFret}`,
      );
    }
  }
  const strings: FretDiagramString[] = [1, 2, 3, 4, 5, 6].map((stringNum) => {
    const own = marks.filter((mark) => mark.string === stringNum);
    if (own.length === 0) return { string: stringNum, active: false };
    const notes = Array.from({ length: endFret - startFret + 1 }, () => "");
    own.forEach((mark) => {
      notes[mark.fret - startFret] = mark.label;
    });
    return { string: stringNum, active: true, notes };
  });
  return { startFret, endFret, strings };
}

interface Shape {
  /** [string, fret] of the root. */
  root: [number, number];
  /** What to mark from that root: semitones above it, the string it is drawn on, its label. */
  tones: { semitones: number; on: number; label: string }[];
}

/** Roots marked "R", each with the notes a given number of semitones above it. */
function shapeDiagram(startFret: number, endFret: number, shapes: Shape[]): FretDiagramData {
  const marks = shapes.flatMap(({ root: [rootString, rootFret], tones }) => [
    { string: rootString, fret: rootFret, label: "R" },
    ...tones.map((tone) => ({
      string: tone.on,
      fret: OPEN_MIDI[rootString] + rootFret + tone.semitones - OPEN_MIDI[tone.on],
      label: tone.label,
    })),
  ]);
  return marksDiagram(startFret, endFret, marks);
}

/** One string as a ruler: every interval above the open note, fret by fret, up to the octave. */
function rulerDiagram(stringNum: number): FretDiagramData {
  return marksDiagram(0, 12, [
    { string: stringNum, fret: 0, label: "R" },
    ...INTERVALS.map((interval) => ({ string: stringNum, fret: interval.semitones, label: interval.degree })),
    { string: stringNum, fret: 12, label: "8" },
  ]);
}

// ─── Step builders ────────────────────────────────────────────────────────────
// The three kinds of exam the path alternates between. Each one states its pass
// mark the same way every time, so only the lesson itself is written per step.

type StepContent = Pick<JourneyStep, "id" | "title" | "shortDescription" | "contentBlocks"> & {
  exerciseId: string;
  stepIcon?: string;
};

const baseStep = (content: StepContent, examGoal: string, defaultIcon: string) => ({
  id: content.id,
  title: content.title,
  shortDescription: content.shortDescription,
  fullDescription: "",
  tips: [],
  commonMistakes: [],
  examGoal,
  suggestedExerciseId: content.exerciseId,
  stepIcon: content.stepIcon ?? defaultIcon,
  contentBlocks: content.contentBlocks,
});

const CLICK_EXERCISES = [...intervalClickLessonExercises, intervalClickWholeFretboardExercise];

/** Answered on the fretboard diagram: place a root, click the interval. Passed
 *  on hearts, see intervalClickExamAccuracy. */
const clickStep = (content: StepContent) => {
  const minutes = CLICK_EXERCISES.find((exercise) => exercise.id === content.exerciseId)?.timeInMinutes ?? 2;
  return baseStep(
    content,
    `Place each root and click the interval above it, round after round, for ${minutes} minutes. Every round has to be answered within 10 seconds: a round that runs out ends the exam, and so do three wrong clicks. A cleaner run earns more stars.`,
    "Target",
  );
};

/** Answered by ear: the app plays, you name what you heard. */
const earStep = (content: StepContent) =>
  baseStep(
    content,
    "Name at least 93% of the intervals you hear. The exam needs 10 answers or more before the clock runs out; fewer than that count as misses.",
    "Ear",
  );

/** Answered on the guitar: the mic listens for the note the interval lands on. */
const playStep = (content: StepContent) =>
  baseStep(
    content,
    "Play the note each interval lands on, inside the frets the round highlights, for at least 93% of the rounds. Every round stays up for 12 seconds, and a round you don't answer counts as a miss.",
    "Trophy",
  );

/**
 * Played from a tab: a short tune built on the interval the previous step
 * taught. The diagram is the first place the tune plays that interval, so it
 * shows two notes the player is about to meet rather than a generic shape.
 */
const tuneStep = (intervalId: string, lesson: string) => {
  const interval = [...INTERVALS, OCTAVE].find((entry) => entry.id === intervalId)!;
  const slug = interval.name.toLowerCase().replace(/ /g, "_");
  const exerciseId = `interval_tunes_${slug}`;
  const examBpm = intervalTuneExamBpm(intervalId);
  const notes = intervalTuneExercises
    .find((exercise) => exercise.id === exerciseId)!
    .tablature!.flatMap((measure) => measure.beats.flatMap((beat) => beat.notes));
  const pitch = (note: { string: number; fret: number }) => TUNE_OPEN_MIDI[note.string] + note.fret;
  const at = notes.findIndex((note, index) => index > 0 && pitch(note) - pitch(notes[index - 1]) === interval.semitones);
  const [low, high] = [notes[at - 1], notes[at]];
  const frets = [low.fret, high.fret];
  return {
    ...baseStep(
      {
        id: `step_interval_play_${slug}`,
        title: `Play: ${interval.name}`,
        shortDescription: `Guitar in hand: a short piece built on the ${interval.name.toLowerCase()}.`,
        exerciseId,
        contentBlocks: [
          { type: "text", body: lesson },
          {
            type: "fretDiagram",
            diagram: marksDiagram(Math.max(0, Math.min(...frets) - 1), Math.max(...frets) + 1, [
              { string: low.string, fret: low.fret, label: "R" },
              { string: high.string, fret: high.fret, label: interval.degree },
            ]),
          },
          {
            type: "callout",
            icon: "Guitar",
            label: "Where the interval is",
            body: "The diagram shows the first two notes that make the interval. It keeps coming back from different starting notes all the way through. Press Practice, listen to the tab once, then play along with the click.",
          },
          {
            type: "callout",
            icon: "Ear",
            label: "Slow first, then the exam tempo",
            body: "Loop it below the suggested tempo until every note is clean, then bring it up. By the last bar, try to hear the interval in your head before your hand plays it.",
          },
        ],
      },
      `At a locked ${examBpm} BPM, play it with the click and hit at least 93% of its notes. The second and third star also look at your timing.`,
      "Guitar",
    ),
    examBpm,
  };
};

type Stage = JourneyModule["stages"][number];

/** Numbers the steps in path order, so inserting a lesson never means renumbering by hand. */
function buildStages(stages: { id: Stage["id"]; label: string; steps: ReturnType<typeof baseStep>[] }[]): Stage[] {
  let order = 0;
  return stages.map((stage, index) => ({
    id: stage.id,
    order: index + 1,
    label: stage.label,
    steps: stage.steps.map((step) => ({ ...step, order: ++order, stageId: stage.id })),
  }));
}

// ─── The path ─────────────────────────────────────────────────────────────────

const introStep: ReturnType<typeof baseStep> & Pick<JourneyStep, "modalOnly" | "checklist"> = {
  ...baseStep(
    {
      id: "step_intervals_intro",
      title: "Before You Begin",
      shortDescription: "What an interval is, and why your guitar is the best instrument to learn them on.",
      exerciseId: "",
      contentBlocks: [
        {
          type: "text",
          body: "An interval is the distance between two notes. That's all. Every chord, scale, riff and melody you have ever played is a handful of intervals in a row, and there are only twelve of them before the pattern repeats.",
        },
        {
          type: "callout",
          icon: "Lightbulb",
          label: "Your neck is a ruler",
          body: "On a piano, intervals hide behind black and white keys. On a guitar, one fret is always one half step, on every string, everywhere. So an interval is just a number of frets: learn that a 5th is 7 frets and it is 7 frets from any note you will ever play.",
        },
        { type: "fretDiagram", diagram: rulerDiagram(6) },
        {
          type: "callout",
          icon: "Hash",
          label: "Why a 3rd isn't 3 frets",
          body: "Interval names count letter names, and they count both ends. C up to E is a 3rd because it spans three letters: C, D, E. The frets tell you which kind: 3 frets is a minor 3rd, 4 frets is a major 3rd. The label on the diagram above shows each one the way players say it out loud: ♭3, 3, 5, ♭7.",
        },
        {
          type: "callout",
          icon: "Layers",
          label: "Three ways in",
          body: "Every interval in this path is learned three times. You click its shape on a fretboard diagram, you pick it out by ear, and you play it on your guitar while the mic listens. The clicking and listening steps need no guitar at all. The Play steps do.",
        },
        {
          type: "callout",
          icon: "Compass",
          label: "It builds on the fretboard path",
          body: "You don't need to have finished Fretboard Mastery, but the drills here name a root note and expect you to find it. If hunting for an F on the neck still takes you a while, do a few stages over there first.",
        },
      ],
    },
    "Tick all the boxes below to confirm you're ready to begin.",
    "BookOpen",
  ),
  modalOnly: true,
  checklist: [
    { text: "I can find the natural notes (C D E F G A B) on the low E and A strings", icon: "Guitar" },
    { text: "I know one fret is a half step and two frets is a whole step", icon: "Hash" },
    { text: "I have speakers or headphones for the listening steps", icon: "Volume2" },
    { text: "I understand the Play steps listen to my guitar through a mic or an interface", icon: "Mic2" },
  ],
};

export const intervalsModule: JourneyModule = {
  id: "intervals",
  title: "Interval Mastery",
  subtitle: "See, hear and play every distance between two notes",
  locked: false,
  icon: "Ruler",
  stages: buildStages([
    {
      id: "stage_1",
      label: "Seconds",
      steps: [
        introStep,
        clickStep({
          id: "step_interval_minor_2nd",
          title: "Minor 2nd: The Half Step",
          shortDescription: "One fret. The smallest move there is, and the tensest sound in music.",
          exerciseId: "interval_click_minor_2nd",
          contentBlocks: [
            {
              type: "text",
              body: "Start with the atom. A minor 2nd is one fret: any note and its next-door neighbour. Every other interval in this path is just a bigger pile of these.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(1, 6, [{ root: [6, 5], tones: [{ semitones: 1, on: 6, label: "♭2" }, { semitones: 1, on: 5, label: "♭2" }] }]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The shark in Jaws is two notes a minor 2nd apart, over and over. So is the opening of Für Elise. Two notes are enough to make a whole cinema nervous, as long as they are one fret apart.",
            },
            {
              type: "callout",
              icon: "Info",
              label: "The stretch you'll rarely use",
              body: "The same note also sits one string higher, four frets back. It's on the diagram so you know it exists, but nobody plays a half step that way. Think of this one along the string.",
            },
          ],
        }),
        tuneStep("m2", "Now make the shark heavy. The open low string chugs underneath, palm-muted, and every note that jumps out of it is one fret above the note it leans on. That flat 2 over the root is the sound of metal: you'll hear it the moment you play the first bar."),
        clickStep({
          id: "step_interval_major_2nd",
          title: "Major 2nd: The Whole Step",
          shortDescription: "Two frets. The plain step that scales are mostly made of.",
          exerciseId: "interval_click_major_2nd",
          contentBlocks: [
            {
              type: "text",
              body: "Skip one fret and you have a major 2nd, the whole step. It is the most ordinary distance in music: walk up a major scale and five of the seven steps are this one.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(2, 7, [{ root: [6, 5], tones: [{ semitones: 2, on: 6, label: "2" }, { semitones: 2, on: 5, label: "2" }] }]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The first step up in Happy Birthday. The first two notes of Frère Jacques. The first two notes of any major scale you've ever run.",
            },
            {
              type: "callout",
              icon: "TrendingUp",
              label: "It's also your full bend",
              body: "A full bend raises a note by exactly a major 2nd, and a half bend by a minor 2nd. Every time you check a bend against the fret two higher, you are comparing intervals by ear already.",
            },
          ],
        }),
        tuneStep("M2", "A legato lick over a funk groove, and every hammer-on and pull-off in it is a whole step. Frets 5 and 7 line up as major 2nds on four strings in a row, which is why this corner of the neck is where most solos are born. The hook climbs those strings and lands on a long note; each time it comes back, the answer goes somewhere new. Pick once per string and let the fretting hand do the rest."),
        earStep({
          id: "step_interval_ear_seconds",
          title: "By Ear: Half Step or Whole Step",
          shortDescription: "No fretboard this time. Two notes play, and you say whether they are one fret apart or two.",
          exerciseId: "ear_interval_seconds",
          contentBlocks: [
            {
              type: "text",
              body: "First listening step. The app plays two notes going up, and you answer with one of two buttons. The starting note changes every round, so there is nothing to memorise: only the size of the step is worth listening to.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "What to listen for",
              body: "The half step sounds cramped, like the second note is leaning on the first. The whole step sounds relaxed, like the start of a tune. If you're unsure, sing the two notes back: your voice will barely move for a half step.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Why train the ear at all",
              body: "Shapes tell your fingers where to go. Your ear tells you whether it was right. A player who only knows the shapes can play an interval; a player who can hear it can find it in a song.",
            },
          ],
        }),
      ],
    },
    {
      id: "stage_2",
      label: "Thirds",
      steps: [
        clickStep({
          id: "step_interval_minor_3rd",
          title: "Minor 3rd: The Dark One",
          shortDescription: "Three frets. The interval that makes minor sound minor.",
          exerciseId: "interval_click_minor_3rd",
          contentBlocks: [
            {
              type: "text",
              body: "Three frets up, or one string higher and two frets back. If you know the minor pentatonic box, you've been playing this since day one: index finger, then pinky, on the low E string.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 8, [{ root: [6, 5], tones: [{ semitones: 3, on: 6, label: "♭3" }, { semitones: 3, on: 5, label: "♭3" }] }]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "The riff interval",
              body: "The first two notes of Smoke on the Water. The first two notes of Iron Man. The first move of Seven Nation Army. A startling number of famous riffs open by jumping a minor 3rd, which is why they all feel heavy before the band even comes in.",
            },
          ],
        }),
        tuneStep("m3", "A run across all six strings and twelve frets, built from minor 3rds and nothing else. Listen for the trick hidden in it: four minor 3rds add up to exactly one octave, so only four different notes exist in the whole run. Stacked like this they make the diminished chord, the sound of every silent-film villain."),
        clickStep({
          id: "step_interval_major_3rd",
          title: "Major 3rd: The Bright One",
          shortDescription: "Four frets. One more than the minor 3rd, and the whole mood flips.",
          exerciseId: "interval_click_major_3rd",
          contentBlocks: [
            {
              type: "text",
              body: "Four frets up, or one string higher and one fret back. It sits a single fret above the minor 3rd, and that fret is the entire difference between a sad chord and a happy one.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 9, [{ root: [6, 5], tones: [{ semitones: 4, on: 6, label: "3" }, { semitones: 4, on: 5, label: "3" }] }]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The first two notes of When the Saints Go Marching In, and the first two notes of any major chord played one string at a time.",
            },
            {
              type: "callout",
              icon: "Guitar",
              label: "Your guitar is tuned to one",
              body: "Four of the five gaps between your open strings are the same size. One isn't: G to B is a major 3rd. Play those two open strings together and you're hearing this lesson. Remember that odd pair, it comes back later to break every shape you learn.",
            },
          ],
        }),
        tuneStep("M3", "A country riff that bounces from the root to its major 3rd and follows the chords. In the answering bars you land on the minor 3rd and hammer it up one fret into the major. That single fret is the whole difference between the last two lessons, and guitarists have been leaning on it for a century."),
        earStep({
          id: "step_interval_ear_thirds",
          title: "By Ear: Major or Minor",
          shortDescription: "Two notes, three frets apart or four. Hear which, and you can hear the mood of any chord.",
          exerciseId: "ear_interval_thirds",
          contentBlocks: [
            {
              type: "text",
              body: "This is the single most useful thing an ear can learn. Every chord is major or minor because of the 3rd inside it, so telling these two apart on bare notes is the same skill as hearing whether a song is happy or sad.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "What to listen for",
              body: "Don't measure the distance, listen to the colour. The minor 3rd is darker and a little closed. The major 3rd is open and bright. If the two notes alone don't tell you, press 'Play them together' and they turn into a tiny chord.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Anchor each one to a tune",
              body: "Pick one song per interval and keep it. Smoke on the Water for the minor 3rd, When the Saints for the major 3rd. When a pair plays, hum the start of each tune from the first note and see which one fits.",
            },
          ],
        }),
        playStep({
          id: "step_interval_play_small",
          title: "Play: Seconds & Thirds",
          shortDescription: "Guitar in hand. A root and a small interval appear, and you play the note it lands on.",
          exerciseId: "interval_hunt_seconds_thirds",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Now without a tab. You'll see something like 'D · Minor 3rd'. The catch: every round lights up a different four-fret window on the neck, and only that slice counts. Find a D inside it, find the answer inside it, and play both, so you hear the two together.",
            },
            { type: "fretDiagram", diagram: marksDiagram(0, 4, [
              { string: 6, fret: 0, label: "R" },
              { string: 6, fret: 1, label: "♭2" },
              { string: 6, fret: 2, label: "2" },
              { string: 6, fret: 3, label: "♭3" },
              { string: 6, fret: 4, label: "3" },
            ]) },
            {
              type: "callout",
              icon: "Trophy",
              label: "When the window is too short",
              body: "On one string all four answers sit under your four fingers: one fret, two, three, four. But the window is only four frets wide, so the root often sits near its edge and the answer has to be taken on the next string instead. That's the point: the same interval, found from wherever you're standing.",
            },
          ],
        }),
      ],
    },
    {
      id: "stage_3",
      label: "Fourths & Fifths",
      steps: [
        clickStep({
          id: "step_interval_perfect_4th",
          title: "Perfect 4th: Hiding in Plain Sight",
          shortDescription: "Five frets, or simply the next string at the same fret. Your guitar is built out of this one.",
          exerciseId: "interval_click_perfect_4th",
          contentBlocks: [
            {
              type: "text",
              body: "A perfect 4th is five frets. But you'll almost never count it, because it is also the next string up at the very same fret. Lay one finger flat across two strings and you're playing a 4th.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 7, [
                { root: [6, 5], tones: [{ semitones: 5, on: 5, label: "4" }] },
                { root: [3, 5], tones: [{ semitones: 5, on: 2, label: "4" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "You've tuned to it for years",
              body: "E to A, A to D, D to G, B to e: your open strings are 4ths stacked on 4ths. That old trick of fretting the 5th fret to tune the next string works because five frets is a perfect 4th. You knew this interval before you knew its name.",
            },
            {
              type: "callout",
              icon: "AlertCircle",
              label: "Except across G and B",
              body: "Look at the second shape on the diagram. From the G string to the B string, the 4th is one fret up instead of the same fret. That pair is tuned a fret narrower than the rest, so every shape that crosses it shifts by one.",
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "Here Comes the Bride. The first two notes of Amazing Grace. It sounds like an announcement.",
            },
          ],
        }),
        tuneStep("P4", "An arena anthem, and the 4th is the leap that opens it: a short note, then up five frets onto the beat, the same jump that starts Here Comes the Bride. The hook is A up to D, next string up at the same fret. Watch the sixth bar: the melody climbs two 4ths in a row onto the B string, and the tuning lesson from this step bites."),
        clickStep({
          id: "step_interval_perfect_5th",
          title: "Perfect 5th: The Power Chord",
          shortDescription: "Seven frets, or one string up and two frets over. The shape your hand already knows best.",
          exerciseId: "interval_click_perfect_5th",
          contentBlocks: [
            {
              type: "text",
              body: "Seven frets on one string. One string higher and two frets up in practice. If you've ever played a power chord, your index and ring finger have been holding a perfect 5th the whole time.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(2, 6, [
                { root: [6, 3], tones: [{ semitones: 7, on: 5, label: "5" }, { semitones: 12, on: 4, label: "8" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "A chord with no mood",
              body: "A power chord is a root, a 5th and usually the octave on top. There is no 3rd in it, and the 3rd is the note that decides major or minor. So a power chord is neither. That's why the same shape works under a happy chorus and a grim verse without changing a finger.",
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The first leap of the Star Wars theme. Twinkle Twinkle Little Star, between the first 'twinkle' and the second. It is the most stable sound two different notes can make.",
            },
          ],
        }),
        tuneStep("P5", "You know the 5th as a power chord. Here it is let loose: 5th stacked on 5th on 5th, cascading across all six strings from the third fret to the fourteenth. Every note is one string up and two frets higher than the last, and somehow the whole sweep stays inside one key. Violins and cellos are tuned this way, which is why it sounds so wide."),
      ],
    },
    {
      id: "stage_4",
      label: "The Tritone",
      steps: [
        clickStep({
          id: "step_interval_tritone",
          title: "Tritone: The Devil in Music",
          shortDescription: "Six frets. Exactly half an octave, and the most restless sound on the neck.",
          exerciseId: "interval_click_tritone",
          stepIcon: "Flame",
          contentBlocks: [
            {
              type: "text",
              body: "Six frets, wedged between the 4th and the 5th. Take the power chord shape and pull its top note back one fret. Where the 5th sounds like a wall, this sounds like a question nobody answered.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(2, 9, [
                { root: [6, 3], tones: [{ semitones: 6, on: 5, label: "♭5" }, { semitones: 6, on: 6, label: "♭5" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "The sound of heavy metal",
              body: "The riff of Black Sabbath by Black Sabbath is a root, its octave, and a tritone. The opening of Purple Haze is a tritone. So are the first two notes of The Simpsons theme. People called it the devil in music centuries ago; the story that the church banned it is a legend, the nickname is real.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "The only interval that flips into itself",
              body: "An octave is 12 frets and the tritone is 6, exactly half. Go up a tritone twice and you're back on the note you started from. So it is the one interval that measures the same from either end, which is part of why the ear can't decide where it wants to go.",
            },
            {
              type: "callout",
              icon: "Info",
              label: "It's inside your E7 chord",
              body: "Every dominant 7th chord has a tritone between its 3rd and its 7th. That hidden clash is what makes a 7th chord itch to move to the next one, and it's the engine of every blues you've played.",
            },
          ],
        }),
        tuneStep("TT", "A rock riff, and this time you play the tritone as two notes at once: a low string, and the next string up one fret higher. Over the chugging E it's the evil power chord. Then the band moves to A7 and B7, and the very same shape turns into the heart of those chords, their 3rd and flat 7. Wait for the last bar: the top note moves up one fret, the tritone becomes a plain power chord, and the tension lets go."),
        earStep({
          id: "step_interval_ear_pillars",
          title: "By Ear: 4th, Tritone, 5th, Octave",
          shortDescription: "Three rock-solid sounds and one troublemaker. Pick them apart by ear.",
          exerciseId: "ear_interval_pillars",
          contentBlocks: [
            {
              type: "text",
              body: "The octave joins in here. It is 12 frets: the same note again, higher. On the neck it sits two strings up and two frets over, which is the top note of the power chord you just learned. By ear it is the first two notes of Somewhere Over the Rainbow.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "Sort them in two questions",
              body: "First: does the pair sound finished? If it makes you want to hear a third note, it's the tritone. If it does sound finished: is the second note the same note again (octave), the hollow sound of a power chord (5th), or the announcement (4th)?",
            },
            {
              type: "callout",
              icon: "Info",
              label: "4th and 5th are the hard pair",
              body: "They're the same two notes seen from opposite ends, so they sound related. Hum Here Comes the Bride for the 4th and the Star Wars leap for the 5th, both from the first note you hear.",
            },
          ],
        }),
        earStep({
          id: "step_interval_tune_by_ear",
          title: "Tune by Ear: Kill the Wobble",
          shortDescription: "Two notes that should be an octave, a 5th or a 4th apart. Slide one until they lock.",
          exerciseId: "ear_tuning_intervals",
          stepIcon: "SlidersHorizontal",
          contentBlocks: [
            {
              type: "text",
              body: "Here is why those three are called perfect. An interval isn't really a number of frets, it's a ratio between two speeds of vibration. In an octave the higher string vibrates exactly twice as fast. In a 5th, three times for every two. In a 4th, four times for every three.",
            },
            {
              type: "fretDiagram",
              diagram: marksDiagram(0, 12, [
                { string: 6, fret: 5, label: "4:3" },
                { string: 6, fret: 7, label: "3:2" },
                { string: 6, fret: 12, label: "2:1" },
              ]),
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Get a ruler out",
              body: "Measure your guitar. The 12th fret sits at exactly half the string's length. The 7th fret leaves two thirds of the string ringing, the 5th fret leaves three quarters. The frets aren't where they are by tradition: they are those fractions, and it's also why natural harmonics ring at exactly these three frets.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "What you're listening for",
              body: "When two notes are almost at one of those ratios, they pulse against each other: a slow wah-wah-wah. The closer you get, the slower it pulses. When it stops, you're in tune. This step has you slide a note until the wobble dies, which is exactly how guitars were tuned before tuners.",
            },
            {
              type: "callout",
              icon: "Timer",
              label: "This exam counts fewer answers",
              body: "Tuning takes longer than naming, so this one asks for three tuned pairs instead of ten answers. Take your time on each: moving past the right spot on purpose and coming back is the fastest way to find it.",
            },
          ],
        }),
        playStep({
          id: "step_interval_play_pillars",
          title: "Play: 4th, Tritone, 5th",
          shortDescription: "Three shapes side by side on the neck. Play the right one from any root.",
          exerciseId: "interval_hunt_pillars",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "These three sit on neighbouring frets, one string up from the root: the 4th at the same fret, the tritone one fret higher, the 5th two frets higher. Easy to learn together, easy to mix up under pressure.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(2, 6, [
                {
                  root: [6, 3],
                  tones: [
                    { semitones: 5, on: 5, label: "4" },
                    { semitones: 6, on: 5, label: "♭5" },
                    { semitones: 7, on: 5, label: "5" },
                  ],
                },
              ]),
            },
            {
              type: "callout",
              icon: "Compass",
              label: "Put the root on a low string",
              body: "With the root on the low E, A or D string the shapes above hold exactly. When the window pushes you higher up, remember the G–B pair: any shape that crosses it lands one fret higher.",
            },
          ],
        }),
      ],
    },
    {
      id: "stage_5",
      label: "Sixths",
      steps: [
        clickStep({
          id: "step_interval_minor_6th",
          title: "Minor 6th: The Aching Leap",
          shortDescription: "Eight frets. Too far to count, so from here on you learn shapes.",
          exerciseId: "interval_click_minor_6th",
          contentBlocks: [
            {
              type: "text",
              body: "Eight frets is the point where counting along one string stops being practical. So the wide intervals are learned across strings: the minor 6th is two strings higher and two frets back, or one string higher and three frets up, one fret above the power chord's 5th.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 8, [
                { root: [6, 5], tones: [{ semitones: 8, on: 4, label: "♭6" }, { semitones: 8, on: 5, label: "♭6" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The big leap near the start of The Entertainer. It's the sad wide interval: the note that makes natural minor sound heavier than Dorian.",
            },
            {
              type: "callout",
              icon: "Eye",
              label: "Notice something about the shape",
              body: "Two strings up, two frets back. Now look at those two notes from the top one downward. You'll see why this matters in the Secrets stage; for now, just keep the picture.",
            },
          ],
        }),
        tuneStep("m6", "A spaghetti-western theme. Two notes like hoofbeats, a leap up a minor 6th, and then the top note sinks by one fret. That leap and fall is the saddest move a minor key has, and film composers have leaned on it for a hundred years. The band behind you plays surf guitar and a rolling bass."),
        clickStep({
          id: "step_interval_major_6th",
          title: "Major 6th: The Sweet One",
          shortDescription: "Nine frets, or two strings up and one fret back. The sound of soul guitar.",
          exerciseId: "interval_click_major_6th",
          contentBlocks: [
            {
              type: "text",
              body: "Skip a string and lean back one fret. Crossing the G–B pair it becomes the same fret, which is the upper shape on the diagram: easy enough to slide around with two fingers.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 7, [
                { root: [6, 5], tones: [{ semitones: 9, on: 4, label: "6" }] },
                { root: [4, 5], tones: [{ semitones: 9, on: 2, label: "6" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "My Bonnie Lies Over the Ocean, 'My' to 'Bon'. The first two notes of the NBC chime. And on guitar: the sliding two-note intro of Soul Man is sixths all the way.",
            },
            {
              type: "callout",
              icon: "Guitar",
              label: "Try it as a double stop",
              body: "Fret both notes of that upper shape, pluck them together with pick and middle finger, and slide the pair up two frets and back. That's a country and soul fill already. Wide intervals sound better together than apart.",
            },
          ],
        }),
        tuneStep("M6", "The warm one, played the way guitarists actually use it. On the G string and the high E string a major 6th is the same fret on both, so one shape slides up and down the neck and follows the chords. You have heard this fill behind countless soul and country songs. Now it is yours."),
      ],
    },
    {
      id: "stage_6",
      label: "Sevenths",
      steps: [
        clickStep({
          id: "step_interval_minor_7th",
          title: "Minor 7th: The Blues Note",
          shortDescription: "Ten frets, or two strings up at the same fret. Two frets short of the octave.",
          exerciseId: "interval_click_minor_7th",
          contentBlocks: [
            {
              type: "text",
              body: "From here on, stop counting up from the root and start counting down from the octave. The minor 7th is two frets below it: two strings higher, same fret as the root.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 7, [
                { root: [6, 5], tones: [{ semitones: 10, on: 4, label: "♭7" }, { semitones: 12, on: 4, label: "8" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The first two notes of the original Star Trek theme. 'There's a' in Somewhere from West Side Story. And every time a blues band lands on a 7th chord.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "It's already in your pentatonic box",
              body: "Play box 1 of the minor pentatonic from the low E string: root, then on the D string, the note under your index finger. That's the minor 7th. You've been leaning on it in every solo.",
            },
          ],
        }),
        tuneStep("m7", "A blues-rock riff where the root keeps kicking up to its flat 7. That one note is the difference between a plain major chord and a blues chord, and here you play it over all three chords of the blues. On the low strings the shape could not be simpler: two strings up, same fret. Low E to D and A to G are even open strings."),
        clickStep({
          id: "step_interval_major_7th",
          title: "Major 7th: One Fret From Home",
          shortDescription: "Eleven frets. A single fret under the octave, and it desperately wants to get there.",
          exerciseId: "interval_click_major_7th",
          contentBlocks: [
            {
              type: "text",
              body: "The widest interval before the octave, and one fret below it: two strings higher, one fret up from the root.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 7, [
                { root: [6, 5], tones: [{ semitones: 11, on: 4, label: "7" }, { semitones: 12, on: 4, label: "8" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Music",
              label: "Where you've heard it",
              body: "The leap in the chorus of Take On Me, 'Take' to 'on'. Bare, it sounds sharp and almost wrong.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Harsh alone, gorgeous in a chord",
              body: "Play just the root and the major 7th together and it grinds. Now play a full maj7 chord: suddenly it's the dreamiest sound on the guitar. Same two notes. An interval's character depends on what's standing around it, which is why you learn them alone first.",
            },
          ],
        }),
        tuneStep("M7", "The last interval, and the most bittersweet. A major 7th sits one fret short of the octave, and that near miss is the whole sound of jazz and of every dreamy chord you have heard. One shape, the root and its major 7th, follows five chords around the neck, with the full arpeggio filling the gap between them. Only the final bar lets the 7th climb that last fret and come home."),
        earStep({
          id: "step_interval_ear_wide",
          title: "By Ear: Sixths & Sevenths",
          shortDescription: "Four wide leaps, each one fret apart from the next. The hardest listening step so far.",
          exerciseId: "ear_interval_sixths_sevenths",
          contentBlocks: [
            {
              type: "text",
              body: "Wide intervals are harder to hear because the two notes are far apart and your ear has less to hold on to. The fix is the same trick as on the neck: measure from the octave, not from the root.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "Sing up to the octave",
              body: "After the pair plays, sing the top note and slide your voice up until it matches the bottom note an octave higher. A tiny slide means major 7th. A clear step means minor 7th. If you had to travel further than that, it was a 6th.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Sweet or straining",
              body: "Sixths are comfortable: they sound like harmony. Sevenths strain upward. Decide that first and you've turned four options into two.",
            },
          ],
        }),
        playStep({
          id: "step_interval_play_wide",
          title: "Play: Sixths & Sevenths",
          shortDescription: "The wide ones, live. Use the shapes, not your counting finger.",
          exerciseId: "interval_hunt_sixths_sevenths",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Twelve seconds is not enough to count ten frets. It is plenty to drop onto a shape. All four answers sit two strings above the root, within a four-fret span:",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 7, [
                {
                  root: [6, 5],
                  tones: [
                    { semitones: 8, on: 4, label: "♭6" },
                    { semitones: 9, on: 4, label: "6" },
                    { semitones: 10, on: 4, label: "♭7" },
                    { semitones: 11, on: 4, label: "7" },
                  ],
                },
              ]),
            },
            {
              type: "callout",
              icon: "Compass",
              label: "One anchor",
              body: "The minor 7th is the same fret as the root, two strings up. Everything else is a step away from it: major 7th one fret higher, major 6th one fret lower, minor 6th two frets lower.",
            },
          ],
        }),
      ],
    },
    {
      id: "stage_7",
      label: "Secrets of the Neck",
      steps: [
        clickStep({
          id: "step_interval_inversions",
          title: "Flip It: The Rule of Nine",
          shortDescription: "Every interval has a twin. Learn the pairs and half of what you memorised becomes free.",
          exerciseId: "interval_click_inversion_pairs",
          stepIcon: "Repeat",
          contentBlocks: [
            {
              type: "text",
              body: "Take C and the E above it: a major 3rd. Now keep going up from that E to the next C. It's the same two note names, but the distance is a minor 6th.",
            },
            {
              type: "fretDiagram",
              diagram: marksDiagram(0, 4, [
                { string: 5, fret: 3, label: "C" },
                { string: 4, fret: 2, label: "E" },
                { string: 2, fret: 1, label: "C" },
              ]),
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "The rule of nine",
              body: "Flip any interval upside down and three things always happen. The two numbers add up to nine: 3rd and 6th, 4th and 5th, 2nd and 7th. Major becomes minor and minor becomes major. Perfect stays perfect. So a major 3rd flips into a minor 6th, and a minor 7th flips into a major 2nd.",
            },
            {
              type: "callout",
              icon: "Repeat",
              label: "And the tritone flips into itself",
              body: "Six frets up, six frets left to the octave. It is its own twin, the only interval that is. You saw this two stages ago; now you know why.",
            },
            {
              type: "callout",
              icon: "Guitar",
              label: "Why Smoke on the Water sounds like that",
              body: "A power chord is a root with a 5th above it. Put the root on top instead and the same two notes are a 4th apart. That flipped power chord is exactly how the Smoke on the Water riff is played: two strings, one finger, all 4ths. Same notes, different order, completely different sound.",
            },
          ],
        }),
        clickStep({
          id: "step_interval_warp_zone",
          title: "The Warp Zone: G to B",
          shortDescription: "The one pair of strings where every shape you know lands a fret off.",
          exerciseId: "interval_click_g_b_crossing",
          stepIcon: "Shuffle",
          contentBlocks: [
            {
              type: "text",
              body: "Here are two power chords. The shape on the low strings is the one you know: 5th two frets up. On the G and B strings the 5th is three frets up. Same interval, different shape.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 8, [
                { root: [5, 3], tones: [{ semitones: 7, on: 4, label: "5" }] },
                { root: [3, 5], tones: [{ semitones: 7, on: 2, label: "5" }] },
              ]),
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "One fret, one reason",
              body: "Every neighbouring pair of strings is tuned five frets apart, except G to B, which is four. So anything that crosses from G to B, or jumps over that gap, has to move one fret higher to land on the same note. Not sometimes. Always, for every interval, every chord and every scale shape.",
            },
            {
              type: "callout",
              icon: "Info",
              label: "Why would anyone tune it that way",
              body: "If all six strings were 4ths apart, the top string would be an F and the open strings would make an ugly chord. Narrowing one gap lets the two outer strings both be E, which is why barre chords and open chords fit under one hand. The warp is the price of playable chords.",
            },
            {
              type: "callout",
              icon: "MousePointerClick",
              label: "In this drill",
              body: "Only the G and B strings are live. Put the root on the G string whenever you can, so the answer has to cross. Every answer will sit one fret higher than your hand expects.",
            },
          ],
        }),
        tuneStep("P8", "Time to put the warp zone under your fingers. An octave is the same note again, twelve frets higher, and guitarists play it as a two-finger shape. On the low strings that shape is two frets wide. Halfway through this riff it moves to the higher strings, has to cross from G to B, and becomes three frets wide. Same interval, different shape, exactly as the last step promised."),
        earStep({
          id: "step_interval_smooth_rough",
          title: "Two Notes at Once: Smooth or Rough",
          shortDescription: "Intervals played together are textures, not distances. And one of them explains distortion.",
          exerciseId: "ear_interval_blend",
          stepIcon: "AudioWaveform",
          contentBlocks: [
            {
              type: "text",
              body: "So far every pair was played one note after the other. Strike them together and something else happens: you stop hearing a distance and start hearing a texture. Hollow, sweet, restless, grinding.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Why power chords exist",
              body: "Distortion doesn't just make a sound louder, it manufactures extra notes out of whatever you feed it. Feed it a 5th and the extra notes land on the root and its octaves, so the chord sounds bigger. Feed it a major 3rd and they land on notes that clash, and you get mud. Rock guitarists didn't drop the 3rd to be simple. They dropped it because the amp told them to.",
            },
            {
              type: "callout",
              icon: "SlidersHorizontal",
              label: "Your major 3rd is always a little sour",
              body: "Remember the ratios from the tuning step? A pure major 3rd is 5:4, but frets can't hit that and still work in every key. Every major 3rd on a guitar is slightly sharp of pure. In an E-shape chord the 3rd lives on the G string, which is why that string never quite sounds in tune however carefully you tune it.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "What to listen for",
              body: "Five textures. Octave: one sound, just thicker. 5th: hollow and strong. Major 3rd: sweet, with a slow shimmer. Tritone: restless. Minor 2nd: two notes grinding against each other.",
            },
          ],
        }),
      ],
    },
    {
      id: "stage_8",
      label: "Mastery",
      steps: [
        clickStep({
          id: "step_interval_exam_neck",
          title: "Exam: Every Interval on the Neck",
          shortDescription: "All eleven intervals, all twelve roots, the whole neck. No single shape to lean on.",
          exerciseId: "interval_click_whole_fretboard",
          stepIcon: "Globe",
          contentBlocks: [
            {
              type: "text",
              body: "Everything from the click steps at once. Any root, sharps included, and any interval inside the octave. The ruler from the very first step is still the whole answer key:",
            },
            { type: "fretDiagram", diagram: rulerDiagram(6) },
            {
              type: "callout",
              icon: "Compass",
              label: "Small from the root, wide from the octave",
              body: "Up to the 5th, build up from the root. Past it, find the octave shape and come back: one fret for the major 7th, two for the minor 7th, three for the major 6th, four for the minor 6th.",
            },
            {
              type: "callout",
              icon: "AlertCircle",
              label: "Mind the warp",
              body: "Place your root on the low E, A or D string when you can. If the answer has to cross from G to B, add a fret.",
            },
          ],
        }),
        earStep({
          id: "step_interval_exam_ear",
          title: "Exam: Every Interval by Ear",
          shortDescription: "All twelve, going up or coming down. The full ear test.",
          exerciseId: "ear_interval_all_twelve",
          contentBlocks: [
            {
              type: "text",
              body: "Twelve possible answers, and for the first time some pairs come down instead of going up. A descending interval is the same distance heard backwards, and the inversion step gave you the tool for it.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "Three buckets first",
              body: "Don't choose between twelve. Choose between three: small (2nds and 3rds), middle (4th, tritone, 5th) or wide (6ths, 7ths, octave). Then you're picking from four at most, and you've trained each of those groups already.",
            },
            {
              type: "callout",
              icon: "Repeat",
              label: "When it comes down",
              body: "Sing the lower note first, then the upper one. You've just turned it into an ascending interval, and it's the same size either way.",
            },
          ],
        }),
        playStep({
          id: "step_interval_exam_play",
          title: "Final: Play Every Interval",
          shortDescription: "Any root, any interval, straight to the note on your guitar. The whole path in one exam.",
          exerciseId: "interval_hunt_all_eleven",
          stepIcon: "Crown",
          contentBlocks: [
            {
              type: "text",
              body: "The last one. A root and an interval appear, and you play the answer. Eleven intervals, twelve roots, twelve seconds each, and a different four-fret window every round. No buttons to choose from: just the slice of neck you're given.",
            },
            {
              type: "fretDiagram",
              diagram: shapeDiagram(3, 9, [
                {
                  root: [6, 5],
                  tones: [
                    { semitones: 1, on: 6, label: "♭2" },
                    { semitones: 2, on: 6, label: "2" },
                    { semitones: 3, on: 6, label: "♭3" },
                    { semitones: 4, on: 6, label: "3" },
                    { semitones: 5, on: 5, label: "4" },
                    { semitones: 6, on: 5, label: "♭5" },
                    { semitones: 7, on: 5, label: "5" },
                    { semitones: 8, on: 5, label: "♭6" },
                    { semitones: 9, on: 5, label: "6" },
                    { semitones: 10, on: 4, label: "♭7" },
                    { semitones: 11, on: 4, label: "7" },
                    { semitones: 12, on: 4, label: "8" },
                  ],
                },
              ]),
            },
            {
              type: "callout",
              icon: "Trophy",
              label: "This is the whole map",
              body: "Every interval there is, inside one hand position, from one root. Move the root and the entire picture moves with it. That's what you've actually learned on this path: not twelve facts, but one shape you can carry anywhere on the neck.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "What it unlocks",
              body: "A chord is a root plus intervals. A scale is a root plus intervals. A melody is one interval after another. From here on, anything you learn on the guitar is something you can take apart, name and rebuild somewhere else.",
            },
          ],
        }),
      ],
    },
  ]),
};
