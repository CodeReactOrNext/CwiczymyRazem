import { collection } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import { SCALE_TREE_NODES } from "../data/scaleTreeNodes";
import type {
  BpmProgressMap,
  NodeStatus,
  RequiredExercise,
  ScaleRecordMap,
  ScaleTreeProgress,
} from "../types/scaleTree.types";

const BPM_PROGRESS_SUBCOLLECTION = "exerciseBpmProgress";

/**
 * Whether a required exercise counts as passed. The bar is the exercise's
 * current target BPM, or the lower one it had before the tempo bump — players
 * who already cleared a node under the old rules keep it cleared.
 */
export function isExerciseCleared(req: RequiredExercise, bpms: number[]): boolean {
  const threshold =
    req.legacyRequiredBpm != null
      ? Math.min(req.requiredBpm, req.legacyRequiredBpm)
      : req.requiredBpm;
  return bpms.some((b) => b >= threshold);
}

/**
 * Reads the whole `exerciseBpmProgress` subcollection once: cleared tempos (what
 * unlocks nodes) and record runs (the personal best shown on the node) live in
 * the same documents, so they travel together.
 */
export async function fetchAllBpmProgress(userId: string): Promise<ScaleTreeProgress> {
  const progressRef = collection(db, "users", userId, BPM_PROGRESS_SUBCOLLECTION);
  const snapshot = await trackedGetDocs(progressRef);

  const bpms: BpmProgressMap = new Map();
  const records: ScaleRecordMap = new Map();
  snapshot.forEach((doc) => {
    const data = doc.data() as {
      completedBpms?: number[];
      recordBpm?: number;
      recordBpmRoot?: string;
      recordBpmAccuracy?: number;
    };
    bpms.set(doc.id, data.completedBpms ?? []);
    if (data.recordBpm) {
      records.set(doc.id, {
        bpm: data.recordBpm,
        rootNote: data.recordBpmRoot,
        accuracy: data.recordBpmAccuracy,
      });
    }
  });

  return { bpms, records };
}

export function computeNodeStatuses(progressMap: BpmProgressMap): Record<string, NodeStatus> {
  const statuses: Record<string, NodeStatus> = {};
  const completedIds = new Set<string>();

  // Topological pass: repeat until stable (handles DAG dependencies)
  let changed = true;
  while (changed) {
    changed = false;

    for (const node of SCALE_TREE_NODES) {
      const isSingleString = node.id.includes('single_string');
      const prerequisitesMet = isSingleString || node.prerequisites.every((id) => completedIds.has(id));

      if (!prerequisitesMet) {
        if (statuses[node.id] !== "locked") {
          statuses[node.id] = "locked";
          changed = true;
        }
        continue;
      }

      const doneCount = node.requiredExercises.filter((req) =>
        isExerciseCleared(req, progressMap.get(req.exerciseId) ?? [])
      ).length;

      const newStatus: NodeStatus =
        doneCount === node.requiredExercises.length
          ? "completed"
          : doneCount > 0
          ? "in_progress"
          : "available";

      if (newStatus === "completed") {
        completedIds.add(node.id);
      }

      if (statuses[node.id] !== newStatus) {
        statuses[node.id] = newStatus;
        changed = true;
      }
    }
  }

  return statuses;
}
