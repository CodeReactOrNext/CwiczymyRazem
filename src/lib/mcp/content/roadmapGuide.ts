import {
  PHASE_CHECK_PASS_MARK,
  PHASE_CHECK_QUESTIONS,
} from "feature/aiCoach/utils/phaseCheck";
import { renderExemplars } from "lib/roadmaps/generation/houseStyle";
import { HOUSE_VOICE } from "lib/roadmaps/generation/houseVoice";
import { DESCRIPTION_LENGTH } from "lib/roadmaps/generation/lengths";
import { LEVEL_RULES } from "lib/roadmaps/generation/levels";
import {
  OVERUSED_EXERCISE_IDS,
  STRUCTURE_LIMITS,
  TOTAL_STEPS,
} from "lib/roadmaps/generation/limits";
import { QUESTION_BANK } from "lib/roadmaps/generation/questionBank";

import { REVIEW_CRITERIA } from "../roadmapPlan";

/** Steps whose texts one riffquest_write_roadmap_steps call may carry. */
export const ROADMAP_STEPS_PER_WRITE = 8;
export const ROADMAP_SESSIONS = { min: 2, max: 14 } as const;
/** Lessons one step may carry, and wishes a roadmap keeps. */
export const ROADMAP_LESSONS_PER_STEP = 3;
export const ROADMAP_MAX_WISHES = 8;

/** The in-app builder's own questions: what to ask, and when it is worth asking. */
const questions = QUESTION_BANK.map(
  (question) => `- "${question.question}" — ${question.when}`,
).join("\n");

const criteria = REVIEW_CRITERIA.map(
  (criterion) => `- \`${criterion.id}\` — ${criterion.question}`,
).join("\n");

/**
 * How an AI client writes a riff.quest roadmap. Served by the
 * `riffquest_get_roadmap_guide` tool and the `riffquest://docs/roadmap-guide`
 * resource.
 *
 * It is the in-app generator's own brief — the same level rules, voice,
 * limits and exemplars, imported rather than copied, so the two cannot drift —
 * minus everything that only made sense for a model with no player to talk
 * to. The rules marked "checked" are the ones the tools refuse a plan or a
 * text over.
 */
export const ROADMAP_GUIDE = `# riff.quest roadmap guide

A roadmap is a practice plan for one goal: phases in order, each a handful of
steps, each step one skill the player works on over several sessions. In the app
it is a road the player walks; a step opens as a short lesson with its exercise
and, when it is about one, its song.

You write it; riff.quest checks and stores it. Nothing on riff.quest's side
writes or rewrites a word of it.

## How it goes

1. **Know the player.** \`riffquest_get_profile_summary\`,
   \`riffquest_get_skill_breakdown\` and \`riffquest_get_weak_spots\` say how long
   they have played, what they practise and what they avoid.
2. **Ask before planning** — see "Questions" below. A few, not a form.
3. **Know the library.** \`riffquest_list_exercises\` and \`riffquest_list_songs\`
   give the ids a step can open. A step can only use a library exercise; the
   player's own exercises do not go on a roadmap.
4. **Write the plan** — titles only — and run it through
   \`riffquest_check_roadmap_plan\` until it has no problems.
5. **Review it** — see "The review" below — as a teacher who did not write it.
   Whatever does not pass changes the plan, and the plan is checked again.
6. **Show the plan to the player** as a plain list of phases and steps, and
   change what they ask for. This is the moment changes are cheap.
7. **Save it** with \`riffquest_create_roadmap\`, with the review and the
   player's wishes. It answers with an id for every step.
8. **Write the steps**, a phase at a time, with
   \`riffquest_write_roadmap_steps\` (up to ${ROADMAP_STEPS_PER_WRITE} steps a call), each with its lessons —
   see "Lessons". The answer lists the steps still without text.
9. **Write each phase's checkpoint** with \`riffquest_write_roadmap_checkpoint\`
   once the phase's steps are written — see "Checkpoints".

A roadmap saved this way is private to the player. Every save counts against
the day's changes (see the write answers); a whole roadmap is about a dozen.

## Questions

Ask only what would change the plan — at most five, often two or three, and
none when the goal already says it. One at a time or all at once, as the
conversation goes; offer a few concrete options rather than an open question.
These are the questions the app's own builder picks from, each with when it is
worth asking:

${questions}

Do not ask what the app already knows (how long they have played, what they
practise — it is in their profile) or what does not change a roadmap (their
gear, where they will play).

What they answer becomes the plan's \`wishes\`: one plain line per wish ("Songs:
Sultans of Swing and Romeo and Juliet in depth", "No theory beyond what a step
needs", "Play it like the record, no improvising"). They are saved with the
roadmap and held to in every later rewrite.

## The review

The checks in \`riffquest_check_roadmap_plan\` are code: ids, level, size,
song placement, duplicates. What they cannot judge is whether the plan is a
good one. That is the review, and \`riffquest_create_roadmap\` takes it as
\`review\`: every criterion below answered once, \`pass\` true or false, with a
\`note\` that names what you looked at — the phases, the step titles.

${criteria}

Read the plan for the review as somebody who did not write it and has to teach
from it. A criterion that does not pass is not a formality to argue away: the
plan changes, goes through the check again, and is reviewed again. A plan is
saved only when every criterion passes and the player has agreed to it
(\`playerApproved\`).

## Level

${LEVEL_RULES}

## The plan

- **Size follows the goal** (checked: ${STRUCTURE_LIMITS.phases.min}–${STRUCTURE_LIMITS.phases.max} phases of ${STRUCTURE_LIMITS.stepsPerPhase.min}–${STRUCTURE_LIMITS.stepsPerPhase.max} steps, ${TOTAL_STEPS.min}–${TOTAL_STEPS.max} steps in all). One song,
  one technique or one habit: 3–4 phases, 10–18 steps. A handful of songs or one
  side of a style: 4–6 phases, 18–30 steps. Playing like an artist or a whole
  genre: 6–8 phases, 30–45 steps. Never pad: a player who asked for one song
  does not want a year of work.
- **The goal is played from the start.** When the plan has songs, a short
  fragment at reduced tempo sits in the first third of the phases (checked);
  the full versions stay late.
- **Every step is something the player does repeatedly** over several sessions.
  Never a one-off task, and never a step named after a piece of gear — a
  pickup, a pedal, an amp (checked). Tone that matters becomes a listening skill:
  matching a sound by ear against the record on whatever they own.
- **Each skill once** (checked: two steps with nearly the same title, or the
  same exercise twice in one phase). A harder version of a skill is the same
  step at a harder level, not a second step.
- **Ear and rhythm run through the plan**, not in a block at the end. A scale
  arrives with the chords it is played over.
- **A song is not a template.** When a song gets several steps, each is about a
  different problem of that song — the bar that breaks, the stretch, the
  change — named in its title. Not "reduced tempo / 80% / album tempo" repeated
  for every song.
- **Step titles**: a specific skill in 2–8 words, written for this goal. A song
  title, a chord name or a tuning is welcome. Not "Finger independence" or any
  title that could sit in every roadmap.
- **Phase titles**: short themes ("The Lead Voice", "Songs"), not sentences.

### A step in the plan

\`\`\`
{ title, skillType, gist, exerciseId?, exerciseFit?, songId? | songTitle + songArtist }
\`\`\`

- \`skillType\`: \`physical\` (a motion, a technique), \`conceptual\` (theory,
  harmony, the fretboard), \`musical\` (ear, phrasing, improvising, repertoire).
  It decides how long the step's text is.
- \`gist\`: one plain sentence — what the player actually does, on what
  material.
- \`exerciseId\`: a library exercise that fits the step and the level (checked:
  it exists, its difficulty fits the level, it is on at most ${STRUCTURE_LIMITS.maxExerciseReuse} steps). No
  exercise is an honest answer for a song step or a listening step; a technique
  step without one is worth a second look through the library.
- \`exerciseFit\`: \`direct\` when doing the exercise is doing the step;
  \`support\` when it is only a related warm-up and the step's own material — a
  song's riff, a specific phrase — is not in it. When unsure, \`support\`. The
  app labels a support exercise as a warm-up.
- These exercises fit almost anything and end up everywhere:
  ${OVERUSED_EXERCISE_IDS.join(", ")}. Only on a step that is exactly about
  what they train.
- \`songId\`: a library song — the step opens its tab and backing track. Only
  on a step about that one song. A song the library lacks goes in as
  \`songTitle\` + \`songArtist\`; that step opens nothing, so keep those to one
  or two.

## The text of a step

\`\`\`
{ stepId, description, successCriteria, sessionsRequired, exerciseSetup? }
\`\`\`

- **description** — sections in square brackets (checked: all three present):
  \`[What it is]\`, \`[Why it matters]\`, \`[How to practice]\`. A physical step: one
  sentence, one sentence, at most three sentences (${DESCRIPTION_LENGTH.physical.min}–${DESCRIPTION_LENGTH.physical.max} words, checked). A
  conceptual or musical step: 2–3 sentences each (${DESCRIPTION_LENGTH.conceptual.min}–${DESCRIPTION_LENGTH.conceptual.max} words, checked).
  \`[Common trap]\` may follow on a conceptual or musical step that has a real,
  specific trap.
- Name chords, strings, frets, the count ("1 & 2 &"), the motion, a real
  record. Explain the why with what the technique makes possible or what a
  record does with it.
- A \`direct\` exercise is named in \`[How to practice]\` by its exact title
  (checked), with what to listen for in it. A \`support\` exercise gets at most
  one clause as a warm-up — never write that the step's riff or phrase is
  played "in" it.
- Earlier steps are known: at most one clause of reference, no re-explaining.
- **successCriteria** — a test the player can run: what they play, how fast (a
  number), what it must sound like, what must not happen.
- **sessionsRequired** — ${ROADMAP_SESSIONS.min}–${ROADMAP_SESSIONS.max}, different from step to step: a listening
  step 2–3, a refinement of a known motion 4–5, a new technique 6–8, a deep
  musical skill 9–14.
- **exerciseSetup** — for an exercise the player configures (a key, chords, a
  scale, a tempo): the settings for this step in a few words, "A minor,
  i–VI–III–VII, 80 BPM". Left out otherwise.
- **lessonIds** — see "Lessons".
- Facts about a song — key, tuning, tempo — come from \`riffquest_get_song\` or
  from what you are certain of. A confident wrong fact about a song the player
  knows is the worst thing a step can contain.

${HOUSE_VOICE}

Filler is refused (checked): "start slow and increase gradually", "practice
with a metronome", "focus on accuracy", "muscle memory", "solid foundation".

## Lessons

A step can carry up to ${ROADMAP_LESSONS_PER_STEP} YouTube lessons from the app's index.
\`riffquest_find_lessons\` searches it by plain words (the technique, the
style, the song or the artist) and answers with candidates: title, channel,
level, topics, length. You are the judge of them:

- A lesson goes on a step only when it teaches that step's skill — the same
  technique at about the same level, or that song. A good video on a
  neighbouring topic is not a lesson for this step.
- None is a fine answer. A step with its exercise and no lesson is complete;
  a step with a lesson that misses is worse than one without.
- Two searches with different words beat one long query.
- Lessons help; they never hold a step back. The exercise and the song are
  what finish a step.

## Checkpoints

Each phase ends with a checkpoint: ${PHASE_CHECK_QUESTIONS} multiple-choice questions, ${PHASE_CHECK_PASS_MARK} right to
pass. Written with \`riffquest_write_roadmap_checkpoint\` once every step of
the phase has its text.

- Each question tests one concrete thing from one step of the phase — a chord,
  a fret, a count, a motion, what goes wrong without it. Spread them over the
  steps; no step gets more than two.
- Something the player can only answer from having done the step, never a
  definition anyone could look up, and never something the phase did not
  teach.
- Four options, all plausible to somebody who skipped the practice. Wrong
  options are real mistakes, not jokes. The right one is not always the
  longest and not always in the same place (checked).
- The prompt is one direct sentence. The explanation says in one or two
  sentences why the right answer is right.
- Rewriting a step's text later makes its phase's checkpoint stale: the answer
  of \`riffquest_write_roadmap_steps\` says which to write again.

## Two steps as the app's own editors wrote them

${renderExemplars()}

## Talking to the player

They are a guitarist. Show the plan as phases and step titles, the steps as
what to play and how to tell it worked. No JSON, ids or field names.
`;
