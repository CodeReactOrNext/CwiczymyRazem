import { idToSlug } from "feature/exercises/lib/slugUtils";

/** The five keyword-targeted landing pages that replaced /exercises/*. */
export const SEO_LANDING_PAGES = {
  beginner: "/beginner-guitar-exercises",
  speed: "/guitar-speed-hand-synchronization-exercises",
  scales: "/guitar-scale-practice-routine",
  intermediate: "/intermediate-guitar-practice-routine",
  daily: "/daily-guitar-practice-plan",
} as const;

export type SeoLandingPageKey = keyof typeof SEO_LANDING_PAGES;

/**
 * Exercises embedded (with an anchor) on one of the landing pages.
 * Kept in sync with feature/seoLanding content configs by content.test.ts —
 * intentionally a plain map so client components don't pull the configs in.
 */
const EMBEDDED_EXERCISE_PAGE: Record<string, SeoLandingPageKey> = {
  spider_one_string: "beginner",
  finger_independence_1a: "beginner",
  open_g_repetition: "beginner",
  quarter_notes_drill: "beginner",
  strumming_basic: "beginner",
  strumming_down_up: "beginner",
  chord_spotlight_drill: "beginner",
  first_bend: "beginner",
  spider_basic: "speed",
  spider_permutation_1234: "speed",
  spider_chromatics: "speed",
  spider_x: "speed",
  spider_string_skipping: "speed",
  chromatic_spider_walk: "speed",
  speed_burst_chromatic_blitz: "speed",
  spider_legato_basic: "speed",
  legato_hammer_pull_run: "speed",
  legato_trill_sprint: "speed",
  legato_continuous_flow: "speed",
  alternate_picking_cross_string: "speed",
  string_skipping_two_notes: "speed",
  pinky_power_drill: "speed",
  metronome_gap_test: "speed",
  pentatonic_box1_up_down: "scales",
  pentatonic_string_crossing_3: "scales",
  alternate_picking_pentatonic_a_positions: "scales",
  hammer_on_pentatonic_run: "scales",
  pull_off_pentatonic_run: "scales",
  scale_practice_configurable: "scales",
  random_note_hunt: "scales",
  economy_picking_angular: "intermediate",
  legato_sextuplets_4_5_7: "intermediate",
  sweep_picking_3_string: "intermediate",
  string_skipping_arpeggios: "intermediate",
  hybrid_picking_independence: "intermediate",
  vibrato_control_drill: "intermediate",
  expressive_bend_phrasing: "intermediate",
  rhythmic_pocket_mastery: "intermediate",
  jp_stretching: "daily",
  rhythm_triole: "daily",
  muting_spotlight_drill: "daily",
  vibrato_low_position: "daily",
  earTrainingEasy: "daily",
  improv_prompt_easy: "daily",
};

export interface ExerciseLandingMeta {
  difficulty?: string;
  category?: string;
}

/**
 * Maps a non-embedded exercise to the most relevant landing page.
 * Same rules drive the generated 301s for the legacy /exercises/{slug} URLs
 * (scripts/generateSeoRedirects.test.ts), so links and redirects agree.
 */
export function classifyExerciseLanding(
  exerciseId: string,
  meta?: ExerciseLandingMeta
): SeoLandingPageKey {
  const idHas = (...fragments: string[]) =>
    fragments.some((fragment) => exerciseId.includes(fragment));

  if (idHas("pentatonic", "scale", "fretboard", "note_hunt", "interval_hunt")) {
    return "scales";
  }
  if (
    idHas(
      "spider",
      "legato",
      "picking",
      "chromatic",
      "skipping",
      "tremolo",
      "gallop",
      "tapping",
      "sweep",
      "pinky",
      "stretch",
      "speed",
      "trill"
    )
  ) {
    return "speed";
  }
  if (meta?.difficulty === "beginner" || meta?.difficulty === "easy") {
    return "beginner";
  }
  if (idHas("bend", "vibrato", "hybrid", "jazz", "chicken", "muting", "tone")) {
    return "intermediate";
  }
  if (
    meta?.category === "technique" &&
    (meta?.difficulty === "medium" || meta?.difficulty === "hard")
  ) {
    return "intermediate";
  }
  return "daily";
}

/**
 * Public-site link for an exercise: its anchor on a landing page when it is
 * embedded there, otherwise the most relevant landing page.
 */
export function getExerciseLandingHref(
  exerciseId: string,
  meta?: ExerciseLandingMeta
): string {
  const embedded = EMBEDDED_EXERCISE_PAGE[exerciseId];
  if (embedded) {
    return `${SEO_LANDING_PAGES[embedded]}#${idToSlug(exerciseId)}`;
  }
  return SEO_LANDING_PAGES[classifyExerciseLanding(exerciseId, meta)];
}
