import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  backRoadmapIdea,
  fetchRoadmapBoard,
  postRoadmapIdea,
  setRoadmapIdeaStatus,
} from "feature/supporterPanel/services/supporterPanel.service";
import type {
  RoadmapBoard,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import { toast } from "sonner";

export const SUPPORTER_ROADMAP_KEY = ["supporter-roadmap"] as const;

const STALE_TIME = 30 * 1000;

/** The board. Skipped entirely for anyone without the badge — the route would 403. */
export const useSupporterRoadmap = (enabled: boolean) =>
  useQuery({
    queryKey: SUPPORTER_ROADMAP_KEY,
    queryFn: fetchRoadmapBoard,
    enabled,
    staleTime: STALE_TIME,
  });

/** Whatever the server says the board is after a write — no local recount. */
const errorMessage = (error: unknown, fallback: string): string => {
  const responseError = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return responseError || fallback;
};

export const useRoadmapMutations = () => {
  const queryClient = useQueryClient();

  const applyBoard = (board: RoadmapBoard) =>
    queryClient.setQueryData(SUPPORTER_ROADMAP_KEY, board);

  const back = useMutation({
    mutationFn: ({ ideaId, amount }: { ideaId: string; amount: number }) =>
      backRoadmapIdea(ideaId, amount),
    onSuccess: applyBoard,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not spend that token")),
  });

  const postIdea = useMutation({
    mutationFn: postRoadmapIdea,
    onSuccess: (board) => {
      applyBoard(board);
      toast.success("Idea posted");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not post that idea")),
  });

  const changeStatus = useMutation({
    mutationFn: ({
      ideaId,
      status,
    }: {
      ideaId: string;
      status: RoadmapIdeaStatus;
    }) => setRoadmapIdeaStatus(ideaId, status),
    onSuccess: applyBoard,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not change the status")),
  });

  return { back, postIdea, changeStatus };
};
