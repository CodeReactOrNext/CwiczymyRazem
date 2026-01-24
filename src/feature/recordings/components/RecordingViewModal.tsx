import Avatar from "components/UI/Avatar";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import { getComments } from "feature/recordings/services/comments.service"; 
import { getRecordingById } from "feature/recordings/services/getRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Loader2, MessageSquare, Send, Heart, Video, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "store/hooks";
import { cn } from "assets/lib/utils";

interface RecordingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string | null;
  initialRecording?: any;
}

export const RecordingViewModal = ({ isOpen, onClose, recordingId, initialRecording }: RecordingViewModalProps) => {
  const [newComment, setNewComment] = useState("");
  const userId = useAppSelector(selectUserAuth);
  const { addComment, isAddingComment, toggleLike } = useRecordingMutations();

  // Fetch recording data if not provided or if we only have ID
  const { data: recording, isLoading: isLoadingRecording } = useQuery({
      queryKey: ["recording", recordingId],
      queryFn: () => recordingId ? getRecordingById(recordingId) : null,
      enabled: !!recordingId && isOpen,
      initialData: initialRecording,
  });

  const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = useQuery({
      queryKey: ["comments", recordingId],
      queryFn: () => recordingId ? getComments(recordingId) : [],
      enabled: !!recordingId && isOpen,
  });

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = recording ? getYoutubeId(recording.videoUrl) : null;
  const hasLiked = userId && recording?.likes?.includes(userId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !recordingId || !userId) return;

    await addComment({ recordingId, userId, content: newComment });
    setNewComment("");
    refetchComments();
  };

  const handleLike = async () => {
      if (!userId || !recordingId) return;
      await toggleLike({ recordingId, userId });
  };

  const formattedDate = recording?.createdAt ? new Date(
      (recording.createdAt as any)?.toDate 
      ? (recording.createdAt as any).toDate() 
      : recording.createdAt
  ).toLocaleDateString() : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-zinc-950 border-white/5 text-white p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh]">
        {/* Left Side: Video & Info */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-white/5">
            <div className="aspect-video bg-black relative">
                {videoId ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title={recording?.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <Video className="h-12 w-12 opacity-20" />
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingRecording ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-8 bg-zinc-900 rounded w-3/4" />
                        <div className="h-4 bg-zinc-900 rounded w-1/2" />
                        <div className="h-20 bg-zinc-900 rounded" />
                    </div>
                ) : recording ? (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <h2 className="text-2xl font-bold text-white">{recording.title}</h2>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleLike}
                                    className={cn("gap-2 hover:bg-red-500/10", hasLiked ? "text-red-500" : "text-zinc-400")}
                                >
                                    <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
                                    <span className="font-bold">{recording.likes?.length || 0}</span>
                                </Button>
                            </div>
                            
                            {(recording.songTitle || recording.songArtist) && (
                                <div className="text-sm font-medium text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded inline-block mb-4">
                                    {recording.songArtist} - {recording.songTitle}
                                </div>
                            )}

                            <div className="flex items-center gap-6 text-xs text-zinc-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    <span className="font-semibold text-zinc-300">{recording.userDisplayName}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formattedDate}</span>
                                </div>
                            </div>

                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {recording.description}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-zinc-500">Recording not found</div>
                )}
            </div>
        </div>

        {/* Right Side: Comments */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-zinc-900/30">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                    <span className="font-bold">Comments ({comments?.length || 0})</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isLoadingComments ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-500" /></div>
                ) : comments?.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12 italic text-sm">No comments yet.</div>
                ) : (
                    comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="shrink-0 transform scale-75 origin-top">
                                <Avatar 
                                    avatarURL={comment.userAvatarUrl || undefined} 
                                    name={comment.userName || "?"}
                                    lvl={comment.userAvatarFrame}
                                    size="sm"
                                />
                            </div>
                            <div className="flex-1 min-w-0 bg-zinc-800/50 rounded-lg p-2.5 border border-white/5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs text-cyan-400 truncate pr-2">{comment.userName}</span>
                                    <span className="text-[9px] text-zinc-500 shrink-0 mt-0.5">
                                        {comment.createdAt ? new Date((comment.createdAt as any).toDate ? (comment.createdAt as any).toDate() : comment.createdAt).toLocaleDateString() : ""}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-normal lowercase first-letter:uppercase">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-white/5 bg-zinc-950">
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <Input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="bg-zinc-900 border-white/10 h-9 text-sm"
                        disabled={isAddingComment}
                    />
                    <Button type="submit" size="icon" disabled={!newComment.trim() || isAddingComment} className="h-9 w-9 bg-cyan-600 hover:bg-cyan-500 text-white shrink-0">
                        {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
