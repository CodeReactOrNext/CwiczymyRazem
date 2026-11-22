import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { TierPick } from "feature/songs/components/SongsGrid/TierBadge";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { useSong } from "feature/songs/hooks/useSong";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { ChevronUp, ExternalLink, Music } from "lucide-react";
import Link from "next/link";

/** The song snapshot both the board and the ballot carry inline. */
export interface PreviewSong {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
}

interface SongPreviewDialogProps {
  song: PreviewSong | null;
  onClose: () => void;
  /**
   * Ballot only: backing a song is the decision the preview exists to inform,
   * so the vote lives here too — no need to close and hunt for the row again.
   */
  vote?: {
    count: number;
    hasVoted: boolean;
    canVote: boolean;
    onToggle: () => void;
  };
}

const youtubeSearchUrl = (song: PreviewSong) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${song.artist} ${song.title}`,
  )}`;

/**
 * A listen-before-you-decide card: the song's Spotify track pulled in on
 * demand, plus the way through to its page on the song board. Nominations only
 * store a snapshot, so the full doc — and with it `spotifyId` — is fetched when
 * the dialog opens.
 */
export const SongPreviewDialog = ({
  song,
  onClose,
  vote,
}: SongPreviewDialogProps) => {
  const { t } = useTranslation("challenges");
  const { data: fullSong, isLoading } = useSong(song?.songId);

  const tier = getSongTier(
    (song?.avgDifficulty ?? 0) === 0
      ? "?"
      : song?.tier || song?.avgDifficulty || "?",
  );

  return (
    <Dialog open={!!song} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='bg-zinc-950 sm:max-w-md'>
        {song && (
          /* min-w-0: the dialog is a grid, so without it this column takes
             its min-content width from the button row and grows past
             sm:max-w-md — long titles then truncate under the close button. */
          <div className='min-w-0 space-y-6'>
            <DialogHeader className='flex-row items-center gap-4 space-y-0 pr-10 text-left'>
              <span className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800'>
                {song.coverUrl ? (
                  <img
                    src={song.coverUrl}
                    alt=''
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <Music className='h-5 w-5 text-zinc-600' />
                )}
              </span>

              <div className='min-w-0 flex-1'>
                <DialogTitle
                  translate='no'
                  className='line-clamp-2 break-words text-lg font-bold leading-snug text-white'>
                  {song.title}
                </DialogTitle>
                <p
                  translate='no'
                  className='mt-1 truncate text-sm font-medium text-zinc-500'>
                  {song.artist}
                </p>
                <TierPick tier={tier} className='mt-2 h-6 w-6' />
              </div>
            </DialogHeader>

            {isLoading ? (
              <Skeleton variant='block' className='h-20' />
            ) : fullSong?.spotifyId ? (
              <SpotifyPlayer trackId={fullSong.spotifyId} height={80} />
            ) : (
              <a
                href={youtubeSearchUrl(song)}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200'>
                <ExternalLink className='h-4 w-4 shrink-0' />
                {t("preview.no_spotify")}
              </a>
            )}

            <div className='flex items-center gap-3'>
              {vote && (
                <Button
                  onClick={vote.onToggle}
                  disabled={!vote.hasVoted && !vote.canVote}
                  aria-pressed={vote.hasVoted}
                  size='lg'
                  className={cn(
                    "flex-1",
                    vote.hasVoted
                      ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                      : "",
                  )}>
                  <ChevronUp
                    className={vote.hasVoted ? "fill-current" : undefined}
                  />
                  {vote.hasVoted ? t("preview.backed") : t("preview.back")}
                  <span className='tabular-nums opacity-60'>
                    {vote.count}
                  </span>
                </Button>
              )}

              <Link
                href={`/songs?view=explore&songId=${song.songId}`}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg bg-white/5 px-4 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white",
                  !vote && "flex-1",
                )}>
                {t("preview.open_board")}
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
