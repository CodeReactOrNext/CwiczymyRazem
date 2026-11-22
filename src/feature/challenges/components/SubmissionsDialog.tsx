import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import Avatar from "components/UI/Avatar";
import type {
  ChallengeSong,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("challenges");
  const [openRecordingId, setOpenRecordingId] = useState<string | null>(null);

  return (
    <>
      <Dialog open={!!song} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='flex flex-col bg-zinc-950 sm:max-w-2xl'>
          <DialogHeader className='mb-1'>
            <DialogTitle className='text-xl font-bold text-white'>
              {song?.title}
            </DialogTitle>
            <p className='text-sm font-medium text-zinc-500'>
              {submissions.length === 0
                ? t("runs.nobody")
                : t(submissions.length === 1 ? "runs.count_one" : "runs.count", {
                    count: submissions.length,
                    artist: song?.artist,
                  })}
            </p>
          </DialogHeader>

          <div className='-mx-2 max-h-[70vh] min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pt-2'>
            {submissions.map((submission) => {
              const thumb = submissionThumb(submission);
              const isMine = submission.userId === currentUserId;

              return (
                <button
                  key={submission.id}
                  type='button'
                  onClick={() => setOpenRecordingId(submission.recordingId)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors",
                    isMine
                      ? "bg-cyan-500/10 hover:bg-cyan-500/15"
                      : "bg-zinc-800/40 hover:bg-zinc-800/60",
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
                    <span className='force-dark absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100'>
                      <Play className='h-5 w-5 fill-current' />
                    </span>
                  </span>

                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-bold text-white'>
                      {submission.title}
                    </span>
                    <span className='mt-1 flex items-center gap-2 text-xs font-medium text-zinc-500'>
                      <Avatar
                        size='2xs'
                        name={submission.userName || "?"}
                        avatarURL={submission.userAvatarUrl || undefined}
                      />
                      {submission.userName}
                      {isMine && (
                        <span className='font-bold text-cyan-300'>{t("runs.you")}</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}

            {submissions.length > 0 && (
              <p className='px-1 pt-2 text-[11px] font-medium text-zinc-500'>
                {t("runs.tap_hint")}
              </p>
            )}

            {submissions.length === 0 && (
              <EmptyState
                size='compact'
                icon={<Music />}
                title={t("runs.empty")}
              />
            )}
          </div>

          {song && (
            <Link
              href={`/songs?view=explore&songId=${song.songId}`}
              className='mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300'>
              {t("runs.open_song", { title: song.title })}
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
