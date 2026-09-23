import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import type {
  RoadmapRunProgress,
  UserRoadmapDetail,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import type { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

import { isRoadmapVisibleTo, visibilityOf } from "./visibility";

const ROADMAPS_COLLECTION = "roadmaps";
const PROGRESS_COLLECTION = "userRoadmapProgress";

/** Shape written by feature/aiCoach/services/userProgress.service. */
interface StoredProgress {
  roadmapId: string;
  userId: string;
  updatedAt?: string;
  startedAt?: string;
  stepProgress?: Record<string, number>;
  phaseChecks?: Record<string, PhaseCheckResult>;
}

type Author = { displayName: string | null; avatar: string | null };

const progressDocId = (userId: string, roadmapId: string) =>
  `${userId}_${roadmapId}`;

/**
 * Names for the authors of the listed roadmaps, read in one batch — a few
 * dozen roadmaps come from a handful of people, so a lookup per roadmap would
 * be mostly duplicated reads.
 */
async function fetchAuthors(userIds: string[]): Promise<Map<string, Author>> {
  const authors = new Map<string, Author>();
  if (!userIds.length) return authors;

  const refs = userIds.map((id) => firestore.collection("users").doc(id));
  const snaps = (await firestore.getAll(...refs)) as DocumentSnapshot[];

  snaps.forEach((snap) => {
    const data = snap.data();
    authors.set(snap.id, {
      displayName: data?.displayName ?? null,
      avatar: data?.avatar ?? null,
    });
  });

  return authors;
}

/**
 * Sessions logged per step. The generator wrote them into the roadmap document
 * itself; the app keeps them in `userRoadmapProgress` now. Both shapes are
 * still in the database, so both are read — for the owner. The counters inside
 * the document are the owner's, so a follower's run skips them.
 */
const mergeStepProgress = (
  roadmap: Roadmap,
  progress: StoredProgress | undefined,
  includeEmbedded = true,
): Record<string, number> => {
  const merged: Record<string, number> = {};

  if (includeEmbedded)
    (roadmap.phases ?? []).forEach((phase) =>
      (phase.steps ?? []).forEach((step) => {
        if (
          typeof step.sessionsCompleted === "number" &&
          step.sessionsCompleted > 0
        ) {
          merged[step.id] = step.sessionsCompleted;
        }
      }),
    );

  Object.entries(progress?.stepProgress ?? {}).forEach(([stepId, value]) => {
    if (typeof value === "number" && value > 0) merged[stepId] = value;
  });

  return merged;
};

const roadmapSteps = (roadmap: Roadmap) =>
  (roadmap.phases ?? []).flatMap((phase) => phase.steps ?? []);

const countCompleted = (
  roadmap: Roadmap,
  stepProgress: Record<string, number>,
) =>
  roadmapSteps(roadmap).filter(
    (step) => (stepProgress[step.id] ?? 0) >= (step.sessionsRequired || 1),
  ).length;

const sumSessions = (stepProgress: Record<string, number>) =>
  Object.values(stepProgress).reduce((sum, value) => sum + value, 0);

/** A follower's run: only what they logged themselves. */
const runProgress = (
  roadmap: Roadmap,
  progress: StoredProgress,
): RoadmapRunProgress => {
  const stepProgress = mergeStepProgress(roadmap, progress, false);
  const sessions = sumSessions(stepProgress);
  return {
    completedSteps: countCompleted(roadmap, stepProgress),
    sessionsCompleted: sessions,
    startedAt: progress.startedAt ?? null,
    lastPractisedAt: sessions > 0 ? (progress.updatedAt ?? null) : null,
  };
};

interface SummaryExtras {
  followerCount?: number;
  viewerProgress?: StoredProgress;
}

const summarise = (
  roadmap: Roadmap,
  author: Author | undefined,
  progress: StoredProgress | undefined,
  { followerCount = 0, viewerProgress }: SummaryExtras = {},
): UserRoadmapSummary => {
  const steps = roadmapSteps(roadmap);
  const stepProgress = mergeStepProgress(roadmap, progress);
  const createdAt = roadmap.createdAt ?? progress?.startedAt ?? "";

  return {
    rowId: progressDocId(roadmap.userId, roadmap.id),
    id: roadmap.id,
    userId: roadmap.userId,
    displayName: author?.displayName ?? null,
    avatar: author?.avatar ?? null,
    title: roadmap.title ?? "",
    goal: roadmap.goal ?? "",
    level: roadmap.level ?? "",
    createdAt,
    updatedAt: progress?.updatedAt ?? roadmap.updatedAt ?? createdAt,
    phaseCount: roadmap.phases?.length ?? 0,
    stepCount: steps.length,
    describedSteps: steps.filter((step) => !!step.description).length,
    exerciseSteps: steps.filter((step) => !!step.suggestedExerciseId).length,
    songSteps: steps.filter((step) => !!step.suggestedSong).length,
    lessonSteps: steps.filter(
      (step) => !!step.suggestedLessonIds?.length || !!step.lessons?.length,
    ).length,
    completedSteps: countCompleted(roadmap, stepProgress),
    sessionsCompleted: sumSessions(stepProgress),
    lastPractisedAt: progress?.updatedAt ?? null,
    visibility: visibilityOf(roadmap),
    checkpointsPassed: Object.values(progress?.phaseChecks ?? {}).filter(
      (check) => !!check?.passedAt,
    ).length,
    followerCount,
    viewerProgress:
      viewerProgress && viewerProgress.userId !== roadmap.userId
        ? runProgress(roadmap, viewerProgress)
        : null,
  };
};

/**
 * The roadmaps the AI generated for the players, newest activity first. The
 * curated roadmaps from src/data/roadmaps are deliberately absent: they are
 * the same seven for everybody, and reading them here would say nothing the
 * app does not already show.
 */
export async function listUserRoadmaps(
  /** Whose board it is: their own private roadmaps show, nobody else's do. */
  viewerUid?: string | null,
): Promise<UserRoadmapSummary[]> {
  const [roadmapSnap, progressSnap] = await Promise.all([
    firestore.collection(ROADMAPS_COLLECTION).get() as Promise<QuerySnapshot>,
    firestore.collection(PROGRESS_COLLECTION).get() as Promise<QuerySnapshot>,
  ]);

  const roadmaps = roadmapSnap.docs
    .map((doc) => doc.data() as Roadmap)
    .filter((roadmap) => isRoadmapVisibleTo(roadmap, viewerUid));

  const ownerById = new Map(
    roadmaps.map((roadmap) => [roadmap.id, roadmap.userId]),
  );
  const progressById = new Map<string, StoredProgress>();
  const followers = new Map<string, number>();
  progressSnap.docs.forEach((doc) => {
    const progress = doc.data() as StoredProgress;
    if (!progress?.userId || !progress?.roadmapId) return;
    progressById.set(
      progressDocId(progress.userId, progress.roadmapId),
      progress,
    );
    const owner = ownerById.get(progress.roadmapId);
    if (owner && owner !== progress.userId) {
      followers.set(
        progress.roadmapId,
        (followers.get(progress.roadmapId) ?? 0) + 1,
      );
    }
  });

  const authors = await fetchAuthors([
    ...new Set(roadmaps.map((roadmap) => roadmap.userId).filter(Boolean)),
  ]);

  return roadmaps
    .map((roadmap) =>
      summarise(
        roadmap,
        authors.get(roadmap.userId),
        progressById.get(progressDocId(roadmap.userId, roadmap.id)),
        {
          followerCount: followers.get(roadmap.id) ?? 0,
          viewerProgress: viewerUid
            ? progressById.get(progressDocId(viewerUid, roadmap.id))
            : undefined,
        },
      ),
    )
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/**
 * One roadmap with its steps, and what one player logged against them: the
 * owner by default, or the viewer on a roadmap they are following. Nobody
 * else's run is on offer.
 */
export async function getUserRoadmap(
  id: string,
  userId: string,
  viewerUid?: string | null,
  progressUid?: string | null,
): Promise<UserRoadmapDetail | null> {
  const runner =
    progressUid && viewerUid && progressUid === viewerUid ? viewerUid : userId;
  const [snap, progressSnap, viewerSnap] = await Promise.all([
    firestore
      .collection(ROADMAPS_COLLECTION)
      .doc(id)
      .get() as Promise<DocumentSnapshot>,
    firestore
      .collection(PROGRESS_COLLECTION)
      .doc(progressDocId(userId, id))
      .get() as Promise<DocumentSnapshot>,
    viewerUid && viewerUid !== userId
      ? (firestore
          .collection(PROGRESS_COLLECTION)
          .doc(progressDocId(viewerUid, id))
          .get() as Promise<DocumentSnapshot>)
      : Promise.resolve(null),
  ]);

  if (!snap.exists) return null;

  const roadmap = snap.data() as Roadmap;
  // A private roadmap answers "not found" to anyone but its owner, the same
  // as one that is not there: its existence is theirs too.
  if (!isRoadmapVisibleTo(roadmap, viewerUid)) return null;
  const progress = progressSnap.exists
    ? (progressSnap.data() as StoredProgress)
    : undefined;
  const viewerProgress = viewerSnap?.exists
    ? (viewerSnap.data() as StoredProgress)
    : undefined;
  const authors = await fetchAuthors(roadmap.userId ? [roadmap.userId] : []);
  const run = runner === userId ? progress : viewerProgress;

  return {
    summary: summarise(roadmap, authors.get(roadmap.userId), progress, {
      viewerProgress,
    }),
    roadmap,
    stepProgress: mergeStepProgress(roadmap, run, runner === userId),
    phaseChecks: run?.phaseChecks ?? {},
  };
}
