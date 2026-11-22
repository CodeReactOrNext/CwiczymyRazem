import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent } from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { UserLink } from "components/UserLink";
import { RecordingLikersTooltip } from "feature/recordings/components/RecordingLikersTooltip";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import { getComments } from "feature/recordings/services/comments.service";
import { getRecordingById } from "feature/recordings/services/getRecordings";
import type { Comment } from "feature/recordings/types/types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
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

const toDate = (value: unknown) =>
  value
    ? new Date(
        (value as { toDate?: () => Date }).toDate
          ? (value as { toDate: () => Date }).toDate()
          : (value as string | number),
      )
    : null;

const formatDate = (value: unknown, locale?: string) =>
  toDate(value)?.toLocaleDateString(locale) ?? "";

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/** One comment: avatar beside a plate holding who, when and what — at reading size. */
const CommentItem = ({ comment, locale }: { comment: Comment; locale?: string }) => (
  <div className='flex gap-3'>
    <UserLink
      uid={comment.userId}
      userName={comment.userName || "?"}
      avatarUrl={comment.userAvatarUrl}
      size='sm'
      className='shrink-0 self-start'
      showName={false}
    />
    <div className='min-w-0 flex-1 rounded-lg bg-zinc-800/40 px-4 py-3'>
      <div className='mb-1.5 flex items-baseline justify-between gap-3'>
        <span translate='no' className='truncate text-sm font-semibold text-zinc-100'>
          {comment.userName}
        </span>
        <span className='shrink-0 text-xs text-zinc-500'>
          {formatDate(comment.createdAt, locale)}
        </span>
      </div>
      <p className='whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300 sm:text-[15px]'>
        {comment.content}
      </p>
    </div>
  </div>
);

const CommentList = ({
  comments,
  isLoading,
  locale,
  emptyLabel,
}: {
  comments: Comment[] | undefined;
  isLoading: boolean;
  locale?: string;
  emptyLabel: string;
}) => {
  if (isLoading) {
    return (
      <div className='space-y-5' aria-busy='true'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='flex gap-3'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-full' />
            <Skeleton className='h-20 flex-1 rounded-lg' />
          </div>
        ))}
      </div>
    );
  }

  if (!comments?.length) {
    return (
      <EmptyState
        size='compact'
        icon={<MessageSquare />}
        title={emptyLabel}
        className='bg-transparent px-0'
      />
    );
  }

  return (
    <div className='space-y-5'>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} locale={locale} />
      ))}
    </div>
  );
};

const CommentForm = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  placeholder: string;
}) => (
  <form onSubmit={onSubmit} className='flex gap-2'>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className='h-11 px-4 md:text-[15px]'
      disabled={isSubmitting}
    />
    <Button
      type='submit'
      size='icon-touch'
      disabled={!value.trim() || isSubmitting}
      className='shrink-0'>
      {isSubmitting ? <Loader2 className='animate-spin' /> : <Send />}
    </Button>
  </form>
);

export const RecordingViewModal = ({
  isOpen,
  onClose,
  recordingId,
  initialRecording,
}: RecordingViewModalProps) => {
  const { t } = useTranslation("recordings");
  const intlLocale = useIntlLocale();
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

  const commentsHeading = (
    <h3 className='flex items-center gap-2 text-base font-semibold text-zinc-100'>
      <MessageSquare className='h-5 w-5 text-zinc-400' />
      {t("viewer.comments", { count: comments?.length || 0 })}
    </h3>
  );

  const commentList = (
    <CommentList
      comments={comments}
      isLoading={isLoadingComments}
      locale={intlLocale}
      emptyLabel={t("viewer.no_comments")}
    />
  );

  const commentForm = (
    <CommentForm
      value={newComment}
      onChange={setNewComment}
      onSubmit={handleSubmitComment}
      isSubmitting={isAddingComment}
      placeholder={t("viewer.write_comment")}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent overlayClassName='z-[120]' className='z-[120] flex h-full flex-col overflow-hidden bg-zinc-950 p-0 text-white sm:h-[88vh] sm:max-w-7xl sm:flex-row'>
        {/* Left side: the video, then what it is and who played it. */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
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

          {/* On a phone the comments follow the info in this one scroll; on
              desktop they live in the column on the right. */}
          <div className='custom-scrollbar flex flex-1 flex-col overflow-y-auto'>
            <div className='shrink-0 px-5 py-6 sm:flex-1 sm:px-8 sm:py-8'>
              {isLoadingRecording ? (
                <div className='space-y-4' aria-busy='true'>
                  <Skeleton className='h-9 w-3/4' />
                  <Skeleton className='h-5 w-1/2' />
                  <Skeleton className='h-24 rounded-lg' />
                </div>
              ) : recording ? (
                <div className='flex flex-col gap-5'>
                  <div className='flex items-start justify-between gap-4'>
                    <h2 className='text-xl font-bold leading-snug text-white sm:text-2xl'>
                      {recording.title}
                    </h2>
                    <RecordingLikersTooltip
                      likes={recording.likes ?? []}
                      userId={userId}>
                      <Button
                        variant='ghost'
                        size='touch'
                        onClick={handleLike}
                        className={cn(
                          "shrink-0 gap-2 text-base hover:bg-red-500/10 [&_svg]:size-5",
                          hasLiked ? "text-red-500" : "text-zinc-300",
                        )}>
                        <Heart className={cn(hasLiked && "fill-current")} />
                        <span className='font-bold tabular-nums'>
                          {recording.likes?.length || 0}
                        </span>
                      </Button>
                    </RecordingLikersTooltip>
                  </div>

                  {(recording.songTitle || recording.songArtist) && (
                    <div className='w-fit rounded-lg bg-cyan-950/30 px-3 py-1.5 text-sm font-medium text-cyan-400 sm:text-base'>
                      {recording.songArtist} - {recording.songTitle}
                    </div>
                  )}

                  <div className='flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-400'>
                    <UserLink
                      uid={recording.userId}
                      userName={recording.userDisplayName || "?"}
                      avatarUrl={recording.userAvatarUrl}
                      guildBadge={recording.userGuildBadge}
                      size='sm'
                      nameClassName='text-base text-zinc-200'
                    />
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      <span>{formatDate(recording.createdAt, intlLocale)}</span>
                    </div>
                  </div>

                  {recording.description && (
                    <p className='whitespace-pre-wrap text-base leading-relaxed text-zinc-300'>
                      {recording.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className='py-20 text-center text-base text-zinc-500'>
                  {t("viewer.not_found")}
                </div>
              )}
            </div>

            {/* Phone-only comments. */}
            <div className='flex flex-col bg-zinc-900/50 sm:hidden'>
              <div className='px-5 pb-4 pt-6'>{commentsHeading}</div>
              <div className='px-5 pb-6'>{commentList}</div>
              <div className='sticky bottom-0 bg-zinc-950 px-5 py-4'>{commentForm}</div>
            </div>
          </div>
        </div>

        {/* Right side: comments (desktop only). */}
        <div className='hidden w-96 flex-col bg-zinc-900/40 sm:flex lg:w-[28rem]'>
          <div className='px-6 pb-4 pt-6'>{commentsHeading}</div>
          <div className='custom-scrollbar flex-1 overflow-y-auto px-6 pb-6'>
            {commentList}
          </div>
          <div className='bg-zinc-900/60 px-6 py-5'>{commentForm}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
