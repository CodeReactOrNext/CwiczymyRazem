import type {
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { v4 as uuidv4 } from "uuid";

import type { SongRequest } from "../songLookup";
import {
  briefForModel,
  briefSongByRequest,
  catalogKeep,
  ensureRequiredSongs,
  type RoadmapBrief,
} from "./brief";
import {
  DIFFICULTY_FOR_LEVEL,
  findCatalogEntry,
  renderExerciseCatalog,
} from "./exerciseCatalog";
import { HOUSE_VOICE } from "./houseVoice";
import { LEVEL_RULES, type RoadmapLevel } from "./levels";
import { OVERUSED_EXERCISE_IDS, STRUCTURE_LIMITS } from "./limits";
import { completeJson, GenerationError, STRUCTURE_MODEL } from "./openaiJson";
import { checkSkeleton } from "./skeletonChecks";
import type { UsageLedger } from "./usage";

export { STRUCTURE_LIMITS } from "./limits";

export type SkillType = "physical" | "conceptual" | "musical";

/** How an exercise relates to its step: it trains the step, or it warms up for it. */
export type ExerciseFit = "direct" | "support";

export interface StructureStep {
  title: string;
  skillType: SkillType;
  suggestedExerciseId: string | null;
  exerciseWhy: string;
  /**
   * "direct" when the exercise trains exactly this step, "support" when it is
   * only a related warm-up. Absent on steps proposed before the field existed.
   */
  exerciseFit?: ExerciseFit | null;
  /** One sentence: what the student does in this step. Absent on older steps. */
  gist?: string;
  /** The one real song a repertoire step is about; null on every other step. */
  songTitle: string | null;
  songArtist: string | null;
}

/**
 * What the generator knows beyond the goal and the brief: the player's own
 * practice history, and which songs by the goal's artists the library holds.
 * Both are context the prompt reads, neither is a constraint.
 */
export interface StructureExtras {
  /** Lines from `playerFacts`, already rendered. */
  profile?: string;
  /** Songs with a tab in the app that fit the goal, to pick repertoire from. */
  librarySongs?: RoadmapSongRef[];
}

/** The model's skeleton, before the reviewer or the library have seen it. */
export interface StructurePhase {
  title: string;
  steps: StructureStep[];
}

interface StructureOutput {
  guitarRelated: boolean;
  rejectionReason: string;
  phases: StructurePhase[];
}

export interface StructureReview {
  /** Everything the reviewer found, most serious first. */
  issues: string[];
  suggestions: string[];
  /** False when the draft had to be rewritten. */
  isValid: boolean;
  /** How many of the issues change the plan's shape. Absent on older tickets. */
  shapeIssues?: number;
  /** What the code checks found on the draft, before the reviewer read it. */
  mechanical?: string[];
}

/** The reviewer's answer as the model gives it, before it is flattened. */
interface ReviewOutput {
  issues: { text: string; severity: "shape" | "detail" }[];
  suggestions: string[];
}

export interface GeneratedStructure {
  phases: RoadmapPhase[];
  /**
   * What was found on the first draft, whether it was redone, and what the
   * code checks still find on the plan that was kept.
   */
  review: StructureReview & { revised: boolean; remaining?: string[] };
  /** Exercise ids the model invented; they were dropped from the steps. */
  unknownExerciseIds: string[];
  /** Songs the steps named that the library does not have; those steps got none. */
  unmatchedSongs: SongRequest[];
  /** Technique steps nothing in the library trains — what the library lacks. */
  stepsWithoutExercise?: string[];
}

/** Which library song a step names, resolved against the `songs` collection. */
export type SongResolver = (
  request: SongRequest,
) => Promise<RoadmapSongRef | null>;

/** Finds a library exercise for one step; ids best first, empty when nothing fits. */
export type ExerciseMatcher = (params: {
  stepTitle: string;
  description: string;
  goal: string;
  level: RoadmapLevel | string;
  ledger?: UsageLedger;
}) => Promise<string[]>;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const STRUCTURE_SCHEMA = {
  type: "object",
  properties: {
    guitarRelated: {
      type: "boolean",
      description: "false only when the goal is not about playing guitar",
    },
    rejectionReason: {
      type: "string",
      description:
        "Why the goal was rejected; empty when guitarRelated is true",
    },
    phases: {
      type: "array",
      minItems: STRUCTURE_LIMITS.phases.min,
      maxItems: STRUCTURE_LIMITS.phases.max,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          steps: {
            type: "array",
            minItems: STRUCTURE_LIMITS.stepsPerPhase.min,
            maxItems: STRUCTURE_LIMITS.stepsPerPhase.max,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                skillType: {
                  type: "string",
                  enum: ["physical", "conceptual", "musical"],
                },
                suggestedExerciseId: {
                  type: ["string", "null"],
                  description:
                    "An id copied exactly from the exercise library, or null",
                },
                exerciseWhy: {
                  type: "string",
                  description:
                    "One sentence: why this exercise trains this step, or why none fits",
                },
                exerciseFit: {
                  type: ["string", "null"],
                  enum: ["direct", "support", null],
                  description:
                    '"direct" when the exercise trains exactly this step; "support" when it is only a related warm-up; null when suggestedExerciseId is null',
                },
                gist: {
                  type: "string",
                  description:
                    "One plain sentence, at most 25 words: what the student actually does in this step",
                },
                songTitle: {
                  type: ["string", "null"],
                  description:
                    "Only on a step about ONE real song: its exact original title. Otherwise null",
                },
                songArtist: {
                  type: ["string", "null"],
                  description:
                    "The artist of that original recording. Null whenever songTitle is null",
                },
              },
              required: [
                "title",
                "skillType",
                "suggestedExerciseId",
                "exerciseWhy",
                "exerciseFit",
                "gist",
                "songTitle",
                "songArtist",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["title", "steps"],
        additionalProperties: false,
      },
    },
  },
  required: ["guitarRelated", "rejectionReason", "phases"],
  additionalProperties: false,
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          severity: {
            type: "string",
            enum: ["shape", "detail"],
            description:
              '"shape" when fixing it adds, removes or moves a phase or several steps, or the plan misses the goal or the brief; "detail" when it is one step\'s wording, exercise or position',
          },
        },
        required: ["text", "severity"],
        additionalProperties: false,
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["issues", "suggestions"],
  additionalProperties: false,
};

// ─── Prompts ─────────────────────────────────────────────────────────────────

const STRUCTURE_SYSTEM = `You are the curriculum author for riff.quest, a guitar practice app. You write the skeleton of a multi-month roadmap: phases, steps, and which exercise from the app's library each step practises. A human editor polishes what you write, so be specific and opinionated rather than safe and generic.

${LEVEL_RULES}

---

GOAL RULES:

Specific guitarist (SRV, Hendrix, Mayer, Petrucci…):
- Build the whole plan around their signature techniques, sound and songs. Name the real things: the chord they are known for, the tuning, the rig, the songs — as steps.
- Only include what you are certain is theirs.
- Late phases are repertoire (real songs, hardest last) and performance in their style — never generic "integration".

Genre (blues, metal, jazz, bluegrass, fingerstyle):
- Techniques and repertoire typical for that genre; the final phases are genre-specific playing situations (a jam, a band, a set).

Specific song:
- Work backwards from the song's techniques; the song is the target of the last phases.

Vague goal ("get better", "fundamentals", "play faster"):
- Pick a concrete interpretation that fits the level and say so in the phase titles.

---

HOW A GOOD ROADMAP READS (these are real phase and step titles from the app's curated roadmaps):

Hendrix (Intermediate): "The R&B School" → Thumb over the neck | Partial shapes: two or three notes of a chord | Sliding sixths and soul double stops | Left-hand muting and the percussive strum … "Dominant Harmony and Chord Riffs" → The Hendrix chord: 7#9 | Chord riffs: riffing off a shape … "Songs" → Hey Joe: the R&B chord part | Little Wing: the embellishment masterclass | Red House: the slow blues.

Rhythm Guitar Basics (Beginner): "Time" → Quarter-note pulse | Rests, long notes and clean stops … "Open Chords" → Common open chords | Smooth chord changes | Bass note awareness … "Feel" → Eighth-note feel | Accent placement | Palm muting basics.

${HOUSE_VOICE}

STEP TITLES — a specific skill, 2–8 words, written for this goal. A song title, a chord name, a tuning or a technique variant is welcome. Plain nouns; no adjectives that sell ("Essential", "Powerful", "Ultimate", "Mastering").
BAD (generic, appear in every roadmap, forbidden unless the goal is literally that): "Basic strumming patterns", "Finger independence", "Palm muting control", "Alternate picking basics", "Downstroke endurance", "Power chord shapes", "Two-handed tapping".
BAD (exercise-shaped): "Legato — exercise 1-2-3-4", "Minor pentatonic at 70 BPM".

---

PEDAGOGY — these override any naive "all technique first, music last" ordering:

1. THE GOAL IS THE THROUGH-LINE. Whatever the student wants to DO (improvise, play a song, play a style), they do a simplified version of it from phase 1 — never gate the target behind dozens of prerequisites. When the plan has song steps at all, the first one — a short fragment at reduced tempo — sits in the first third of the phases; the full versions stay late. A plan whose every song is in the last phases is wrong.
2. THREAD EAR & LISTENING THROUGHOUT. Ear training, singing what you play, call-and-response, transcribing short phrases from real records: spread across many phases starting early.
3. CONNECT THEORY TO SOUND. Every scale arrives with the harmony it works over (chord–scale relationship, chord tones, intervals).
4. RUTHLESS PRIORITISATION. Every step sits on the critical path to THIS goal. Fewer, well-aimed steps beat a catalogue.
5. USE CONSTRAINTS for creative skills — two notes, one string, one rhythm — rather than more technique.
6. ORDER BY DEPENDENCY, but interleave musicianship (rhythm, phrasing, ear) with technique from the start.
7. NO DUPLICATES. Each concrete skill appears exactly once, at the earliest phase it is needed. If a later phase needs more of the same skill, that is the same step at a harder level — not a second step with a different label. Before finishing, scan your own phases for two steps that are really the same thing (same technique, same exercise, same "why") and merge or cut one.
8. NO ONE-OFF TASKS. Every step is something the student DOES, repeatedly, across several practice sessions. Never a single checklist or reference task — changing strings, setting amp knobs, reading about gear once. If tone or gear genuinely matters to the goal, make it a repeatable listening or matching skill ("dialling in the tone by ear against a reference recording"), not a setup note. A step is never named after a piece of equipment — no pickup, pedal, amp or guitar model in a title ("EMG 81 bridge attack", "CE-1 chorus depth" are wrong); the student plays what they own.
9. A SONG IS NOT A TEMPLATE. When a song gets several steps, each one is about a different problem of THAT song — the bar that breaks, the stretch, the change, the feel — named in the title. Never the same ladder of tempo stages ("reduced tempo", "70–85%", "album tempo", "recorded take") repeated for every song.

---

EXERCISE LIBRARY — you get the app's whole exercise library as lines "id | title | difficulty | category | skills | what it trains". For each step:
- Copy the id EXACTLY as written, or use null. Never invent an id.
- Prefer an exercise whose skills and difficulty fit the step and the level; library difficulty for each level: Absolute Beginner → beginner, easy; Beginner → beginner, easy, medium; Intermediate → easy, medium, hard; Advanced → medium, hard.
- "… — Pick Your Chords" / "… — Pick Your Scale" style configurable exercises fit any chord-change or scale step; song-specific and listening steps often have no exercise — null is the honest answer there.
- Do not put the same exercise on more than ${STRUCTURE_LIMITS.maxExerciseReuse} steps.
- exerciseFit says how honest the match is. "direct": the exercise trains exactly what the step is about — doing the exercise IS doing the step. "support": it is only related — a warm-up for the same hand, the same rhythm family, the same ear skill — and the step's own material (a song's riff, a specific phrase, a record) is not in it. A general ear-training or timing exercise on a step about one song's riff is "support" at best. When you cannot say which, it is "support". Null when there is no exercise.
- These exercises fit almost anything, which is why they end up in every roadmap: ${OVERUSED_EXERCISE_IDS.join(", ")}. Use one only on a step that is exactly about what it trains (string muting, the metronome dropping out, dynamics, matching a tone, the pocket) — never as a default for a step with no better match. Null is better.
- A technique step ("physical") with no exercise is a gap: look through the library once more for one that drills that motion before settling on null.
- gist: one plain sentence saying what the student actually does in the step — the material, the motion, what they play it over. It is read by whoever writes the other phases, so it names the concrete thing.
- skillType: "physical" (a motion, coordination, technique), "conceptual" (theory, harmony, fretboard knowledge), "musical" (ear, phrasing, improvising, repertoire, performance). It decides how the step is later described.

---

SONGS — songTitle and songArtist:
- Set them ONLY on a repertoire step that is about learning ONE real song ("Little Wing: the embellishment masterclass" → "Little Wing" / "Jimi Hendrix"). Exact original title, the artist of the original recording.
- Every other step — a technique, a chord, a scale, a feel, a step that only mentions songs as examples, a step about several songs — gets null for both.
- Never invent a song. The app links the step to its own song library only when the song is really there; a wrong title links nothing.
- When a LIBRARY SONGS list is given, those songs have a tab and a backing track in the app. Pick the repertoire from that list first, with the title and artist copied exactly as listed. A song outside the list is allowed when the goal cannot do without it, but that step will have no tab — so one or two at most, never the bulk of the repertoire.

---

SIZE — the goal decides it, between ${STRUCTURE_LIMITS.phases.min} and ${STRUCTURE_LIMITS.phases.max} phases of ${STRUCTURE_LIMITS.stepsPerPhase.min}–${STRUCTURE_LIMITS.stepsPerPhase.max} steps:
- Narrow (one song, one technique, one habit to fix): 3–4 phases, 10–18 steps in all.
- Medium (a handful of songs, one side of a style, one area of theory): 4–6 phases, 18–30 steps.
- Wide (playing like an artist, a whole genre, general ability at a level): 6–8 phases, 30–45 steps.
Decide which one the goal is before writing a phase. Never pad a narrow goal up to a wide plan — a student who asked for one song does not want a year of work. Phase titles are short themes ("The Lead Voice", "The Sound", "Songs"), not sentences.

GUARD: if the goal is not about playing or learning guitar, set guitarRelated=false, fill rejectionReason, and return the minimum phases the schema allows with placeholder titles.`;

/** The context blocks every skeleton prompt shares, each present only when it has something to say. */
export const renderExtras = (extras?: StructureExtras | null): string => {
  const blocks: string[] = [];
  if (extras?.profile?.trim()) {
    blocks.push(
      `STUDENT PROFILE — measured by the app from their practice history. Context, not constraints: use it to skip what they already do a lot of and to start nearer where they really are.\n${extras.profile.trim()}`,
    );
  }
  if (extras?.librarySongs?.length) {
    blocks.push(
      `LIBRARY SONGS — these have a tab in the app; pick the repertoire from them first:\n${extras.librarySongs
        .map((song) => `- "${song.title}" — ${song.artist}`)
        .join("\n")}`,
    );
  }
  return blocks.join("\n\n");
};

const buildStructureUser = (
  goal: string,
  level: RoadmapLevel,
  brief?: RoadmapBrief | null,
  extras?: StructureExtras | null,
) => {
  const constraints = briefForModel(brief);
  const context = renderExtras(extras);
  return `Goal: "${goal}"
Skill level: ${level}

For the "${level}" level do NOT include basics the student already has. If the goal names a guitarist, style or song, the whole plan is about that — not general guitar learning.
${constraints ? `\n${constraints}\n` : ""}${context ? `\n${context}\n` : ""}
EXERCISE LIBRARY:
${renderExerciseCatalog(catalogKeep(brief))}`;
};

const REVIEW_SYSTEM = `You are a senior guitar curriculum designer reviewing a roadmap skeleton before it is written out in full.

Judge it on:
1. Goal alignment — does every phase move the student towards the stated goal? Would a fan of the guitarist/style recognise it as theirs?
2. Level fit — nothing the level already has; nothing out of reach too early.
3. Specificity — are steps concrete skills for this goal, or generic titles that could sit in any roadmap? Name the generic ones.
4. Order — prerequisites first, but the goal itself tasted early, ear and rhythm interleaved rather than dumped at the end.
5. Gaps and misplacements — missing essentials; steps in the wrong phase.
6. Duplicates — two steps (in the same phase or different ones) that teach the same skill under different words, or share the same exercise for no reason. Name both titles and say which one to cut or what to merge them into.
7. One-off tasks — a step that is really a single checklist item (change strings, set an amp knob, read about a pedal) rather than a skill practised over several sessions. Name it and say what repeatable skill it should become, or that it should be cut.
8. The student's brief — when a STUDENT BRIEF is given, every line of it is a hard constraint: a required song with no step, a side they excluded that still has a phase, a tone phase they declined, a creative step where they asked for the record. Each breach is an issue, and the brief wins over the general pedagogy where the two disagree.

9. Size — a narrow goal (one song, one technique) stretched to a wide plan, or a wide one squeezed into a few steps.
10. Honest exercises — a step marked "direct" whose exercise does not contain the step's own material (a general ear or timing drill on a step about one song's riff) should be "support" or have none.

Rules:
- "issues" = problems that make the roadmap worse than a good teacher's plan. Each is one sentence naming actual phase/step titles and what to do instead, with a severity:
  - "shape": fixing it adds, removes or moves a phase or several steps, or the plan misses the goal or breaks the brief.
  - "detail": one step's title, exercise or position.
- Report only what is really wrong. There is no number to reach: a sound draft has an empty list, and that is the expected answer for a good plan. Do not split one problem into several, and do not report a taste preference as an issue.
- "suggestions" = optional improvements, at most 3, often none.
- The CODE CHECKS block, when present, lists what an automatic check already found. Do not repeat those; they will be fixed either way.`;

const renderStructure = (phases: StructurePhase[]) =>
  phases
    .map(
      (phase, index) =>
        `Phase ${index + 1}: ${phase.title}\n${phase.steps
          .map(
            (step, stepIndex) =>
              `  ${stepIndex + 1}. ${step.title} [${step.skillType}${
                step.suggestedExerciseId
                  ? `, exercise: ${step.suggestedExerciseId}${step.exerciseFit ? ` (${step.exerciseFit})` : ""}`
                  : ""
              }${step.songTitle ? `, song: ${step.songTitle} — ${step.songArtist ?? "?"}` : ""}]${
                step.gist?.trim() ? ` — ${step.gist.trim()}` : ""
              }`,
          )
          .join("\n")}`,
    )
    .join("\n\n");

// ─── Pipeline ────────────────────────────────────────────────────────────────

const STRUCTURE_TOKENS = 20000;
const REVIEW_TOKENS = 4000;

const generateDraft = (
  goal: string,
  level: RoadmapLevel,
  ledger?: UsageLedger,
  brief?: RoadmapBrief | null,
  extras?: StructureExtras | null,
) =>
  completeJson<StructureOutput>({
    system: STRUCTURE_SYSTEM,
    user: buildStructureUser(goal, level, brief, extras),
    schemaName: "roadmap_structure",
    schema: STRUCTURE_SCHEMA,
    maxTokens: STRUCTURE_TOKENS,
    model: STRUCTURE_MODEL,
    reasoningEffort: "medium",
    ledger,
  });

const reviewDraft = (
  goal: string,
  level: RoadmapLevel,
  phases: StructurePhase[],
  ledger?: UsageLedger,
  brief?: RoadmapBrief | null,
  mechanical: string[] = [],
) => {
  const constraints = briefForModel(brief);
  return completeJson<ReviewOutput>({
    system: REVIEW_SYSTEM,
    user: `Goal: "${goal}"\nSkill level: ${level}\n${
      constraints ? `\n${constraints}\n` : ""
    }${
      mechanical.length
        ? `\nCODE CHECKS (already found, do not repeat):\n${mechanical.map((issue) => `- ${issue}`).join("\n")}\n`
        : ""
    }\nRoadmap skeleton:\n${renderStructure(phases)}`,
    schemaName: "roadmap_review",
    schema: REVIEW_SCHEMA,
    maxTokens: REVIEW_TOKENS,
    model: STRUCTURE_MODEL,
    reasoningEffort: "low",
    ledger,
  });
};

const reviseDraft = (
  goal: string,
  level: RoadmapLevel,
  phases: StructurePhase[],
  review: Pick<StructureReview, "issues" | "suggestions">,
  ledger?: UsageLedger,
  brief?: RoadmapBrief | null,
  extras?: StructureExtras | null,
) =>
  completeJson<StructureOutput>({
    system: STRUCTURE_SYSTEM,
    user: `${buildStructureUser(goal, level, brief, extras)}

---

YOUR PREVIOUS DRAFT:
${renderStructure(phases)}

A senior reviewer found these problems — fix every one of them and keep everything that was good:
${review.issues.map((issue) => `- ${issue}`).join("\n")}
${review.suggestions.length ? `\nWorth doing too:\n${review.suggestions.map((s) => `- ${s}`).join("\n")}` : ""}

Fix each issue with the smallest change that actually fixes it: edit the offending step in place, move it, or cut it. Do NOT fix an issue by adding a new step next to the old one for the same skill — that creates the exact duplicate rule 7 above forbids. When you are done, no two steps anywhere in the roadmap should teach the same specific skill under different words.

Return the complete revised roadmap.`,
    schemaName: "roadmap_structure",
    schema: STRUCTURE_SCHEMA,
    maxTokens: STRUCTURE_TOKENS,
    model: STRUCTURE_MODEL,
    reasoningEffort: "medium",
    ledger,
  });

/**
 * Turns the model's skeleton into app phases. Unknown exercise ids are
 * dropped and reported; an exercise used too often keeps its first uses only.
 */
export const toRoadmapPhases = (
  phases: StructurePhase[],
  level: RoadmapLevel,
): {
  phases: RoadmapPhase[];
  unknownExerciseIds: string[];
  /** The songs the steps named, by step id — for the library to confirm. */
  songRequests: { stepId: string; request: SongRequest }[];
} => {
  const unknown: string[] = [];
  const songRequests: { stepId: string; request: SongRequest }[] = [];
  const uses = new Map<string, number>();
  const allowed = new Set(DIFFICULTY_FOR_LEVEL[level] ?? []);

  const result = phases.map((phase, phaseIdx) => ({
    id: uuidv4(),
    title: phase.title.trim() || `Phase ${phaseIdx + 1}`,
    order: phaseIdx,
    steps: phase.steps.map((step, stepIdx): RoadmapStep => {
      let exerciseId: string | undefined;
      if (step.suggestedExerciseId) {
        const entry = findCatalogEntry(step.suggestedExerciseId);
        if (!entry) {
          unknown.push(step.suggestedExerciseId);
        } else {
          const count = uses.get(entry.id) ?? 0;
          const fitsLevel = allowed.size === 0 || allowed.has(entry.difficulty);
          if (count < STRUCTURE_LIMITS.maxExerciseReuse && fitsLevel) {
            exerciseId = entry.id;
            uses.set(entry.id, count + 1);
          }
        }
      }
      const id = uuidv4();
      const songTitle = step.songTitle?.trim();
      const songArtist = step.songArtist?.trim();
      const request =
        songTitle && songArtist
          ? { title: songTitle, artist: songArtist }
          : undefined;
      if (request) songRequests.push({ stepId: id, request });
      const summary = step.gist?.trim();
      const why = step.exerciseWhy?.trim();
      return {
        id,
        title: step.title.trim() || `Step ${stepIdx + 1}`,
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 0,
        order: stepIdx,
        skillType: step.skillType,
        ...(summary ? { summary } : {}),
        ...(exerciseId
          ? {
              suggestedExerciseId: exerciseId,
              ...(step.exerciseFit === "support"
                ? { exerciseRole: "support" as const }
                : {}),
              ...(why ? { exerciseWhy: why } : {}),
            }
          : {}),
        // Kept until the library confirms the song, so a step whose song is
        // added later can still find it.
        ...(request ? { songRequest: request } : {}),
      };
    }),
  }));

  return { phases: result, unknownExerciseIds: unknown, songRequests };
};

/**
 * Puts the library songs the steps asked for onto them — the ones the library
 * actually has. A song the library lacks is reported and the step stays a
 * plain step that remembers what it asked for; it is never a step about a
 * song the app cannot open.
 */
export const attachLibrarySongs = async (
  phases: RoadmapPhase[],
  songRequests: { stepId: string; request: SongRequest }[],
  resolveSong: SongResolver,
): Promise<{ phases: RoadmapPhase[]; unmatchedSongs: SongRequest[] }> => {
  const byStep = new Map<string, RoadmapSongRef>();
  const unmatched: SongRequest[] = [];
  const cache = new Map<string, Promise<RoadmapSongRef | null>>();

  await Promise.all(
    songRequests.map(async ({ stepId, request }) => {
      const key = `${request.title.toLowerCase()}::${request.artist.toLowerCase()}`;
      let lookup = cache.get(key);
      if (!lookup) {
        lookup = resolveSong(request).catch(() => null);
        cache.set(key, lookup);
      }
      const song = await lookup;
      if (song) byStep.set(stepId, song);
      else unmatched.push(request);
    }),
  );

  return {
    phases: phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) => {
        const song = byStep.get(step.id);
        if (!song) return step;
        const linked: RoadmapStep = { ...step, suggestedSong: song };
        delete linked.songRequest;
        return linked;
      }),
    })),
    unmatchedSongs: unmatched,
  };
};

/** Technique steps get a second look at the library; this many per roadmap at most. */
const MAX_EXERCISE_FILLS = 6;

/**
 * One more search of the library for the technique steps that ended up with no
 * exercise — the model said null, or its pick was dropped for being off-level
 * or used too often. The matcher answers with nothing when nothing fits, so a
 * step can still come out bare: that is then a real gap in the library, and it
 * is reported as one.
 */
export const fillMissingExercises = async (
  phases: RoadmapPhase[],
  goal: string,
  level: RoadmapLevel,
  matchExercise: ExerciseMatcher,
  ledger?: UsageLedger,
): Promise<RoadmapPhase[]> => {
  const allowed = new Set(DIFFICULTY_FOR_LEVEL[level] ?? []);
  const uses = new Map<string, number>();
  phases.forEach((phase) =>
    phase.steps.forEach((step) => {
      if (!step.suggestedExerciseId) return;
      uses.set(
        step.suggestedExerciseId,
        (uses.get(step.suggestedExerciseId) ?? 0) + 1,
      );
    }),
  );

  const bare = phases
    .flatMap((phase) => phase.steps.map((step) => ({ phase, step })))
    .filter(
      ({ step }) =>
        step.skillType === "physical" &&
        !step.suggestedExerciseId &&
        !step.suggestedSong,
    )
    .slice(0, MAX_EXERCISE_FILLS);
  if (!bare.length) return phases;

  const candidates = await Promise.all(
    bare.map(({ step }) =>
      matchExercise({
        stepTitle: step.title,
        description: step.summary ?? "",
        goal,
        level,
        ledger,
      }).catch(() => [] as string[]),
    ),
  );

  // Picked one after another, so two steps cannot both take an exercise's
  // last allowed use.
  const picked = new Map<string, string>();
  bare.forEach(({ phase, step }, index) => {
    const inPhase = new Set(
      phase.steps
        .map((sibling) => picked.get(sibling.id) ?? sibling.suggestedExerciseId)
        .filter(Boolean),
    );
    const choice = candidates[index].find((id) => {
      const entry = findCatalogEntry(id);
      return (
        !!entry &&
        (allowed.size === 0 || allowed.has(entry.difficulty)) &&
        (uses.get(id) ?? 0) < STRUCTURE_LIMITS.maxExerciseReuse &&
        !inPhase.has(id)
      );
    });
    if (!choice) return;
    picked.set(step.id, choice);
    uses.set(choice, (uses.get(choice) ?? 0) + 1);
  });
  if (!picked.size) return phases;

  return phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => {
      const exerciseId = picked.get(step.id);
      return exerciseId ? { ...step, suggestedExerciseId: exerciseId } : step;
    }),
  }));
};

/**
 * The app's phases back in the shape the model writes — what a rewrite of an
 * already converted plan is given as "your previous draft".
 */
export const toStructurePhases = (phases: RoadmapPhase[]): StructurePhase[] =>
  phases.map((phase) => ({
    title: phase.title,
    steps: phase.steps.map((step) => {
      const song = step.suggestedSong ?? step.songRequest ?? null;
      return {
        title: step.title,
        skillType: step.skillType ?? "physical",
        suggestedExerciseId: step.suggestedExerciseId ?? null,
        exerciseWhy: step.exerciseWhy ?? "",
        exerciseFit: step.suggestedExerciseId
          ? (step.exerciseRole ?? "direct")
          : null,
        gist: step.summary ?? "",
        songTitle: song?.title ?? null,
        songArtist: song?.artist ?? null,
      };
    }),
  }));

/**
 * Stage one: the skeleton, before anybody has looked at it.
 *
 * Split out of `generateRoadmapStructure` so a browser driving the pipeline
 * can say that the draft is done and the review has started. Held together,
 * the two stages are one request that answers nothing for minutes while two or
 * three model calls run behind it, and a progress bar that cannot move.
 */
export async function draftRoadmapStructure(
  goal: string,
  level: RoadmapLevel,
  ledger?: UsageLedger,
  brief?: RoadmapBrief | null,
  extras?: StructureExtras | null,
): Promise<StructurePhase[]> {
  const draft = await generateDraft(goal, level, ledger, brief, extras);
  if (!draft.guitarRelated) {
    throw new GenerationError(
      draft.rejectionReason || "Please enter a guitar-related goal.",
      400,
    );
  }
  return draft.phases;
}

/**
 * The plan rewritten to what the player said after reading it — the one free
 * round of changes before the descriptions are written. Their note wins over
 * the general pedagogy, the same as a brief answer does.
 */
export async function reviseForStudent(
  goal: string,
  level: RoadmapLevel,
  phases: StructurePhase[],
  feedback: string,
  options: Pick<ReviewStructureOptions, "ledger" | "brief" | "extras"> = {},
): Promise<StructurePhase[]> {
  const revision = await reviseDraft(
    goal,
    level,
    phases,
    {
      issues: [
        `The student read this plan and asked for this change. It wins over the general pedagogy, and everything they did not mention stays as it is: "${feedback.trim()}"`,
      ],
      suggestions: [],
    },
    options.ledger,
    options.brief,
    options.extras,
  );
  return revision.phases.length ? revision.phases : phases;
}

export interface ReviewStructureOptions {
  ledger?: UsageLedger;
  /** Looks the named songs up in the library; without it no step gets a song. */
  resolveSong?: SongResolver;
  /** Searches the library for a technique step left without an exercise. */
  matchExercise?: ExerciseMatcher;
  /**
   * Called when the draft is sent back and the rewrite starts — the one stage
   * nothing outside this function can see, and the slowest of them. Whatever
   * it does must not throw: a progress note is not worth losing a roadmap that
   * is otherwise going fine.
   */
  onRevise?: () => void | Promise<void>;
  /** The student's answers; its songs are guaranteed a step, its lines are reviewed. */
  brief?: RoadmapBrief | null;
  /** The profile and the library songs the draft was written with. */
  extras?: StructureExtras | null;
}

/**
 * The model's skeleton as the app's phases: library exercises checked, a
 * second search for the technique steps left bare, the named songs resolved
 * and the brief's required songs guaranteed.
 */
export async function finishSkeleton(
  goal: string,
  level: RoadmapLevel,
  phases: StructurePhase[],
  { ledger, resolveSong, matchExercise, brief }: ReviewStructureOptions = {},
): Promise<Omit<GeneratedStructure, "review">> {
  const converted = toRoadmapPhases(phases, level);
  // A song the player picked from the library is already resolved — no read,
  // and no chance of the lookup missing what the picker found.
  const resolve: SongResolver | undefined = brief?.songs.length
    ? async (request) =>
        briefSongByRequest(brief, request) ??
        (resolveSong ? resolveSong(request) : null)
    : resolveSong;
  const withSongs = resolve
    ? await attachLibrarySongs(
        converted.phases,
        converted.songRequests,
        resolve,
      )
    : { phases: converted.phases, unmatchedSongs: [] };
  const guaranteed = ensureRequiredSongs(withSongs.phases, brief?.songs ?? []);
  if (guaranteed.added.length) {
    console.warn(
      "[structure] required songs appended after the model left them out:",
      guaranteed.added.join(", "),
    );
  }
  const filled = matchExercise
    ? await fillMissingExercises(
        guaranteed.phases,
        goal,
        level,
        matchExercise,
        ledger,
      )
    : guaranteed.phases;

  return {
    phases: filled,
    unknownExerciseIds: converted.unknownExerciseIds,
    unmatchedSongs: withSongs.unmatchedSongs,
    stepsWithoutExercise: filled
      .flatMap((phase) => phase.steps)
      .filter(
        (step) =>
          step.skillType === "physical" &&
          !step.suggestedExerciseId &&
          !step.suggestedSong,
      )
      .map((step) => step.title),
  };
}

/**
 * Stage two: the code checks, the reviewer's pass, one rewrite when either
 * found something that changes the plan, then the app's phases with their
 * library exercises and songs.
 *
 * The rewrite is not automatic. Every one of the first eight drafts was sent
 * back with exactly four issues — the old prompt's "max 4" read as a quota —
 * so each roadmap was written twice whatever its quality. Now the reviewer
 * grades what it finds, a draft with only small notes is kept, and the notes
 * travel with the roadmap for its owner to act on. What comes out of a rewrite
 * is checked by the same code checks that ran on the draft, because nothing
 * else reads it before the player does.
 */
export async function reviewRoadmapStructure(
  goal: string,
  level: RoadmapLevel,
  draft: StructurePhase[],
  options: ReviewStructureOptions = {},
): Promise<GeneratedStructure> {
  const { ledger, onRevise, brief, extras } = options;
  if (!draft.length) {
    throw new GenerationError("There is no draft to review.", 400);
  }

  const mechanical = checkSkeleton(draft, brief);
  const raw = await reviewDraft(goal, level, draft, ledger, brief, mechanical);
  const found = (raw.issues ?? []).filter((issue) => issue?.text?.trim());
  const shape = found.filter((issue) => issue.severity === "shape");
  const detail = found.filter((issue) => issue.severity !== "shape");
  const issues = [...shape, ...detail].map((issue) => issue.text.trim());
  const needsRewrite = shape.length > 0 || mechanical.length > 0;

  let phases = draft;
  let revised = false;
  let remaining = mechanical;

  if (needsRewrite) {
    await onRevise?.();
    const revision = await reviseDraft(
      goal,
      level,
      draft,
      { issues: [...mechanical, ...issues], suggestions: raw.suggestions ?? [] },
      ledger,
      brief,
      extras,
    );
    if (revision.phases.length) {
      const after = checkSkeleton(revision.phases, brief);
      // A rewrite asked for by the code checks alone must not come back with
      // more of the same; one the reviewer asked for is kept either way, and
      // what the checks still find is on the record.
      if (shape.length > 0 || after.length <= mechanical.length) {
        phases = revision.phases;
        revised = true;
        remaining = after;
      }
    }
  }

  const finished = await finishSkeleton(goal, level, phases, options);
  return {
    ...finished,
    review: {
      issues,
      suggestions: raw.suggestions ?? [],
      isValid: !needsRewrite,
      shapeIssues: shape.length,
      mechanical,
      revised,
      remaining,
    },
  };
}

/**
 * Both stages back to back — what the admin queue runs, where one long request
 * costs nothing because the queue reports per roadmap, not per model call.
 */
export async function generateRoadmapStructure(
  goal: string,
  level: RoadmapLevel,
  ledger?: UsageLedger,
  /** Looks the named songs up in the library; without it no step gets a song. */
  resolveSong?: SongResolver,
): Promise<GeneratedStructure> {
  const draft = await draftRoadmapStructure(goal, level, ledger);
  return reviewRoadmapStructure(goal, level, draft, { ledger, resolveSong });
}
