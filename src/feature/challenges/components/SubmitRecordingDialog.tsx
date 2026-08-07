import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import {
  FameIcon,
  PointsIcon,
} from "feature/challenges/components/RewardIcons";
import { useChallengeMutations } from "feature/challenges/hooks/useChallenges";
import type {
  Challenge,
  ChallengeSong,
} from "feature/challenges/types/challenge.types";
import {
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
} from "feature/challenges/types/challenge.types";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { selectUserAvatar } from "feature/user/store/userSlice";
import { Music, Video } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface SubmitRecordingDialogProps {
  challenge: Challenge;
  song: ChallengeSong | null;
  userId: string | null;
  userName: string;
  /** True when finishing this song clears the whole board. */
  isFinalSong: boolean;
  /** False on a closed board — the run lands, but earns nothing. */
  paysReward: boolean;
  onClose: () => void;
}

export const SubmitRecordingDialog = ({
  challenge,
  song,
  userId,
  userName,
  isFinalSong,
  paysReward,
  onClose,
}: SubmitRecordingDialogProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  // Denormalised onto the submission so the per-song player stack renders
  // faces without a lookup per author.
  const userAvatarUrl = useAppSelector(selectUserAvatar);
  const { submitRecording, isSubmitting } = useChallengeMutations();

  // Reset the draft whenever the dialog switches songs — same derived-state
  // during render pattern AddRecordingModal uses for its pre-filled song.
  const songId = song?.songId ?? null;
  if (songId !== lastSongId) {
    setLastSongId(songId);
    setVideoUrl("");
    setDescription("");
    setTitle(song ? `${song.artist} - ${song.title}` : "");
  }

  const videoId = extractVideoId(videoUrl.trim());
  const isValid = !!videoId && !!title.trim() && !!userId;

  const handleSubmit = async () => {
    if (!song || !userId || !isValid) return;
    try {
      await submitRecording({
        challenge,
        songId: song.songId,
        userId,
        userName,
        userAvatarUrl,
        videoUrl: videoUrl.trim(),
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch {
      // The mutation surfaces the failure as a toast; keep the draft open.
    }
  };

  return (
    <Dialog open={!!song} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-lg border-white/5 bg-zinc-950 p-6'>
        <DialogHeader className='mb-1'>
          <DialogTitle className='font-openSans text-xl font-bold text-white'>
            Submit your run
          </DialogTitle>
        </DialogHeader>

        {song && (
          <div className='flex items-center gap-3 rounded-xl bg-white/[0.03] p-3'>
            <div className='h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800'>
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt=''
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-zinc-600'>
                  <Music className='h-4 w-4' />
                </div>
              )}
            </div>
            <div className='min-w-0'>
              <p
                translate='no'
                className='truncate text-sm font-bold text-white'>
                {song.title}
              </p>
              <p translate='no' className='truncate text-xs text-zinc-500'>
                {song.artist}
              </p>
            </div>
          </div>
        )}

        <div className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <Label
              htmlFor='challenge-video'
              className='ml-1 font-bold text-zinc-400'>
              YouTube link
            </Label>
            <div className='relative'>
              <Video className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600' />
              <Input
                id='challenge-video'
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder='https://youtu.be/...'
                className='h-12 border-white/5 bg-white/5 pl-10 font-medium transition-all focus:border-cyan-500/50'
              />
            </div>
            {videoUrl.trim() && !videoId && (
              <p className='ml-1 text-xs font-semibold text-amber-400'>
                That doesn’t look like a YouTube link.
              </p>
            )}
          </div>

          {videoId && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt=''
              className='h-32 w-full rounded-xl object-cover'
            />
          )}

          <div className='space-y-2'>
            <Label
              htmlFor='challenge-title'
              className='ml-1 font-bold text-zinc-400'>
              Title
            </Label>
            <Input
              id='challenge-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className='h-12 border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50'
            />
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='challenge-note'
              className='ml-1 font-bold text-zinc-400'>
              Notes <span className='font-medium text-zinc-600'>optional</span>
            </Label>
            <Textarea
              id='challenge-note'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder='Gear, tempo, what you struggled with…'
              className='resize-none border-white/5 bg-white/5 font-medium transition-all focus:border-cyan-500/50'
            />
          </div>

          <div className='space-y-2 rounded-lg bg-white/[0.03] px-3 py-2.5'>
            {paysReward ? (
              <>
                <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-zinc-400'>
                  <span className='inline-flex items-center gap-1.5'>
                    <PointsIcon />
                    <span className='font-bold text-white'>
                      +{POINTS_PER_SUBMISSION}
                    </span>
                    points
                  </span>
                  <span className='inline-flex items-center gap-1.5'>
                    <FameIcon />
                    <span className='font-bold text-amber-300'>
                      +{FAME_PER_SUBMISSION}
                    </span>
                    fame
                  </span>
                  {isFinalSong && (
                    <span className='inline-flex items-center gap-1.5'>
                      <FameIcon />
                      <span className='font-bold text-amber-300'>
                        +{FAME_CLEAR_BONUS}
                      </span>
                      clear bonus
                    </span>
                  )}
                </div>
                <p className='text-xs font-medium text-zinc-500'>
                  {isFinalSong && "This is your last song on the board. "}Lands
                  in your Recordings too.
                </p>
              </>
            ) : (
              <p className='text-xs font-medium text-zinc-500'>
                This board is closed, so the run earns{" "}
                <span className='font-bold text-white'>no points or fame</span>{" "}
                — it just takes its place in the archive. Lands in your
                Recordings too.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className='pt-2'>
          <Button
            variant='ghost'
            onClick={onClose}
            className='text-zinc-400 hover:bg-white/5 hover:text-white'>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className='font-bold'>
            {isSubmitting ? (
              <span className='loading loading-spinner loading-sm' />
            ) : (
              "Submit run"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
