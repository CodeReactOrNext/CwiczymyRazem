import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";

/**
 * The skill roadmap: one journey down the page, tier by tier, every exercise
 * in the library a single dot on one branch.
 *
 * A tier is a milestone on the trunk (Foundations, Technique, …); a branch is
 * one chain of exercises hanging off it. Branches are fed by a skill — the
 * first `relatedSkills` entry, or "general" for the play-alongs with none —
 * and a skill with many exercises is split into several branches with `match`
 * so a 54-exercise skill does not become a single 54-dot snake. Whatever an
 * exercise's skill has no matching branch for falls to the skill's catch-all
 * branch (the one without `match`); the test guards that every exercise lands
 * exactly once.
 */

export type RoadmapSkillId = GuitarSkillId | "general";

export interface RoadmapBranchConfig {
  id: string;
  label: string;
  /** Skill whose exercises feed this branch. Clicking the label opens that skill's sheet. */
  skillId: RoadmapSkillId;
  /** Narrows the skill's exercises to this branch; a branch without it is the skill's catch-all. */
  match?: (exercise: Exercise) => boolean;
}

export interface RoadmapTierConfig {
  id: string;
  title: string;
  /** One line on what the tier is for; shown next to the tier in the map's index. */
  subtitle: string;
  branches: RoadmapBranchConfig[];
}

const startsWith = (prefix: string) => (exercise: Exercise) =>
  exercise.id.startsWith(prefix);

export const SKILL_ROADMAP_TIERS: RoadmapTierConfig[] = [
  {
    id: "foundations",
    title: "Foundations",
    subtitle: "Pick up the guitar. Build the basics.",
    branches: [
      {
        id: "getting_started",
        label: "Getting Started",
        skillId: "general",
        match: (e) =>
          e.id === "first_melody" || e.id.startsWith("musician_fitness"),
      },
      {
        id: "clean_tone",
        label: "Clean Tone & Muting",
        skillId: "articulation",
      },
      { id: "first_scales", label: "First Scales", skillId: "scales" },
      { id: "play_alongs", label: "Play-alongs", skillId: "general" },
    ],
  },
  {
    id: "technique",
    title: "Technique",
    subtitle: "Precision, speed and control.",
    branches: [
      {
        id: "alternate_picking",
        label: "Alternate Picking",
        skillId: "alternate_picking",
      },
      {
        id: "finger_independence",
        label: "Finger Independence",
        skillId: "finger_independence",
      },
      { id: "legato", label: "Legato", skillId: "legato" },
      {
        id: "string_skipping",
        label: "String Skipping",
        skillId: "string_skipping",
      },
      {
        id: "spider_permutations",
        label: "Spider Permutations",
        skillId: "finger_independence",
        match: startsWith("spider_permutation"),
      },
      { id: "sweep_picking", label: "Sweep Picking", skillId: "sweep_picking" },
      { id: "tapping", label: "Tapping", skillId: "tapping" },
      {
        id: "hybrid_picking",
        label: "Hybrid Picking",
        skillId: "hybrid_picking",
      },
    ],
  },
  {
    id: "theory",
    title: "Theory & Fretboard",
    subtitle: "Know the neck. Name what you play.",
    branches: [
      {
        id: "note_hunts",
        label: "Note Hunts",
        skillId: "music_theory",
      },
      {
        id: "click_hunts",
        label: "Click Hunts",
        skillId: "music_theory",
        match: startsWith("fret_click"),
      },
      {
        id: "interval_clicks",
        label: "Interval Clicks",
        skillId: "music_theory",
        match: startsWith("interval_click"),
      },
      { id: "chords", label: "Chords", skillId: "chords" },
      { id: "harmony", label: "Harmony", skillId: "harmony" },
    ],
  },
  {
    id: "rhythm",
    title: "Rhythm & Groove",
    subtitle: "Lock in with the beat.",
    branches: [
      {
        id: "strumming_styles",
        label: "Strumming",
        skillId: "rhythm",
        match: (e) =>
          e.id.startsWith("strumming_") &&
          !e.id.startsWith("strumming_pattern"),
      },
      {
        id: "strumming_patterns",
        label: "Strumming Patterns",
        skillId: "rhythm",
        match: startsWith("strumming_pattern"),
      },
      { id: "timing_meter", label: "Timing & Meter", skillId: "rhythm" },
    ],
  },
  {
    id: "expression",
    title: "Expression & Style",
    subtitle: "Make every note sing.",
    branches: [
      { id: "bending", label: "String Bending", skillId: "bending" },
      { id: "vibrato", label: "Vibrato", skillId: "vibrato" },
      { id: "phrasing", label: "Phrasing", skillId: "phrasing" },
      { id: "tone", label: "Tone", skillId: "audio_production" },
    ],
  },
  {
    id: "hearing",
    title: "Ear Training",
    subtitle: "Hear it before you play it.",
    branches: [
      {
        id: "play_by_ear",
        label: "Play by Ear",
        skillId: "ear_training",
        match: startsWith("earTraining"),
      },
      { id: "ear_quizzes", label: "Ear Quizzes", skillId: "ear_training" },
    ],
  },
  {
    id: "creativity",
    title: "Creativity",
    subtitle: "Find your own voice.",
    branches: [
      { id: "improvisation", label: "Improvisation", skillId: "improvisation" },
      { id: "composition", label: "Composition", skillId: "composition" },
    ],
  },
];

/**
 * Optional full-bleed backdrop behind the map (a night landscape, a stage…).
 * `null` renders the built-in gradient glows instead. Drop the file under
 * `public/` and point here, e.g. "/images/skills/roadmap-backdrop.webp".
 */
export const SKILL_ROADMAP_BACKDROP_SRC: string | null = null;

const DIFFICULTY_RANK: Record<Exercise["difficulty"], number> = {
  beginner: 0,
  easy: 1,
  medium: 2,
  hard: 3,
};

export interface RoadmapBranch {
  id: string;
  label: string;
  skillId: RoadmapSkillId;
  /** Easiest first; ties keep library order so a numbered series stays in sequence. */
  exercises: Exercise[];
}

export interface RoadmapTier {
  id: string;
  title: string;
  subtitle: string;
  /** Only branches that actually have exercises — an empty chain is not drawn. */
  branches: RoadmapBranch[];
}

export const exerciseRoadmapSkill = (exercise: Exercise): RoadmapSkillId =>
  exercise.relatedSkills?.[0] ?? "general";

const findBranchFor = (exercise: Exercise): RoadmapBranchConfig | undefined => {
  const skillId = exerciseRoadmapSkill(exercise);
  const candidates = SKILL_ROADMAP_TIERS.flatMap((tier) =>
    tier.branches.filter((branch) => branch.skillId === skillId),
  );
  return (
    candidates.find((branch) => branch.match?.(exercise)) ??
    candidates.find((branch) => !branch.match)
  );
};

/** Places every exercise on its branch and drops the branches nothing landed on. */
export const buildSkillRoadmap = (exercises: Exercise[]): RoadmapTier[] => {
  const byBranch = new Map<string, Exercise[]>();
  exercises.forEach((exercise) => {
    const branch = findBranchFor(exercise);
    if (!branch) return;
    const list = byBranch.get(branch.id) ?? [];
    list.push(exercise);
    byBranch.set(branch.id, list);
  });

  return SKILL_ROADMAP_TIERS.map((tier) => ({
    id: tier.id,
    title: tier.title,
    subtitle: tier.subtitle,
    branches: tier.branches
      .map((branch) => ({
        id: branch.id,
        label: branch.label,
        skillId: branch.skillId,
        exercises: [...(byBranch.get(branch.id) ?? [])].sort(
          (a, b) =>
            DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty],
        ),
      }))
      .filter((branch) => branch.exercises.length > 0),
  }));
};

/** Which exercises would fall off the map — empty when every one has a branch. */
export const findUnplacedExercises = (exercises: Exercise[]): Exercise[] =>
  exercises.filter((exercise) => !findBranchFor(exercise));
