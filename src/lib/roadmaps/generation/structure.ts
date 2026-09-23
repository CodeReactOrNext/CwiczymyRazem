import type {
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { v4 as uuidv4 } from "uuid";

import type { SongRequest } from "../songLookup";
import {
  DIFFICULTY_FOR_LEVEL,
  findCatalogEntry,
  renderExerciseCatalog,
} from "./exerciseCatalog";
import { HOUSE_VOICE } from "./houseVoice";
import { LEVEL_RULES, type RoadmapLevel } from "./levels";
import { STRUCTURE_LIMITS } from "./limits";
import { completeJson, GenerationError, STRUCTURE_MODEL } from "./openaiJson";
import type { UsageLedger } from "./usage";

export { STRUCTURE_LIMITS } from "./limits";

export type SkillType = "physical" | "conceptual" | "musical";

export interface StructureStep {
  title: string;
  skillType: SkillType;
  suggestedExerciseId: string | null;
  exerciseWhy: string;
  /** The one real song a repertoire step is about; null on every other step. */
  songTitle: string | null;
  songArtist: string | null;
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
  issues: string[];
  suggestions: string[];
  isValid: boolean;
}

export interface GeneratedStructure {
  phases: RoadmapPhase[];
  /** What the reviewer said about the first draft, and whether it was redone. */
  review: StructureReview & { revised: boolean };
  /** Exercise ids the model invented; they were dropped from the steps. */
  unknownExerciseIds: string[];
  /** Songs the steps named that the library does not have; those steps got none. */
  unmatchedSongs: SongRequest[];
}

/** Which library song a step names, resolved against the `songs` collection. */
export type SongResolver = (
  request: SongRequest,
) => Promise<RoadmapSongRef | null>;

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
    issues: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
    isValid: { type: "boolean" },
  },
  required: ["issues", "suggestions", "isValid"],
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

1. THE GOAL IS THE THROUGH-LINE. Whatever the student wants to DO (improvise, play a song, play a style), they do a simplified version of it from phase 1 — never gate the target behind dozens of prerequisites.
2. THREAD EAR & LISTENING THROUGHOUT. Ear training, singing what you play, call-and-response, transcribing short phrases from real records: spread across many phases starting early.
3. CONNECT THEORY TO SOUND. Every scale arrives with the harmony it works over (chord–scale relationship, chord tones, intervals).
4. RUTHLESS PRIORITISATION. Every step sits on the critical path to THIS goal. Fewer, well-aimed steps beat a catalogue.
5. USE CONSTRAINTS for creative skills — two notes, one string, one rhythm — rather than more technique.
6. ORDER BY DEPENDENCY, but interleave musicianship (rhythm, phrasing, ear) with technique from the start.
7. NO DUPLICATES. Each concrete skill appears exactly once, at the earliest phase it is needed. If a later phase needs more of the same skill, that is the same step at a harder level — not a second step with a different label. Before finishing, scan your own phases for two steps that are really the same thing (same technique, same exercise, same "why") and merge or cut one.
8. NO ONE-OFF TASKS. Every step is something the student DOES, repeatedly, across several practice sessions. Never a single checklist or reference task — changing strings, setting amp knobs, reading about gear once. If tone or gear genuinely matters to the goal, make it a repeatable listening or matching skill ("dialling in the tone by ear against a reference recording"), not a setup note.

---

EXERCISE LIBRARY — you get the app's whole exercise library as lines "id | title | difficulty | category | skills | what it trains". For each step:
- Copy the id EXACTLY as written, or use null. Never invent an id.
- Prefer an exercise whose skills and difficulty fit the step and the level; library difficulty for each level: Absolute Beginner → beginner, easy; Beginner → beginner, easy, medium; Intermediate → easy, medium, hard; Advanced → medium, hard.
- "… — Pick Your Chords" / "… — Pick Your Scale" style configurable exercises fit any chord-change or scale step; song-specific and listening steps often have no exercise — null is the honest answer there.
- Do not put the same exercise on more than ${STRUCTURE_LIMITS.maxExerciseReuse} steps.
- skillType: "physical" (a motion, coordination, technique), "conceptual" (theory, harmony, fretboard knowledge), "musical" (ear, phrasing, improvising, repertoire, performance). It decides how the step is later described.

---

SONGS — songTitle and songArtist:
- Set them ONLY on a repertoire step that is about learning ONE real song ("Little Wing: the embellishment masterclass" → "Little Wing" / "Jimi Hendrix"). Exact original title, the artist of the original recording.
- Every other step — a technique, a chord, a scale, a feel, a step that only mentions songs as examples, a step about several songs — gets null for both.
- Never invent a song. The app links the step to its own song library only when the song is really there; a wrong title links nothing.

---

SIZE: ${STRUCTURE_LIMITS.phases.min}–${STRUCTURE_LIMITS.phases.max} phases, ${STRUCTURE_LIMITS.stepsPerPhase.min}–${STRUCTURE_LIMITS.stepsPerPhase.max} steps each. Right-size to the goal; never pad. Phase titles are short themes ("The Lead Voice", "The Sound", "Songs"), not sentences.

GUARD: if the goal is not about playing or learning guitar, set guitarRelated=false, fill rejectionReason, and return the minimum phases the schema allows with placeholder titles.`;

const buildStructureUser = (goal: string, level: RoadmapLevel) =>
  `Goal: "${goal}"
Skill level: ${level}

For the "${level}" level do NOT include basics the student already has. If the goal names a guitarist, style or song, the whole plan is about that — not general guitar learning.

EXERCISE LIBRARY:
${renderExerciseCatalog()}`;

const REVIEW_SYSTEM = `You are a senior guitar curriculum designer reviewing a roadmap skeleton before it is written out in full.

Judge it on:
1. Goal alignment — does every phase move the student towards the stated goal? Would a fan of the guitarist/style recognise it as theirs?
2. Level fit — nothing the level already has; nothing out of reach too early.
3. Specificity — are steps concrete skills for this goal, or generic titles that could sit in any roadmap? Name the generic ones.
4. Order — prerequisites first, but the goal itself tasted early, ear and rhythm interleaved rather than dumped at the end.
5. Gaps and misplacements — missing essentials; steps in the wrong phase.
6. Duplicates — two steps (in the same phase or different ones) that teach the same skill under different words, or share the same exercise for no reason. Name both titles and say which one to cut or what to merge them into.
7. One-off tasks — a step that is really a single checklist item (change strings, set an amp knob, read about a pedal) rather than a skill practised over several sessions. Name it and say what repeatable skill it should become, or that it should be cut.

Rules:
- "issues" = problems that make the roadmap worse than a good teacher's plan (max 4, empty if none), each one sentence naming actual phase/step titles and what to do instead.
- "suggestions" = worthwhile improvements (max 3).
- "isValid" = false when at least one issue would change the plan's shape.`;

const renderStructure = (phases: StructurePhase[]) =>
  phases
    .map(
      (phase, index) =>
        `Phase ${index + 1}: ${phase.title}\n${phase.steps
          .map(
            (step, stepIndex) =>
              `  ${stepIndex + 1}. ${step.title} [${step.skillType}${
                step.suggestedExerciseId
                  ? `, exercise: ${step.suggestedExerciseId}`
                  : ""
              }${step.songTitle ? `, song: ${step.songTitle} — ${step.songArtist ?? "?"}` : ""}]`,
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
) =>
  completeJson<StructureOutput>({
    system: STRUCTURE_SYSTEM,
    user: buildStructureUser(goal, level),
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
) =>
  completeJson<StructureReview>({
    system: REVIEW_SYSTEM,
    user: `Goal: "${goal}"\nSkill level: ${level}\n\nRoadmap skeleton:\n${renderStructure(phases)}`,
    schemaName: "roadmap_review",
    schema: REVIEW_SCHEMA,
    maxTokens: REVIEW_TOKENS,
    model: STRUCTURE_MODEL,
    reasoningEffort: "low",
    ledger,
  });

const reviseDraft = (
  goal: string,
  level: RoadmapLevel,
  phases: StructurePhase[],
  review: StructureReview,
  ledger?: UsageLedger,
) =>
  completeJson<StructureOutput>({
    system: STRUCTURE_SYSTEM,
    user: `${buildStructureUser(goal, level)}

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
      if (songTitle && songArtist) {
        songRequests.push({
          stepId: id,
          request: { title: songTitle, artist: songArtist },
        });
      }
      return {
        id,
        title: step.title.trim() || `Step ${stepIdx + 1}`,
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 0,
        order: stepIdx,
        skillType: step.skillType,
        ...(exerciseId ? { suggestedExerciseId: exerciseId } : {}),
      };
    }),
  }));

  return { phases: result, unknownExerciseIds: unknown, songRequests };
};

/**
 * Puts the library songs the steps asked for onto them — the ones the library
 * actually has. A song the library lacks is reported and the step stays a
 * plain step; it is never a step about a song the app cannot open.
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
        return song ? { ...step, suggestedSong: song } : step;
      }),
    })),
    unmatchedSongs: unmatched,
  };
};

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
): Promise<StructurePhase[]> {
  const draft = await generateDraft(goal, level, ledger);
  if (!draft.guitarRelated) {
    throw new GenerationError(
      draft.rejectionReason || "Please enter a guitar-related goal.",
      400,
    );
  }
  return draft.phases;
}

export interface ReviewStructureOptions {
  ledger?: UsageLedger;
  /** Looks the named songs up in the library; without it no step gets a song. */
  resolveSong?: SongResolver;
  /**
   * Called when the reviewer rejects the draft and the rewrite starts — the
   * one stage nothing outside this function can see, and the slowest of them.
   * Whatever it does must not throw: a progress note is not worth losing a
   * roadmap that is otherwise going fine.
   */
  onRevise?: () => void | Promise<void>;
}

/**
 * Stage two: the reviewer's pass, one revision when it rejects the draft, then
 * the app's phases with their library exercises and songs.
 *
 * One review round is deliberate: a second rarely changes the plan and the
 * human editor is the real last pass.
 */
export async function reviewRoadmapStructure(
  goal: string,
  level: RoadmapLevel,
  draft: StructurePhase[],
  { ledger, resolveSong, onRevise }: ReviewStructureOptions = {},
): Promise<GeneratedStructure> {
  if (!draft.length) {
    throw new GenerationError("There is no draft to review.", 400);
  }

  const review = await reviewDraft(goal, level, draft, ledger);
  let phases = draft;
  let revised = false;

  if (!review.isValid && review.issues.length) {
    await onRevise?.();
    const revision = await reviseDraft(goal, level, draft, review, ledger);
    if (revision.phases.length) {
      phases = revision.phases;
      revised = true;
    }
  }

  const converted = toRoadmapPhases(phases, level);
  const withSongs = resolveSong
    ? await attachLibrarySongs(
        converted.phases,
        converted.songRequests,
        resolveSong,
      )
    : { phases: converted.phases, unmatchedSongs: [] };
  return {
    phases: withSongs.phases,
    review: { ...review, revised },
    unknownExerciseIds: converted.unknownExerciseIds,
    unmatchedSongs: withSongs.unmatchedSongs,
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
