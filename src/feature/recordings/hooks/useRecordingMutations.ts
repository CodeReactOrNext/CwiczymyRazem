import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRecording } from "feature/recordings/services/addRecording";
import type { RecordingCreateData } from "feature/recordings/types/types";
import { addComment } from "feature/recordings/services/comments.service";
import { toggleLikeRecording } from "feature/recordings/services/toggleLikeRecording";
import { deleteRecording as deleteRecordingService } from "feature/recordings/services/deleteRecording";
import { toast } from "sonner";

export const useRecordingMutations = () => {
  const queryClient = useQueryClient();

  const addRecordingMutation = useMutation({
    mutationFn: (data: { userId: string; recordingData: RecordingCreateData }) =>
      addRecording(data.userId, data.recordingData),
    onSuccess: () => {
      toast.success("Recording added successfully!");
      queryClient.invalidateQueries(["recordings"] as any);
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Failed to add recording.");
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (data: { recordingId: string; userId: string }) =>
      toggleLikeRecording(data.recordingId, data.userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["recordings"] as any);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { recordingId: string; userId: string; content: string }) =>
      addComment(data.recordingId, data.userId, data.content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["comments", variables.recordingId] as any);
      queryClient.invalidateQueries(["recordings"] as any); // Update comment count
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment.");
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (data: { recordingId: string; userId: string }) =>
      deleteRecordingService(data.recordingId, data.userId),
    onSuccess: () => {
      toast.success("Recording deleted successfully.");
      queryClient.invalidateQueries(["recordings"] as any);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete recording.");
    }
  });

  return {
    addRecording: addRecordingMutation.mutateAsync,
    isAdding: addRecordingMutation.isPending,
    toggleLike: toggleLikeMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
    deleteRecording: deleteRecordingMutation.mutateAsync,
    isDeleting: deleteRecordingMutation.isPending
  };
};
