import { selectUserAuth } from "feature/user/store/userSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { SCALE_TREE_NODES } from "../data/scaleTreeNodes";
import { computeNodeStatuses, fetchAllBpmProgress } from "../services/scaleTree.service";
import type { BpmProgressMap, ScaleTreeNodeData } from "../types/scaleTree.types";
import type { Edge } from "@xyflow/react";

export function useScaleTree() {
  const userId = useAppSelector(selectUserAuth);
  const [progressMap, setProgressMap] = useState<BpmProgressMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const map = await fetchAllBpmProgress(userId);
      setProgressMap(map);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const nodeStatuses = useMemo(() => computeNodeStatuses(progressMap), [progressMap]);

  const rfNodes = useMemo(() => {
    return SCALE_TREE_NODES.map((node) => {
      const doneCount = node.requiredExercises.filter((req) => {
        const bpms = progressMap.get(req.exerciseId) ?? [];
        return bpms.some((b) => b >= req.requiredBpm);
      }).length;

      const firstReq = node.requiredExercises[0];
      const bpmsForFirst = firstReq ? (progressMap.get(firstReq.exerciseId) ?? []) : [];
      const currentBpm = bpmsForFirst.length > 0 ? Math.max(...bpmsForFirst) : null;

      const data: ScaleTreeNodeData = {
        ...node,
        status: nodeStatuses[node.id] ?? "locked",
        progress: { done: doneCount, total: node.requiredExercises.length },
        currentBpm,
      };

      return {
        id: node.id,
        position: node.position,
        type: "scaleTreeNode" as const,
        data,
      };
    });
  }, [nodeStatuses, progressMap]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? SCALE_TREE_NODES.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId]
  );

  const selectedNodeStatus = selectedNodeId ? (nodeStatuses[selectedNodeId] ?? "locked") : null;

  const rfEdges = useMemo<Edge[]>(
    () =>
      SCALE_TREE_NODES.flatMap((node) =>
        node.prerequisites.map((prereqId) => ({
          id: `e-${prereqId}-${node.id}`,
          source: prereqId,
          target: node.id,
        })),
      ),
    [],
  );

  return {
    rfNodes,
    rfEdges,
    selectedNode,
    selectedNodeId,
    selectedNodeStatus,
    setSelectedNodeId,
    progressMap,
    setProgressMap,
    isLoading,
    refreshProgress: loadProgress,
    userId,
  };
}
