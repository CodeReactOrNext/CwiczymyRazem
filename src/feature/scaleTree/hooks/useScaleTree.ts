import type { Edge } from "@xyflow/react";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { SCALE_TREE_NODES, SCALE_TREE_REWARD_NODES } from "../data/scaleTreeNodes";
import { getClaimedRewards } from "../services/rewardService";
import { computeNodeStatuses, fetchAllBpmProgress, isExerciseCleared } from "../services/scaleTree.service";
import type { BpmProgressMap,ScaleRecordMap,ScaleTreeNodeData } from "../types/scaleTree.types";

const progressCache: Record<string, BpmProgressMap> = {};
const recordsCache: Record<string, ScaleRecordMap> = {};
const rewardsCache: Record<string, string[]> = {};

export function useScaleTree() {
  const userId = useAppSelector(selectUserAuth);
  const [progressMap, setProgressMap] = useState<BpmProgressMap>(() => {
    if (userId && progressCache[userId]) {
      return progressCache[userId];
    }
    return new Map();
  });
  const [recordMap, setRecordMap] = useState<ScaleRecordMap>(() => {
    if (userId && recordsCache[userId]) {
      return recordsCache[userId];
    }
    return new Map();
  });
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    if (userId && rewardsCache[userId]) {
      return rewardsCache[userId];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      if (progressCache[userId]) {
        setProgressMap(progressCache[userId]);
      }
      if (recordsCache[userId]) {
        setRecordMap(recordsCache[userId]);
      }
      if (rewardsCache[userId]) {
        setClaimedRewards(rewardsCache[userId]);
      }
    }
  }, [userId]);

  const loadProgress = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [progress, rewards] = await Promise.all([
        fetchAllBpmProgress(userId),
        getClaimedRewards(userId),
      ]);
      progressCache[userId] = progress.bpms;
      recordsCache[userId] = progress.records;
      rewardsCache[userId] = rewards;
      setProgressMap(progress.bpms);
      setRecordMap(progress.records);
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
      const doneCount = node.requiredExercises.filter((req) =>
        isExerciseCleared(req, progressMap.get(req.exerciseId) ?? [])
      ).length;

      const firstReq = node.requiredExercises[0];
      const bpmsForFirst = firstReq ? (progressMap.get(firstReq.exerciseId) ?? []) : [];
      const currentBpm = bpmsForFirst.length > 0 ? Math.max(...bpmsForFirst) : null;

      const data: ScaleTreeNodeData = {
        ...node,
        status: nodeStatuses[node.id] ?? "locked",
        progress: { done: doneCount, total: node.requiredExercises.length },
        currentBpm,
        record: firstReq ? recordMap.get(firstReq.exerciseId) ?? null : null,
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
  }, [nodeStatuses, progressMap, recordMap, claimedRewards, userId]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? SCALE_TREE_NODES.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId]
  );

  const selectedNodeStatus = selectedNodeId ? (nodeStatuses[selectedNodeId] ?? "locked") : null;

  const selectedNodeRecord = useMemo(() => {
    const exerciseId = selectedNode?.requiredExercises[0]?.exerciseId;
    return exerciseId ? recordMap.get(exerciseId) ?? null : null;
  }, [selectedNode, recordMap]);

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
      rewardsCache[userId] = rewards;
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
    selectedNodeRecord,
    setSelectedNodeId,
    progressMap,
    setProgressMap,
    recordMap,
    isLoading,
    refreshProgress: loadProgress,
    refreshClaimedRewards,
    claimedRewards,
    userId,
  };
}
