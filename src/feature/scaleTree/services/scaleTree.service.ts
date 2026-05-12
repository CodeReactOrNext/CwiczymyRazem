import { collection } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import { SCALE_TREE_NODES } from "../data/scaleTreeNodes";
import type { BpmProgressMap, NodeStatus } from "../types/scaleTree.types";

const BPM_PROGRESS_SUBCOLLECTION = "exerciseBpmProgress";

export async function fetchAllBpmProgress(userId: string): Promise<BpmProgressMap> {
  const progressRef = collection(db, "users", userId, BPM_PROGRESS_SUBCOLLECTION);
  const snapshot = await trackedGetDocs(progressRef);

  const map: BpmProgressMap = new Map();
  snapshot.forEach((doc) => {
    const data = doc.data() as { completedBpms?: number[] };
    map.set(doc.id, data.completedBpms ?? []);
  });

  return map;
}

export function computeNodeStatuses(progressMap: BpmProgressMap): Record<string, NodeStatus> {
  const statuses: Record<string, NodeStatus> = {};
  const completedIds = new Set<string>();

  // Topological pass: repeat until stable (handles DAG dependencies)
  let changed = true;
  while (changed) {
    changed = false;

    for (const node of SCALE_TREE_NODES) {
      const prerequisitesMet = node.prerequisites.every((id) => completedIds.has(id));

      if (!prerequisitesMet) {
        if (statuses[node.id] !== "locked") {
          statuses[node.id] = "locked";
          changed = true;
        }
        continue;
      }

      const doneCount = node.requiredExercises.filter((req) => {
        const bpms = progressMap.get(req.exerciseId) ?? [];
        return bpms.some((b) => b >= req.requiredBpm);
      }).length;

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
