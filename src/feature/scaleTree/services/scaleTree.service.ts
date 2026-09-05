import { collection } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import { collectBpms, isExerciseCleared } from "../data/exerciseClearance";
import { SCALE_TREE_NODES } from "../data/scaleTreeNodes";
import type {
  BpmProgressMap,
  NodeStatus,
  ScaleRecordMap,
  ScaleTreeProgress,
} from "../types/scaleTree.types";

// Re-exported so the callers that have always read them from here keep working;
// they live in `data/exerciseClearance` because the claim routes need them
// without dragging the client SDK below into a server bundle.
export { collectBpms, isExerciseCleared };

const BPM_PROGRESS_SUBCOLLECTION = "exerciseBpmProgress";

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
        isExerciseCleared(req, collectBpms(req, progressMap))
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
