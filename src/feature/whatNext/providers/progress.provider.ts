import {
  GOAL_CLEAN_RUNS_REQUIRED,
  goalStages,
  nextStageBpm,
} from "feature/exerciseGoals/utils/goalRules";
import { DEFAULT_SLOT_MINUTES } from "feature/whatNext/providers/today.provider";
import type {
  NextAction,
  SongRef,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A song left this long starts to count as slipping. */
const SONG_STALE_DAYS = 3;

/** At most this many songs from the "learning" list make the road. */
const MAX_SONGS = 2;

/** Rotation is only worth a line once this many items have gone rusty. */
const MIN_RUSTY = 2;

const daysSince = (at: number | null, now: number) =>
  at === null ? null : Math.max(0, Math.floor((now - at) / DAY_MS));

/**
 * Every open tempo goal, as "this many clean runs to the next milestone".
 * The overall progress is the milestone index, so the closest goal is the one
 * nearest its target — which is what the ranking rewards.
 */
export const goalActions = (s: WhatNextSnapshot): NextAction[] => {
  if (!s.goals) return [];
  const active = s.goals.filter((goal) => goal.status === "active");

  if (active.length === 0) {
    if (s.sessionCount < 3) return [];
    return [
      {
        id: "goals:create",
        source: "goals",
        kind: "start",
        isPractice: false,
        title: { key: "goals.create.title" },
        reason: { key: "goals.create.reason" },
        href: "/goals",
      },
    ];
  }

  return active.map((goal) => {
    const stages = goalStages(goal);
    const index = Math.max(0, stages.indexOf(goal.stageBpm));
    const next = nextStageBpm(goal, goal.stageBpm);
    const runsLeft = Math.max(1, GOAL_CLEAN_RUNS_REQUIRED - goal.cleanRuns);
    return {
      id: `goal:${goal.id}`,
      source: "goals" as const,
      kind: "continue" as const,
      isPractice: true,
      playerSet: true,
      title: {
        key: "goals.title",
        params: {
          title: goal.exerciseTitle,
          bpm: goal.stageBpm,
          target: goal.targetBpm,
        },
      },
      reason:
        next === null
          ? {
              key: "goals.reason_final",
              params: { count: runsLeft, bpm: goal.stageBpm },
            }
          : {
              key: "goals.reason",
              params: { count: runsLeft, bpm: goal.stageBpm },
            },
      href: `/practice/goal/${goal.id}`,
      // Milestones passed plus the clean runs toward this one.
      progress: {
        value: index * GOAL_CLEAN_RUNS_REQUIRED + goal.cleanRuns,
        max: stages.length * GOAL_CLEAN_RUNS_REQUIRED,
      },
      estMinutes: DEFAULT_SLOT_MINUTES,
      sessionItem: {
        kind: "goal" as const,
        exerciseId: goal.exerciseId,
        goalId: goal.id,
        bpm: goal.stageBpm,
        minutes: DEFAULT_SLOT_MINUTES,
      },
    };
  });
};

export const journeyActions = (s: WhatNextSnapshot): NextAction[] => {
  const next = s.journey;
  if (!next) return [];
  const steps = next.module.stages.flatMap((stage) => stage.steps);
  const index = steps.findIndex((step) => step.id === next.step.id) + 1;

  return [
    {
      id: `journey:${next.module.id}:${next.step.id}`,
      source: "journey",
      kind:
        next.module.completedCount > 0 || next.step.status === "in-progress"
          ? "continue"
          : "start",
      isPractice: true,
      title: { key: "journey.title", params: { step: next.step.title } },
      reason: {
        key: "journey.reason",
        params: {
          module: next.module.title,
          index,
          total: next.module.totalCount,
        },
      },
      href: `/journey?module=${next.module.id}&step=${next.step.id}`,
      progress: {
        value: next.module.completedCount,
        max: next.module.totalCount,
      },
      estMinutes: DEFAULT_SLOT_MINUTES,
      ...(next.step.suggestedExerciseId && {
        sessionItem: {
          kind: "exercise" as const,
          exerciseId: next.step.suggestedExerciseId,
          minutes: DEFAULT_SLOT_MINUTES,
        },
      }),
    },
  ];
};

/** The step every started roadmap is on — newest roadmap first, as they arrive. */
export const roadmapActions = (s: WhatNextSnapshot): NextAction[] =>
  (s.roadmapSteps ?? []).slice(0, 2).map((step) => ({
    id: `roadmap:${step.roadmapId}:${step.stepId}`,
    source: "roadmap" as const,
    kind: "continue" as const,
    isPractice: true,
    playerSet: true,
    title: { key: "roadmap.title", params: { step: step.title } },
    reason: { key: "roadmap.reason", params: { roadmap: step.roadmapTitle } },
    href: `/ai-coach?roadmapId=${step.roadmapId}&step=${step.stepId}`,
    estMinutes: 15,
    sessionItem: {
      kind: "roadmap" as const,
      roadmapId: step.roadmapId,
      stepId: step.stepId,
      title: step.title,
      roadmapTitle: step.roadmapTitle,
      ...(step.exerciseId && { exerciseId: step.exerciseId }),
      ...(step.song && { song: step.song }),
      ...(step.songMode && { songMode: step.songMode }),
      minutes: 15,
    },
  }));

export const skillTreeActions = (s: WhatNextSnapshot): NextAction[] => {
  const node = s.skillTree;
  if (!node) return [];
  return [
    {
      id: `skill-tree:${node.exerciseId}`,
      source: "skillTree",
      kind: node.done > 0 ? "continue" : "start",
      isPractice: true,
      title: { key: "skill_tree.title", params: { title: node.title } },
      reason: {
        key: "skill_tree.reason",
        params: { branch: node.branch, done: node.done, total: node.total },
      },
      href: `/profile/skills?exerciseId=${node.exerciseId}`,
      progress: { value: node.done, max: node.total },
      estMinutes: DEFAULT_SLOT_MINUTES,
      sessionItem: {
        kind: "exercise",
        exerciseId: node.exerciseId,
        minutes: DEFAULT_SLOT_MINUTES,
      },
    },
  ];
};

export const scaleTreeActions = (s: WhatNextSnapshot): NextAction[] => {
  const node = s.scaleInProgress;
  if (!node) return [];
  return [
    {
      id: `scale-tree:${node.nodeId}`,
      source: "scaleTree",
      kind: "continue",
      isPractice: true,
      title: { key: "scale_tree.title", params: { title: node.title } },
      reason: {
        key: "scale_tree.reason",
        params: { done: node.done, total: node.total },
      },
      href: "/scale-tree",
      progress: { value: node.done, max: node.total },
      estMinutes: DEFAULT_SLOT_MINUTES,
    },
  ];
};

const songAction = (song: SongRef, now: number): NextAction => {
  const days = daysSince(song.lastPracticedAt, now);
  return {
    id: `song:${song.id}`,
    source: "songs",
    kind: "continue",
    isPractice: true,
    playerSet: true,
    title: { key: "songs.title", params: { title: song.title } },
    reason:
      days === null
        ? { key: "songs.never", params: { artist: song.artist } }
        : { key: "songs.stale", params: { artist: song.artist, count: days } },
    href: `/songs/practice/${song.id}`,
    staleDays: days ?? 14,
    estMinutes: DEFAULT_SLOT_MINUTES,
    sessionItem: {
      kind: "song",
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        ...(song.coverUrl && { coverUrl: song.coverUrl }),
      },
      songMode: song.hasGpFile ? "gp" : "sections",
      minutes: DEFAULT_SLOT_MINUTES,
    },
  };
};

/**
 * Songs being learned that have gone quiet, stalest first. A song played in
 * the last few days is on track and does not need a reminder.
 */
export const songActions = (s: WhatNextSnapshot): NextAction[] => {
  if (!s.songs) return [];
  const slipping = s.songs.learning
    .map((song) => ({ song, days: daysSince(song.lastPracticedAt, s.now) }))
    .filter(({ days }) => days === null || days >= SONG_STALE_DAYS)
    .sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity))
    .slice(0, MAX_SONGS)
    .map(({ song }) => songAction(song, s.now));

  if (slipping.length > 0 || s.songs.learning.length > 0) return slipping;

  // Nothing being learned: the wish list is where the next song comes from.
  const wish = s.songs.wantToLearn[0];
  if (!wish) return [];
  return [
    {
      ...songAction(wish, s.now),
      kind: "start",
      reason: { key: "songs.wish", params: { artist: wish.artist } },
    },
  ];
};

export const rotationActions = (s: WhatNextSnapshot): NextAction[] => {
  const rotation = s.rotation;
  if (!rotation || rotation.rusty < MIN_RUSTY) return [];
  return [
    {
      id: "rotation:rusty",
      source: "rotation",
      kind: "continue",
      isPractice: true,
      playerSet: true,
      title: { key: "rotation.title", params: { count: rotation.rusty } },
      reason: { key: "rotation.reason" },
      href: "/rotation",
      staleDays: 21,
      estMinutes: 15,
    },
  ];
};

/** The plan played last, offered again while it is still recent. */
export const planActions = (s: WhatNextSnapshot): NextAction[] => {
  const plan = s.lastPlan;
  if (!plan) return [];
  const days = daysSince(plan.lastPlayedAt, s.now) ?? 0;
  if (days > 14) return [];
  return [
    {
      id: `plan:${plan.planId}`,
      source: "plan",
      kind: "continue",
      isPractice: true,
      title: { key: "plan.title", params: { title: plan.title } },
      reason: { key: "plan.reason" },
      href: `/timer/plans?planId=${plan.planId}`,
      estMinutes: 20,
    },
  ];
};
