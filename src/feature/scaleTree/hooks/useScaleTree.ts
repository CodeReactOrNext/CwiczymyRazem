import { selectUserAuth } from "feature/user/store/userSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { SCALE_TREE_NODES, SCALE_TREE_REWARD_NODES } from "../data/scaleTreeNodes";
import { computeNodeStatuses, fetchAllBpmProgress } from "../services/scaleTree.service";
import { getClaimedRewards } from "../services/rewardService";
import type { BpmProgressMap, ScaleTreeNodeData, RewardNodeDef } from "../types/scaleTree.types";
import type { Edge } from "@xyflow/react";

export function useScaleTree() {
  const userId = useAppSelector(selectUserAuth);
  const [progressMap, setProgressMap] = useState<BpmProgressMap>(new Map());
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [map, rewards] = await Promise.all([
        fetchAllBpmProgress(userId),
        getClaimedRewards(userId),
      ]);
      setProgressMap(map);
      setClaimedRewards(rewards);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const nodeStatuses = useMemo(() => computeNodeStatuses(progressMap), [progressMap]);

  const rfNodes = useMemo(() => {
    const treeNodes = SCALE_TREE_NODES.map((node) => {
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

    const rewardNodes = SCALE_TREE_REWARD_NODES.map((reward) => ({
      id: reward.id,
      position: reward.position,
      type: "rewardNode" as const,
      data: {
        ...reward,
        claimed: claimedRewards.includes(reward.id),
        userId,
      },
    }));

    return [...treeNodes, ...rewardNodes];
  }, [nodeStatuses, progressMap, claimedRewards]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? SCALE_TREE_NODES.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId]
  );

  const selectedNodeStatus = selectedNodeId ? (nodeStatuses[selectedNodeId] ?? "locked") : null;

  const rfEdges = useMemo<Edge[]>(
    () => {
      const treeEdges = SCALE_TREE_NODES.flatMap((node) =>
        node.prerequisites.map((prereqId) => ({
          id: `e-${prereqId}-${node.id}`,
          source: prereqId,
          target: node.id,
        })),
      );

      const rewardEdges = SCALE_TREE_REWARD_NODES.flatMap((reward) =>
        reward.prerequisites.map((prereqId) => ({
          id: `e-${prereqId}-${reward.id}`,
          source: prereqId,
          target: reward.id,
        })),
      );

      return [...treeEdges, ...rewardEdges];
    },
    [],
  );

  const refreshClaimedRewards = useCallback(async () => {
    if (!userId) return;
    try {
      const rewards = await getClaimedRewards(userId);
      setClaimedRewards(rewards);
    } catch (error) {
      console.error("Failed to refresh claimed rewards:", error);
    }
  }, [userId]);

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
    refreshClaimedRewards,
    claimedRewards,
    userId,
  };
}
