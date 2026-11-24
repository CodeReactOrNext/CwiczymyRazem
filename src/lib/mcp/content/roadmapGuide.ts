import {
  PHASE_CHECK_PASS_MARK,
  PHASE_CHECK_QUESTIONS,
} from "feature/aiCoach/utils/phaseCheck";
import { renderExemplars } from "lib/roadmaps/generation/houseStyle";
import { HOUSE_VOICE } from "lib/roadmaps/generation/houseVoice";
import { LEVEL_RULES } from "lib/roadmaps/generation/levels";
import {
  OVERUSED_EXERCISE_IDS,
  STRUCTURE_LIMITS,
  TOTAL_STEPS,
} from "lib/roadmaps/generation/limits";
import {
  type BankQuestionId,
  QUESTION_BANK,
} from "lib/roadmaps/generation/questionBank";

import {
  REVIEW_CRITERIA,
  SCHOOL_FRAME,
  SCHOOL_SECTIONS,
  SCHOOL_SIZE,
  SCHOOL_TEXT,
  SYLLABUS_TOPICS,
} from "../roadmapPlan";

/** Steps whose texts one riffquest_write_roadmap_steps call may carry. */
export const ROADMAP_STEPS_PER_WRITE = 8;
export const ROADMAP_SESSIONS = { min: 2, max: 14 } as const;
/** Lessons one step may carry, and scope notes a roadmap keeps. */
export const ROADMAP_LESSONS_PER_STEP = 3;
export const ROADMAP_MAX_SCOPE_NOTES = 8;

/**
 * The builder's questions that are about the school's scope. The rest of the
 * bank asks about one player — where they stand, what they find hard, how
 * they like to practise — and a school is not written for one player.
 */
const SCOPE_QUESTIONS: readonly BankQuestionId[] = [
  "focus",
  "useFor",
  "sides",
  "songs",
  "repertoireDepth",
  "replicateOrCreate",
  "includes",
  "ending",
];

const questions = QUESTION_BANK.filter((question) =>
  SCOPE_QUESTIONS.includes(question.id),
)
  .map((question) => `- "${question.question}" — ${question.when}`)
  .join("\n");

const criteria = REVIEW_CRITERIA.map(
  (criterion) => `- \`${criterion.id}\` — ${criterion.question}`,
).join("\n");

/**
 * How an AI client writes a riff.quest roadmap. Served by the
 * `riffquest_get_roadmap_guide` tool and the `riffquest://docs/roadmap-guide`
 * resource.
 *
 * A roadmap is a school of one subject — the curated ones ("Rhythm Guitar
 * Basics", the artist roadmaps) are the bar, and the numbers quoted here are
 * measured on them. The level rules, the voice, the limits and the two
 * exemplars are imported from the generator rather than copied, so they
 * cannot drift. The rules marked "checked" are the ones the tools refuse a
 * plan or a text over.
 */
export const ROADMAP_GUIDE = `# riff.quest roadmap guide

A roadmap is a **school of one subject**: Legato, Rhythm Guitar Basics, Thrash
Rhythm Picking, Playing in the Style of Jimi Hendrix. A complete course a
guitarist at the stated level walks from the first motion to playing music
with it — the kind of thing a good teacher would sell as a masterclass. It is
not one player's personal plan and not a list of tips: anybody at that level
should be able to take it.

In the app it is a road: phases in order, each a handful of steps, each step
one skill worked on over several sessions, opened as a lesson with its
exercise, its videos and, when it is about one, its song.

You write it; riff.quest checks and stores it. Nothing on riff.quest's side
writes or rewrites a word of it.

The bar is the app's own curated schools. Measured on them: 7 phases, 34–38
steps, an exercise on more than 80% of the steps, a lesson on more than 90%,
about 205 words to a step, a last phase that is a performance.

## How it goes

1. **Settle the subject and its scope** with the player — see "Questions". A
   few, not a form. What is the school of, at which level, which sides of the
   subject are in.
2. **Study the library for the subject before planning.**
   \`riffquest_list_exercises\` by skill and by words, every page, gives each
   exercise's difficulty and the top of its tempo range (\`bpmMax\`);
   \`riffquest_get_exercise\` has what it trains and how it is scored;
   \`riffquest_list_songs\` the songs with a tab. The school is built around
   what the app can make the player do and measure — an exercise the library
   has for this subject and the plan does not use is a hole in the plan.
3. **Write the syllabus** — see "The syllabus": what the subject is made of.
4. **Write the plan** — phases and step titles — so that every topic of the
   syllabus has its steps, and run it through \`riffquest_check_roadmap_plan\`
   until it has no problems.
5. **Review it** — see "The review" — as a specialist who did not write it.
   Whatever does not pass changes the plan, and the plan is checked again.
6. **Show the plan to the player** as a plain list of phases and steps, and
   change what they ask for.
7. **Save it** with \`riffquest_create_roadmap\`, with the syllabus, the
   review and the player's choice of public or private. It answers with an id
   for every step.
8. **Write the steps**, a phase at a time, with
   \`riffquest_write_roadmap_steps\` (up to ${ROADMAP_STEPS_PER_WRITE} steps a call), each with its lessons —
   see "Lessons". The answer lists the steps still without text.
9. **Write each phase's checkpoint** with \`riffquest_write_roadmap_checkpoint\`
   once the phase's steps are written — see "Checkpoints".

Every save counts against the day's changes (see the write answers); a whole
school is 12–15.

## Public or private

The player decides, and can change their mind at any time. Ask before saving
— it is \`visibility\` on \`riffquest_create_roadmap\`:

- **public** — the school goes on the Players board, where every supporter
  can open it and start it. It appears there once every step has its text, not
  before; the write answers say whether it is up yet (\`onPlayersBoard\`). It
  carries the player's name as its author.
- **private** — only the player sees it.

\`riffquest_set_roadmap_visibility\` switches a roadmap either way later. A
school meant for the board has to stand without the conversation it came
from: nothing in a step may refer to the player who asked.

## Questions

A school is not about the player who asked, so do not ask about them — not
their weak spots, not their gear, not how much time they have. Ask what
decides the school's scope: at most four questions, often two, none when the
request already says it. Offer concrete options rather than open questions.
The ones worth choosing from, each with when it is worth asking:

${questions}

Always settle the level — it decides where the school starts.

What is agreed becomes the plan's \`scope\`: one plain line each ("Electric
lead legato, not acoustic", "Songs: Satch Boogie and Cliffs of Dover", "No
tapping — that is its own school"). It is saved with the roadmap and held to
in every later rewrite.

## The syllabus

Before the plan, write down what the subject is made of — as a specialist
would list it for a course outline. For legato: hammer-ons, pull-offs, the
two combined, trills, hammer-ons from nowhere, three-notes-per-string
patterns, crossing strings, position shifts and slides, muting the idle
strings, keeping the picked and the slurred notes even, legato in a phrase,
legato at speed, licks from real players, a full solo. ${SYLLABUS_TOPICS.min} topics at the very
least (checked); most subjects have 12–20.

\`riffquest_create_roadmap\` takes it as \`syllabus\`: each topic with the titles
of the steps that teach it. It is checked both ways: a topic no step teaches
is a hole in the school, and a step that teaches no topic does not belong in
it. A topic that matters gets two or three steps, not one thin one.

## The review

The checks in \`riffquest_check_roadmap_plan\` are code: ids, level, size,
song placement, duplicates. What they cannot judge is whether the school is a
good one. That is the review, and \`riffquest_create_roadmap\` takes it as
\`review\`: every criterion below answered once, \`pass\` true or false, with a
\`note\` that names what you looked at — the phases, the step titles.

${criteria}

Read the plan for the review as somebody who did not write it and teaches this
subject for a living. A criterion that does not pass is not a formality to
argue away: the plan changes, goes through the check again, and is reviewed
again. A plan is saved only when every criterion passes and the player has
agreed to it (\`playerApproved\`). The review is kept with the roadmap.

## Level

${LEVEL_RULES}

## The plan

- **A whole subject** (checked: at least ${SCHOOL_SIZE.phases} phases and ${SCHOOL_SIZE.steps} steps; at most ${STRUCTURE_LIMITS.phases.max}
  phases of ${STRUCTURE_LIMITS.stepsPerPhase.min}–${STRUCTURE_LIMITS.stepsPerPhase.max} steps, ${TOTAL_STEPS.max} steps). Aim for 6–7 phases and 30–38 steps. A
  subject that seems to need fewer has not been taken apart far enough — go
  back to the syllabus. Never pad either: every step earns its place by
  teaching a topic.
- **The arc of a course.** The basic motion done right; its variants; putting
  them together; playing real music with them; and a last phase that is a
  performance — a whole piece start to finish, a tempo range, a recorded take,
  playing with others. "Rhythm Guitar Basics" runs: Pulse and the Strumming
  Hand → Open Chords in Time → Eighth Notes and Strum Patterns → Muting,
  Accents and Dynamics → Syncopation, Feel and Groove → Playing Songs →
  Performance.
- **Music from the first phase.** When the plan has songs, a short fragment at
  reduced tempo sits in the first third of the phases (checked); the full
  versions stay late. A school that is drills for five phases and songs in the
  sixth is wrong.
- **Every step is something the player does repeatedly** over several sessions.
  Never a one-off task, and never a step named after a piece of gear — a
  pickup, a pedal, an amp (checked).
- **Each skill once** (checked: two steps with nearly the same title, or the
  same exercise twice in one phase). A harder version of a skill is its own
  step only when it is really a different thing to practise.
- **Ear and rhythm run through the school**, not in a block at the end.
- **A song is not a template.** When a song gets several steps, each is about a
  different problem of that song, named in its title — not "reduced tempo /
  80% / album tempo" repeated for every song.
- **Step titles**: a specific skill in 2–8 words. "THE pattern: D DU UDU",
  "Rests inside a pattern", "Percussive chucks: the fretting hand mutes" — not
  "Finger independence" or any title that could sit in every roadmap.
- **Phase titles**: short themes ("Muting, Accents and Dynamics"), not
  sentences.
- **The title** names the subject the way a course is named (checked): no
  tempo or number in it, nothing about one player.

### A step in the plan

\`\`\`
{ title, skillType, gist, exerciseId?, exerciseFit?, songId? | songTitle + songArtist }
\`\`\`

- \`skillType\`: \`physical\` (a motion, a technique), \`conceptual\` (theory,
  harmony, the fretboard), \`musical\` (ear, phrasing, improvising, repertoire).
- \`gist\`: one plain sentence — what the player actually does, on what
  material.
- \`exerciseId\`: a library exercise — or one written for the school, see
  below — that fits the step and the level (checked:
  it exists, its difficulty fits the level, it is on at most ${STRUCTURE_LIMITS.maxExerciseReuse} steps). Nearly
  every step should have one — the check notes it when more than a fifth of
  the steps open nothing. A technique step without one is a gap: look through
  the library again.
- **When the library has nothing for a step, write the exercise.** The check
  lists the technique steps left without one. For each, look once more; if the
  library really has nothing that drills that motion, write it with
  \`riffquest_create_exercise\` (\`riffquest_get_tab_format\` first, and
  \`riffquest_validate_tablature\` until it passes): a short loop that is
  exactly the step's motion, with a description, instructions and a tempo
  range wide enough for the step's test. Put the id it answers with on the
  step as \`exerciseId\`. Never instead of a library exercise that fits — the
  library first. In a public school these exercises are published with it,
  into the community exercises, under the player's name.
- \`exerciseFit\`: \`direct\` when doing the exercise is doing the step;
  \`support\` when it is only a related warm-up and the step's own material is
  not in it. When unsure, \`support\`. The app labels it as a warm-up.
- These exercises fit almost anything and end up everywhere:
  ${OVERUSED_EXERCISE_IDS.join(", ")}. Only on a step that is exactly about
  what they train.
- \`songId\`: a library song — the step opens its tab and backing track. Only
  on a step about that one song. A song the library lacks goes in as
  \`songTitle\` + \`songArtist\`; that step opens nothing, so keep those to one
  or two.

## The text of a step

\`\`\`
{ stepId, description, successCriteria, sessionsRequired, exerciseSetup?, lessonIds? }
\`\`\`

A step reads like a page of a masterclass: it explains the thing fully enough
that the player needs nothing else to start, and it is specific enough that
they cannot do it wrong without noticing.

- **description** — ${SCHOOL_TEXT.min}–${SCHOOL_TEXT.max} words (checked: under ${SCHOOL_TEXT.floor} or over ${SCHOOL_TEXT.ceiling} is
  refused), in sections in square brackets (checked: all three present):
  - \`[What it is]\` — the skill itself, at least ${SCHOOL_SECTIONS.what} words (checked): the
    motion, the shape, the sound, which fingers and strings, what it looks and
    feels like when it is right. Full enough that the player could do it from
    this section alone.
  - \`[Why it matters]\` — at least ${SCHOOL_SECTIONS.why} words (checked): what it makes
    possible, what a record does with it, what goes wrong later in this school
    without it. This is where the step earns the player's patience.
  - \`[How to practice]\` — the sequence: where to start, what to play, at what
    tempo, what to listen for, when to move on.
  - \`[Common trap]\` — on at most one step in three of a phase (checked), and
    only where something really goes wrong that the practice notes cannot
    carry. Not a closing line for every step: most warnings belong inside
    \`[How to practice]\`, at the moment they apply.
- **A step explains, it does not only instruct.** The first school written
  this way had the right length and read like a list of commands: two
  sentences on what the thing is, then twelve orders. The explaining sections
  are half of the step.
- **The first step of the school** opens with \`${SCHOOL_FRAME.first}\` (checked): what the
  player has to be able to do already, and what they will be able to do at the
  end. **The last step** ends with \`${SCHOOL_FRAME.last}\` (checked): what they
  have now, concretely, and where to go next.
- Name chords, strings, frets, fingers, the count ("1 & 2 &"), the motion, a
  real record.
- A \`direct\` exercise is named in \`[How to practice]\` by its exact title
  (checked), with how to use it and what to watch in it — the reading it
  gives, the tempo to set. A \`support\` exercise gets at most one clause as a
  warm-up; never write that the step's riff or phrase is played "in" it.
- **Tempos stay inside the exercise's range** (checked): a tempo the text
  asks for in an exercise that tops out below it is a test nobody can take.
- Earlier steps are known: at most one clause of reference, no re-explaining.
- **successCriteria** — a test the player can run, with a number in it
  (checked), and wherever the step has an exercise, in the terms the app
  measures: the tempo set in that exercise, the accuracy it reports, clean runs
  in a row. "You can play Legato — Scale Run at 120 BPM with 90% accuracy on 3
  runs in a row, every slurred note as loud as the picked one."
- **sessionsRequired** — ${ROADMAP_SESSIONS.min}–${ROADMAP_SESSIONS.max}, different from step to step: a listening
  step 2–3, a refinement of a known motion 4–5, a new technique 6–8, a deep
  musical skill 9–14. The curated schools come to 170–240 sessions in all.
- **exerciseSetup** — for an exercise the player configures (a key, chords, a
  scale, a tempo): the settings for this step in a few words, "A minor,
  i–VI–III–VII, 80 BPM". Left out otherwise.
- Facts about a song — key, tuning, tempo — come from \`riffquest_get_song\` or
  from what you are certain of. A confident wrong fact about a song the player
  knows is the worst thing a step can contain.

${HOUSE_VOICE}

In a school, one rule above is narrower: "one idea per sentence, no sentence
longer than about twenty words" holds for \`[How to practice]\`, where the
player follows steps with a guitar in their hands. \`[What it is]\` and
\`[Why it matters]\` are explanation, and an explanation joins a cause to its
effect — write those as a teacher talks, in full sentences, not as a string
of four-word commands. Everything else in the voice stands: facts over
adjectives, no filler, no selling.

Filler is refused (checked): "start slow and increase gradually", "practice
with a metronome", "focus on accuracy", "muscle memory", "solid foundation".

## Lessons

Nearly every step of a school has a lesson — one to three YouTube videos from
the app's index. \`riffquest_find_lessons\` searches it by plain words (the
technique, the style, the song or the artist) and answers with candidates:
title, channel, level, topics, length. You are the judge of them:

- A lesson goes on a step only when it teaches that step's skill — the same
  technique at about the same level, or that song. A good video on a
  neighbouring topic is not a lesson for this step.
- Search for every step, and search twice with different words before giving
  up: the write answer counts the steps left without a lesson.
- A lesson must not teach against the school's scope — no downpicking lesson
  on a step of a school that is strictly alternate picking.
- A step with a lesson that misses is still worse than one without.

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
- Four options, all plausible to somebody who skipped the practice, all about
  as long and as specific as each other. The right one is the longest in at
  most half of the questions and not always in the same place (checked).
- **At least two of the six put the player in a situation at the guitar**
  rather than asking back a fact from the text: "Your phrase sounds like a
  scale run — what do you change first?", "The bend lands flat every time on
  the G string — what is the likeliest cause?". A question whose answer is a
  number quoted from the step ("over which beats does the note come down?")
  tests reading, not playing; keep those to a couple.
- The prompt is one direct sentence. The explanation says in one or two
  sentences why the right answer is right.
- Rewriting a step's text later makes its phase's checkpoint stale: the answer
  of \`riffquest_write_roadmap_steps\` says which to write again.

## Two steps as the app's own editors wrote them

${renderExemplars()}

## Talking to the player

They are a guitarist. Show the school as phases and step titles, the steps as
what to play and how to tell it worked. No JSON, ids or field names.
`;
