import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "assets/components/ui/alert-dialog";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { UserLink } from "components/UserLink";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import type { Recording } from "feature/recordings/types/types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Heart, MessageSquare, Play, Trash2 } from "lucide-react";
import { useAppSelector } from "store/hooks";

interface RecordingCardProps {
  recording: Recording;
  onView: (recordingId: string) => void;
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const RecordingCard = ({ recording, onView }: RecordingCardProps) => {
  const userId = useAppSelector(selectUserAuth);
  const { toggleLike, deleteRecording, isDeleting } = useRecordingMutations();

  const videoId = getYoutubeId(recording.videoUrl);
  const hasLiked = userId ? recording.likes.includes(userId) : false;
  const isOwner = userId === recording.userId;

  const handleLike = async () => {
    if (!userId) return;
    await toggleLike({ recordingId: recording.id, userId });
  };

  const handleDelete = async () => {
    if (!userId || !isOwner) return;
    await deleteRecording({ recordingId: recording.id, userId });
  };

  const formattedDate = new Date(
    (recording.createdAt as any)?.toDate
      ? (recording.createdAt as any).toDate()
      : recording.createdAt || new Date(),
  ).toLocaleDateString();

  const songLabel = [recording.songArtist, recording.songTitle]
    .filter(Boolean)
    .join(" - ");

  return (
    // Every text row below has a reserved height (title = 2 lines, song chip = 1 line,
    // description = 2 lines) so that cards with a short title or no description still
    // line their avatar row and footer up with their neighbours in the grid.
    <Card className='group/card flex h-full flex-col overflow-hidden bg-zinc-900/40 p-0 transition-colors hover:bg-zinc-900/60'>
      <button
        type='button'
        aria-label={`Play ${recording.title}`}
        onClick={() => onView(recording.id)}
        className='group/thumb relative block aspect-video w-full overflow-hidden bg-black'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage: videoId
              ? `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`
              : undefined,
          }}
        />
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover/thumb:bg-black/25'>
          <span className='rounded-full bg-white/15 p-3.5 backdrop-blur-sm transition-colors group-hover/thumb:bg-white/25'>
            <Play className='h-6 w-6 fill-current text-white' />
          </span>
        </div>
      </button>

      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex items-start justify-between gap-2'>
          <h3
            onClick={() => onView(recording.id)}
            className='line-clamp-2 min-h-[2.75rem] cursor-pointer text-base font-bold leading-snug text-zinc-100 transition-colors hover:text-cyan-400'>
            {recording.title}
          </h3>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Delete recording'
                  className='-mr-2 -mt-1 h-8 w-8 shrink-0 text-zinc-500 opacity-100 transition-opacity focus-visible:opacity-100 hover:bg-red-500/10 hover:text-red-400 md:opacity-0 md:group-hover/card:opacity-100'>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className='bg-zinc-950 text-white'>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className='text-zinc-400'>
                    This action cannot be undone. This will permanently delete
                    your recording.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className='bg-zinc-900 text-white hover:bg-zinc-800'>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className='border-none bg-red-600 text-white hover:bg-red-700'>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className='min-h-[28px]'>
          {songLabel && (
            <Chip
              color='cyan'
              title={songLabel}
              className='block max-w-full truncate px-2 py-1 text-[11px] leading-4'>
              {songLabel}
            </Chip>
          )}
        </div>

        <p className='line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-zinc-400'>
          {recording.description}
        </p>

        <div className='mt-auto flex items-center gap-2 pt-1'>
          <UserLink
            uid={recording.userId}
            userName={recording.userDisplayName || "?"}
            avatarUrl={recording.userAvatarUrl}
            lvl={recording.userAvatarFrame}
            size='xs'
            nameClassName='text-xs font-medium text-zinc-300'
          />
          <span className='shrink-0 text-xs font-medium text-zinc-500'>
            • {formattedDate}
          </span>
        </div>
      </div>

      <div className='flex items-center gap-1 bg-zinc-800/30 px-2 py-1.5'>
        <Button
          variant='ghost'
          size='sm'
          aria-label='Like recording'
          className={cn(
            "text-zinc-400 hover:bg-zinc-800/60 hover:text-red-400",
            hasLiked && "text-red-400 hover:text-red-300",
          )}
          onClick={handleLike}>
          <Heart className={cn("mr-1.5 h-4 w-4", hasLiked && "fill-current")} />
          <span className='text-xs font-bold'>{recording.likes.length}</span>
        </Button>

        <Button
          variant='ghost'
          size='sm'
          aria-label='View comments'
          className='text-zinc-400 hover:bg-zinc-800/60 hover:text-cyan-400'
          onClick={() => onView(recording.id)}>
          <MessageSquare className='mr-1.5 h-4 w-4' />
          <span className='text-xs font-bold'>{recording.commentCount}</span>
        </Button>
      </div>
    </Card>
  );
};
