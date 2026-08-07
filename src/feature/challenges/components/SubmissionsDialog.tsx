import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type {
  ChallengeSong,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { Music, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SubmissionsDialogProps {
  song: ChallengeSong | null;
  submissions: ChallengeSubmission[];
  currentUserId: string | null;
  onClose: () => void;
}

const submissionThumb = (submission: ChallengeSubmission) => {
  const videoId = extractVideoId(submission.videoUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

/** Every recording players put on one song of the board. */
export const SubmissionsDialog = ({
  song,
  submissions,
  currentUserId,
  onClose,
}: SubmissionsDialogProps) => {
  const [openRecordingId, setOpenRecordingId] = useState<string | null>(null);

  return (
    <>
      <Dialog open={!!song} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='flex h-full max-w-none flex-col border-white/5 bg-zinc-950 p-6 sm:h-[620px] sm:max-w-2xl sm:rounded-2xl'>
          <DialogHeader className='mb-1'>
            <DialogTitle className='font-openSans text-xl font-bold text-white'>
              {song?.title}
            </DialogTitle>
            <p className='text-sm font-medium text-zinc-500'>
              {submissions.length === 0
                ? "Nobody has taken this one on yet — be first."
                : `${submissions.length} ${
                    submissions.length === 1 ? "run" : "runs"
                  } on ${song?.artist}`}
            </p>
          </DialogHeader>

          <div className='-mx-2 min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pt-2'>
            {submissions.map((submission) => {
              const thumb = submissionThumb(submission);
              const isMine = submission.userId === currentUserId;

              return (
                <button
                  key={submission.id}
                  type='button'
                  onClick={() => setOpenRecordingId(submission.recordingId)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors",
                    isMine
                      ? "bg-cyan-500/10 hover:bg-cyan-500/15"
                      : "bg-white/[0.03] hover:bg-white/[0.07]",
                  )}>
                  <span className='relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-900'>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=''
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <Music className='h-4 w-4 text-zinc-600' />
                    )}
                    <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100'>
                      <Play className='h-5 w-5 fill-current' />
                    </span>
                  </span>

                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-bold text-white'>
                      {submission.title}
                    </span>
                    <span className='mt-1 flex items-center gap-2 text-xs font-medium text-zinc-500'>
                      {submission.userAvatarUrl ? (
                        <img
                          src={submission.userAvatarUrl}
                          alt=''
                          className='h-5 w-5 rounded-full object-cover'
                        />
                      ) : (
                        <span className='flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-300'>
                          {(submission.userName || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                      {submission.userName}
                      {isMine && (
                        <span className='font-bold text-cyan-300'>you</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}

            {submissions.length > 0 && (
              <p className='px-1 pt-2 text-[11px] font-medium text-zinc-600'>
                Tap a run to watch it, leave a comment or drop a like.
              </p>
            )}

            {submissions.length === 0 && (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
                  <Music size={26} />
                </div>
                <p className='max-w-xs text-sm text-zinc-500'>
                  No runs yet. Record it, post the link, and take the first
                  slot.
                </p>
              </div>
            )}
          </div>

          {song && (
            <Link
              href={`/songs?view=explore&songId=${song.songId}`}
              className='mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300'>
              Open “{song.title}” in the song board
            </Link>
          )}
        </DialogContent>
      </Dialog>

      <RecordingViewModal
        isOpen={!!openRecordingId}
        onClose={() => setOpenRecordingId(null)}
        recordingId={openRecordingId}
      />
    </>
  );
};
