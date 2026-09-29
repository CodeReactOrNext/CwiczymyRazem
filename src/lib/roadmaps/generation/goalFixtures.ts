import type { RoadmapLevel } from "./levels";
import type { PreflightVerdict } from "./preflight";
import type { BankQuestionId } from "./questionBank";

/**
 * Goals the preflight is measured against — the ones players actually type,
 * the ones from the generated roadmaps, and the edge cases the bank was
 * designed around. Each says what the model must ask, must not ask, and
 * which verdict it must reach. `scripts/roadmapPreflightProbe` runs them
 * against the live model and reports the misses; it is how the prompt gets
 * tuned, and how a change to the bank is checked before it ships.
 */
export interface GoalFixture {
  name: string;
  goal: string;
  title?: string;
  level: RoadmapLevel;
  verdict: PreflightVerdict;
  /** Ids the pick has to contain. */
  mustAsk: BankQuestionId[];
  /** Ids the pick must not contain. */
  mustNotAsk: BankQuestionId[];
  /** The most questions this goal deserves, custom ones included. */
  maxQuestions?: number;
}

export const GOAL_FIXTURES: GoalFixture[] = [
  {
    name: "artist — Mayer",
    goal: "I want to play like John Mayer: the thumb-chord rhythm playing, his blues lead phrasing and the acoustic groove stuff.",
    title: "Play like John Mayer",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["sides", "songs"],
    mustNotAsk: ["startingPoint", "target", "focus", "useFor"],
  },
  {
    name: "artist with songs — Knopfler",
    goal: "I want to play fingerstyle like Mark Knopfler: pick-less right hand with thumb and two fingers, working towards Sultans of Swing, Romeo and Juliet and Brothers in Arms.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["songs"],
    mustNotAsk: ["startingPoint", "focus", "useFor"],
  },
  {
    name: "artist — Hetfield rhythm",
    goal: "Metal rhythm guitar like James Hetfield: relentless downpicking, palm-muted gallops, tight power-chord riffs, working through Enter Sandman, Master of Puppets and One.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["songs"],
    mustNotAsk: ["focus", "useFor", "startingPoint"],
  },
  {
    name: "genre — jazz",
    goal: "I want to play jazz guitar: comping through standards, walking a bass line under chords, and soloing over changes without getting lost.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["sides"],
    mustNotAsk: ["replicateOrCreate", "focus", "useFor"],
  },
  {
    name: "technique — legato",
    goal: "I want to improve my legato: hammer-ons and pull-offs that sound even, and long runs that do not fall apart at speed.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["useFor", "startingPoint"],
    mustNotAsk: ["songs", "ending", "sides", "weakSpot", "focus"],
  },
  {
    name: "technique with a number — alternate picking",
    goal: "Alternate picking: clean sixteenth notes at 160 BPM on scales and riffs, without tension in the picking hand.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: ["startingPoint", "target"],
    mustNotAsk: [
      "songs",
      "ending",
      "sides",
      "weakSpot",
      "focus",
      "replicateOrCreate",
    ],
  },
  {
    name: "absolute beginner — first chord",
    goal: "I have never played guitar. I want to play my first chord and switch between two chords cleanly.",
    level: "Absolute Beginner",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: [
      "sides",
      "weakSpot",
      "startingPoint",
      "target",
      "replicateOrCreate",
      "focus",
      "ending",
    ],
    maxQuestions: 1,
  },
  {
    name: "single song — Wonderwall",
    goal: "I want to learn Wonderwall by Oasis all the way through, strumming and singing.",
    level: "Beginner",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: [
      "sides",
      "focus",
      "useFor",
      "startingPoint",
      "weakSpot",
      "repertoireDepth",
    ],
    maxQuestions: 2,
  },
  {
    name: "comeback",
    goal: "I'm coming back after a few months off. I want to rebuild my playing without injury and relearn a few songs I used to play.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: ["sides", "focus", "replicateOrCreate", "repertoireDepth"],
  },
  {
    name: "strumming",
    goal: "I want to master strumming and rhythm guitar: 8th and 16th-note patterns, accents and muting, keeping time with a metronome, through well-known pop and folk songs.",
    level: "Beginner",
    verdict: "ok",
    mustAsk: ["songs"],
    mustNotAsk: ["replicateOrCreate", "sides", "focus", "useFor"],
  },
  {
    name: "vague — get better",
    goal: "I just want to get better at guitar.",
    level: "Beginner",
    verdict: "too_vague",
    mustAsk: ["focus"],
    mustNotAsk: ["sides", "songs", "startingPoint", "target", "weakSpot"],
  },
  {
    name: "vague — play faster",
    goal: "play faster",
    level: "Intermediate",
    verdict: "too_vague",
    mustAsk: ["focus"],
    mustNotAsk: ["sides", "songs", "weakSpot"],
  },
  {
    name: "improvisation",
    goal: "I want to improvise over blues in any key and stop getting lost in the solo.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: ["replicateOrCreate", "focus", "useFor"],
  },
  {
    name: "obscure artist",
    goal: "I want to play exactly like Zbigniew Kowalczyk-Brzęczyszczykiewicz, the local wedding guitarist from my village, his signature style.",
    level: "Intermediate",
    verdict: "too_obscure",
    mustAsk: [],
    mustNotAsk: ["sides", "songs", "weakSpot"],
  },
  {
    name: "not guitar — piano",
    goal: "I want to learn Für Elise on the piano and read sheet music.",
    level: "Beginner",
    verdict: "not_guitar",
    mustAsk: [],
    mustNotAsk: [],
    maxQuestions: 0,
  },
  {
    name: "not guitar — nonsense",
    goal: "Write me a business plan for a bakery in Kraków.",
    level: "Beginner",
    verdict: "not_guitar",
    mustAsk: [],
    mustNotAsk: [],
    maxQuestions: 0,
  },
  {
    name: "bass",
    goal: "I want to play bass like Flea: slap, fingerstyle funk grooves and locking in with the drums.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: ["focus", "useFor"],
  },
  {
    name: "advanced artist — Petrucci",
    goal: "Play like John Petrucci: alternate-picked runs, odd meters, wide-interval legato and the melodic side of his soloing.",
    level: "Advanced",
    verdict: "ok",
    mustAsk: ["sides"],
    mustNotAsk: ["entry", "focus", "useFor", "startingPoint"],
  },
  {
    name: "acoustic fingerstyle singer-songwriter",
    goal: "Fingerstyle accompaniment for singing: Travis picking, bass-and-melody patterns, songs like Blackbird and Dust in the Wind.",
    level: "Beginner",
    verdict: "ok",
    mustAsk: ["songs"],
    mustNotAsk: ["sides", "focus", "useFor", "startingPoint"],
  },
  {
    name: "theory — fretboard",
    goal: "I want to finally understand the fretboard: find any note, see the CAGED shapes, and know which scale fits which chord.",
    level: "Intermediate",
    verdict: "ok",
    mustAsk: [],
    mustNotAsk: ["songs", "ending", "sides", "weakSpot", "replicateOrCreate"],
  },
];
