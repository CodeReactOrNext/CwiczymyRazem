import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent } from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { UserLink } from "components/UserLink";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import { getComments } from "feature/recordings/services/comments.service";
import { getRecordingById } from "feature/recordings/services/getRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  Calendar,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface RecordingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string | null;
  initialRecording?: any;
}

export const RecordingViewModal = ({
  isOpen,
  onClose,
  recordingId,
  initialRecording,
}: RecordingViewModalProps) => {
  const [newComment, setNewComment] = useState("");
  const userId = useAppSelector(selectUserAuth);
  const { addComment, isAddingComment, toggleLike } = useRecordingMutations();

  // Fetch recording data if not provided or if we only have ID
  const { data: recording, isLoading: isLoadingRecording } = useQuery({
    queryKey: ["recording", recordingId],
    queryFn: () => (recordingId ? getRecordingById(recordingId) : null),
    enabled: !!recordingId && isOpen,
    initialData: initialRecording,
  });

  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", recordingId],
    queryFn: () => (recordingId ? getComments(recordingId) : []),
    enabled: !!recordingId && isOpen,
  });

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
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

  const formattedDate = recording?.createdAt
    ? new Date(
        (recording.createdAt as any)?.toDate
          ? (recording.createdAt as any).toDate()
          : recording.createdAt,
      ).toLocaleDateString()
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='flex h-full max-w-none flex-col overflow-hidden border-white/5 bg-zinc-950 p-0 text-white sm:h-[85vh] sm:max-w-6xl sm:flex-row sm:rounded-2xl'>
        {/* Left Side: Video & Info */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden border-white/5 sm:border-r'>
          <div className='relative z-10 aspect-video shrink-0 bg-black'>
            {videoId ? (
              <iframe
                width='100%'
                height='100%'
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={recording?.title}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
                className='absolute inset-0'
              />
            ) : (
              <div className='absolute inset-0 flex items-center justify-center text-zinc-600'>
                <Video className='h-12 w-12 opacity-20' />
              </div>
            )}
          </div>

          {/* Scrollable Content Wrapper - On mobile this will contain Info + Comments if we were to restructure, but let's keep it simple: just make the info part scroll and comments part scroll separately if side-by-side, or stacked. */}
          {/* To fix the user's issue: on mobile we need the "Right Side" to be visible. */}
          <div className='custom-scrollbar flex flex-1 flex-col overflow-y-auto'>
            <div className='shrink-0 p-6 sm:flex-1'>
              {isLoadingRecording ? (
                <div className='animate-pulse space-y-4'>
                  <div className='h-8 w-3/4 rounded bg-zinc-900' />
                  <div className='h-4 w-1/2 rounded bg-zinc-900' />
                  <div className='h-20 rounded bg-zinc-900' />
                </div>
              ) : recording ? (
                <div className='space-y-6'>
                  <div>
                    <div className='mb-2 flex items-center justify-between gap-4'>
                      <h2 className='text-xl font-bold text-white sm:text-2xl'>
                        {recording.title}
                      </h2>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleLike}
                        className={cn(
                          "gap-2 hover:bg-red-500/10",
                          hasLiked ? "text-red-500" : "text-zinc-400",
                        )}>
                        <Heart
                          className={cn("h-5 w-5", hasLiked && "fill-current")}
                        />
                        <span className='font-bold'>
                          {recording.likes?.length || 0}
                        </span>
                      </Button>
                    </div>

                    {(recording.songTitle || recording.songArtist) && (
                      <div className='mb-4 inline-block rounded bg-cyan-950/30 px-3 py-1 text-sm font-medium text-cyan-400'>
                        {recording.songArtist} - {recording.songTitle}
                      </div>
                    )}

                    <div className='mb-6 flex items-center gap-6 text-[10px] font-medium text-zinc-500 sm:text-xs'>
                      <UserLink
                        uid={recording.userId}
                        userName={recording.userDisplayName || "?"}
                        avatarUrl={recording.userAvatarUrl}
                        lvl={recording.userAvatarFrame}
                        size='xs'
                        nameClassName='text-zinc-300'
                      />
                      <div className='flex items-center gap-1.5'>
                        <Calendar className='h-3 w-3' />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <p className='whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 sm:text-base'>
                      {recording.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='py-20 text-center text-zinc-500'>
                  Recording not found
                </div>
              )}
            </div>

            {/* Mobile-only Comments Section (Visible when vertical/mobile) */}
            <div className='flex flex-col border-t border-white/5 bg-zinc-900/50 sm:hidden'>
              <div className='flex items-center gap-2 p-4'>
                <MessageSquare className='h-4 w-4 text-cyan-400' />
                <span className='text-sm font-bold'>
                  Comments ({comments?.length || 0})
                </span>
              </div>
              <div className='space-y-4 p-4'>
                {comments?.map((comment) => (
                  <div key={comment.id} className='flex gap-3'>
                    <UserLink
                      uid={comment.userId}
                      userName={comment.userName || "?"}
                      avatarUrl={comment.userAvatarUrl}
                      lvl={comment.userAvatarFrame}
                      size='xs'
                      className='shrink-0 self-start'
                      showName={false}
                    />
                    <div className='min-w-0 flex-1 rounded-lg border border-white/5 bg-zinc-800/50 p-2.5'>
                      <div className='mb-1 flex items-start justify-between'>
                        <span
                          translate='no'
                          className='truncate pr-2 text-xs font-bold text-cyan-400'>
                          {comment.userName}
                        </span>
                        <span className='mt-0.5 shrink-0 text-[9px] text-zinc-500'>
                          {comment.createdAt
                            ? new Date(
                                (comment.createdAt as any).toDate
                                  ? (comment.createdAt as any).toDate()
                                  : comment.createdAt,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p className='whitespace-pre-wrap text-xs lowercase leading-normal text-zinc-300 first-letter:uppercase'>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                {comments?.length === 0 && (
                  <p className='py-4 text-center text-xs text-zinc-500'>
                    No comments yet.
                  </p>
                )}
              </div>
              <div className='sticky bottom-0 border-t border-white/5 bg-zinc-950 p-4'>
                <form onSubmit={handleSubmitComment} className='flex gap-2'>
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder='Write a comment...'
                    className='h-10 border-white/10 bg-zinc-900 text-sm'
                    disabled={isAddingComment}
                  />
                  <Button
                    type='submit'
                    size='icon'
                    disabled={!newComment.trim() || isAddingComment}
                    className='h-10 w-10 shrink-0 bg-cyan-600 text-white hover:bg-cyan-500'>
                    {isAddingComment ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Send className='h-4 w-4' />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Comments (Desktop only) */}
        <div className='hidden w-80 flex-col bg-zinc-900/30 sm:flex lg:w-96'>
          <div className='flex items-center justify-between border-b border-white/5 p-4'>
            <div className='flex items-center gap-2'>
              <MessageSquare className='h-4 w-4 text-cyan-400' />
              <span className='font-bold'>
                Comments ({comments?.length || 0})
              </span>
            </div>
          </div>

          <div className='custom-scrollbar flex-none space-y-4 p-4 sm:flex-1 sm:overflow-y-auto'>
            {isLoadingComments ? (
              <div className='flex justify-center p-8'>
                <Loader2 className='animate-spin text-zinc-500' />
              </div>
            ) : comments?.length === 0 ? (
              <div className='py-12 text-center text-sm italic text-zinc-500'>
                No comments yet.
              </div>
            ) : (
              comments?.map((comment) => (
                <div key={comment.id} className='flex gap-3'>
                  <UserLink
                    uid={comment.userId}
                    userName={comment.userName || "?"}
                    avatarUrl={comment.userAvatarUrl}
                    lvl={comment.userAvatarFrame}
                    size='xs'
                    className='shrink-0 self-start'
                    showName={false}
                  />
                  <div className='min-w-0 flex-1 rounded-lg border border-white/5 bg-zinc-800/50 p-2.5'>
                    <div className='mb-1 flex items-start justify-between'>
                      <span className='truncate pr-2 text-xs font-bold text-cyan-400'>
                        {comment.userName}
                      </span>
                      <span className='mt-0.5 shrink-0 text-[9px] text-zinc-500'>
                        {comment.createdAt
                          ? new Date(
                              (comment.createdAt as any).toDate
                                ? (comment.createdAt as any).toDate()
                                : comment.createdAt,
                            ).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p className='whitespace-pre-wrap text-xs lowercase leading-normal text-zinc-300 first-letter:uppercase'>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className='border-t border-white/5 bg-zinc-950 p-4'>
            <form onSubmit={handleSubmitComment} className='flex gap-2'>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder='Write a comment...'
                className='h-9 border-white/10 bg-zinc-900 text-sm'
                disabled={isAddingComment}
              />
              <Button
                type='submit'
                size='icon'
                disabled={!newComment.trim() || isAddingComment}
                className='h-9 w-9 shrink-0 bg-cyan-600 text-white hover:bg-cyan-500'>
                {isAddingComment ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Send className='h-4 w-4' />
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
