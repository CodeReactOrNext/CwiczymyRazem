import { createHash } from "crypto";
import roadmaps from "data/roadmaps";
import type { PhaseQuiz } from "feature/aiCoach/types/phaseCheck.types";
import type {
  Roadmap,
  RoadmapPhase,
  StaticRoadmap,
} from "feature/aiCoach/types/roadmap.types";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

import { isRoadmapLevel } from "./generation/levels";
import { GenerationError } from "./generation/openaiJson";
import { generatePhaseQuiz } from "./generation/phaseQuiz";
import type { UsageLedger } from "./generation/usage";

const QUIZZES_COLLECTION = "roadmapPhaseQuizzes";
const ROADMAPS_COLLECTION = "roadmaps";

/** The parts of a roadmap the quiz is written from — the same for both sources. */
export interface QuizSource {
  id: string;
  goal: string;
  level: string;
  phases: RoadmapPhase[];
}

const quizDocId = (roadmapId: string, phaseId: string) =>
  `${roadmapId}_${phaseId}`;

/**
 * What the questions were written from. A rewritten step — the editor
 * regenerating its copy, say — changes the hash, and the next player to open
 * the checkpoint gets a quiz about the text they actually read.
 */
export const phaseFingerprint = (phase: RoadmapPhase): string =>
  createHash("sha1")
    .update(
      JSON.stringify(
        phase.steps.map((step) => [
          step.id,
          step.title,
          step.description ?? "",
          step.successCriteria ?? "",
        ]),
      ),
    )
    .digest("hex");

const toSource = (roadmap: StaticRoadmap | Roadmap): QuizSource => ({
  id: roadmap.id,
  goal: roadmap.goal,
  level: roadmap.level,
  phases: (roadmap.phases ?? []).map((phase) => ({
    ...phase,
    steps: (phase.steps ?? []).map((step) => ({
      sessionsCompleted: 0,
      ...step,
    })),
  })),
});

/**
 * The roadmap a checkpoint belongs to. The seven curated ones come from the
 * repo; anything else is a generated roadmap in Firestore, and only its owner
 * (or the admin editor) gets a quiz written for it — the questions cost real
 * money and a supporter browsing somebody else's map is only looking.
 */
export async function resolveQuizSource(
  roadmapId: string,
  viewer: { uid: string | null; isAdmin: boolean },
): Promise<QuizSource | null> {
  const curated = (roadmaps as StaticRoadmap[]).find((r) => r.id === roadmapId);
  if (curated) return toSource(curated);

  const snap = (await firestore
    .collection(ROADMAPS_COLLECTION)
    .doc(roadmapId)
    .get()) as DocumentSnapshot;
  if (!snap.exists) return null;

  const roadmap = snap.data() as Roadmap;
  if (!viewer.isAdmin && roadmap.userId !== viewer.uid) {
    throw new GenerationError(
      "Only the roadmap's owner can sit its checkpoints",
      403,
    );
  }
  return toSource(roadmap);
}

/**
 * The quiz for one phase — read from the cache when its steps have not changed
 * since it was written, generated and cached otherwise. One generation per
 * roadmap and phase, shared by everyone on it, is what keeps a curated
 * roadmap's seven checkpoints a one-off cost rather than a per-player one.
 */
export async function getOrCreatePhaseQuiz(
  source: QuizSource,
  phaseId: string,
  ledger?: UsageLedger,
): Promise<PhaseQuiz> {
  const phaseIndex = source.phases.findIndex((phase) => phase.id === phaseId);
  const phase = source.phases[phaseIndex];
  if (!phase?.steps?.length) throw new GenerationError("No such phase", 404);
  if (!isRoadmapLevel(source.level)) {
    throw new GenerationError("This roadmap has no usable skill level", 400);
  }

  const fingerprint = phaseFingerprint(phase);
  const ref = firestore
    .collection(QUIZZES_COLLECTION)
    .doc(quizDocId(source.id, phaseId));
  const cached = (await ref.get()) as DocumentSnapshot;
  if (cached.exists) {
    const quiz = cached.data() as PhaseQuiz;
    if (quiz.fingerprint === fingerprint && quiz.questions?.length) return quiz;
  }

  const questions = await generatePhaseQuiz({
    goal: source.goal,
    level: source.level,
    phases: source.phases,
    phaseIndex,
    ledger,
  });

  const quiz: PhaseQuiz = {
    roadmapId: source.id,
    phaseId,
    fingerprint,
    questions,
    createdAt: new Date().toISOString(),
  };
  await ref.set(quiz);
  return quiz;
}
