export const ROADMAP_LEVELS = [
  "Absolute Beginner",
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export type RoadmapLevel = (typeof ROADMAP_LEVELS)[number];

export const isRoadmapLevel = (value: unknown): value is RoadmapLevel =>
  ROADMAP_LEVELS.includes(value as RoadmapLevel);

export const MAX_GOAL_LENGTH = 500;

/** What each level already knows, so no roadmap re-teaches it. */
export const LEVEL_RULES = `SKILL LEVEL — apply strictly:

"Absolute Beginner": Start from zero — posture, holding the guitar and pick, finger coordination, then chords one at a time (Em, Am, G, C, D). Every theory term gets a one-clause explanation.

"Beginner": Skip posture and how to hold the guitar/pick. Knows a few open chords and can strum in time. Start with chord changes, strumming vocabulary, first single-note lines.

"Intermediate": Skip open chords, posture, pick grip. Has barre chords, a pentatonic box, basic bends. Start with bending, vibrato, scale positions, rhythm techniques, harmony.

"Advanced": Skip all fundamentals. Start directly with advanced phrasing, modes, harmony, style-specific feel and repertoire.`;
