import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import type {
  SongRef,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

/** 2026-11-07 15:00 local — a Saturday afternoon. */
export const NOW = new Date(2026, 10, 7, 15, 0, 0).getTime();
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** A settled, mid-game player with nothing loaded yet. Tests add what they need. */
export const snapshot = (
  overrides: Partial<WhatNextSnapshot> = {},
): WhatNextSnapshot => ({
  now: NOW,
  lvl: 10,
  points: 5000,
  sessionCount: 40,
  availableSkillPoints: 0,
  ...overrides,
});

export const goal = (overrides: Partial<ExerciseGoal> = {}): ExerciseGoal => ({
  id: "g1",
  exerciseId: "spider_1",
  exerciseTitle: "Spider 1-2-3-4",
  startBpm: 80,
  stepBpm: 10,
  targetBpm: 120,
  stageBpm: 100,
  strictness: "standard",
  counting: "total",
  cleanRuns: 1,
  status: "active",
  createdAt: NOW - 10 * DAY,
  completedAt: null,
  ...overrides,
});

export const song = (overrides: Partial<SongRef> = {}): SongRef => ({
  id: "s1",
  title: "Wonderwall",
  artist: "Oasis",
  lastPracticedAt: NOW - 9 * DAY,
  hasGpFile: false,
  ...overrides,
});
