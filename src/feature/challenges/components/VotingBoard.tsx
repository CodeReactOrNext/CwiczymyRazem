import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { SongPreviewDialog } from "feature/challenges/components/SongPreviewDialog";
import { useChallengeMutations } from "feature/challenges/hooks/useChallenges";
import type { ChallengeNomination } from "feature/challenges/types/challenge.types";
import {
  CHALLENGE_SONG_COUNT,
  VOTES_PER_USER,
} from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  votingChallengeId,
} from "feature/challenges/utils/challengeMonth";
import {
  rankNominations,
  remainingVotes,
} from "feature/challenges/utils/challengeProgress";
import { placeKeyClass } from "feature/leadboard/components/rankRowStyles";
import { SongPickerPanel } from "feature/songs/components/Playlists/SongPickerPanel";
import {
  SONG_ARTIST_SM_CLASS,
  SONG_TITLE_SM_CLASS,
  SongThumb,
} from "feature/songs/components/SongRow/SongRow";
import { TierPick } from "feature/songs/components/SongsGrid/TierBadge";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import { ChevronUp, Play, Plus, Vote } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface VotingBoardProps {
  nominations: ChallengeNomination[];
  currentUserId: string | null;
  userName: string;
}

interface NominationRowProps {
  nomination: ChallengeNomination;
  index: number;
  hasVoted: boolean;
  canVote: boolean;
  isQualifying: boolean;
  onToggleVote: () => void;
  onPreview: () => void;
}

const NominationRow = ({
  nomination,
  index,
  hasVoted,
  canVote,
  isQualifying,
  onToggleVote,
  onPreview,
}: NominationRowProps) => {
  const { t } = useTranslation("challenges");
  const tier = getSongTier(
    (nomination.avgDifficulty ?? 0) === 0
      ? "?"
      : nomination.tier || nomination.avgDifficulty || "?",
  );

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors sm:px-3",
        isQualifying
          ? "bg-amber-400/[0.06] hover:bg-amber-400/[0.12]"
          : "bg-zinc-800/40 hover:bg-zinc-800/60",
      )}>
      {/* Whole row opens the song so you can hear it before spending a vote.
          Everything already interactive sits above it on the z-axis. */}
      <button
        type='button'
        onClick={onPreview}
        className='absolute inset-0 rounded-lg'>
        <span className='sr-only'>
          {t("board.listen", { title: nomination.title, artist: nomination.artist })}
        </span>
      </button>

      {/* Places that make next month's board wear the ranking key; the ones
          below the cut keep the key but fade. */}
      <span
        translate='no'
        className={cn(
          "h-7 w-8 text-xl",
          isQualifying
            ? placeKeyClass(index + 1, false)
            : cn(placeKeyClass(index + 1, false, false), "text-zinc-600"),
        )}>
        {index + 1}
      </span>

      <SongThumb
        coverUrl={nomination.coverUrl}
        size='sm'
        className='pointer-events-none'>
        <span className='force-dark absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100'>
          <Play className='h-4 w-4 fill-current' />
        </span>
      </SongThumb>

      <div className='min-w-0 flex-1'>
        <p translate='no' className={SONG_TITLE_SM_CLASS}>
          {nomination.title}
        </p>
        <p translate='no' className={SONG_ARTIST_SM_CLASS}>
          {nomination.artist}
          <span className='mx-1.5 text-zinc-700'>·</span>
          <UserTooltip userId={nomination.nominatedBy}>
            <Link
              href={`/user/${nomination.nominatedBy}`}
              className='relative z-10 hover:text-zinc-300'>
              {t("ballot.put_up_by", { name: nomination.nominatedByName })}
            </Link>
          </UserTooltip>
        </p>
      </div>

      <TierPick tier={tier} className='hidden h-5 w-5 sm:block' />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            onClick={onToggleVote}
            disabled={!hasVoted && !canVote}
            aria-pressed={hasVoted}
            className={cn(
              "relative z-10 flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95",
              hasVoted
                ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                : canVote
                  ? "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "bg-white/[0.02] text-zinc-600",
            )}>
            <ChevronUp className={cn("h-4 w-4", hasVoted && "fill-current")} />
            <span className='tabular-nums'>{nomination.voteCount ?? 0}</span>
          </button>
        </TooltipTrigger>
        {(nomination.voters?.length ?? 0) > 0 && (
          <TooltipContent
            side='left'
            className='max-w-xs p-3'>
            <div className='space-y-1'>
              <p className='mb-1 text-xs font-semibold text-black/60'>
                {t("ballot.voted_by")}
              </p>
              {nomination.voters?.map((voter) => (
                <UserTooltip key={voter.id} userId={voter.id}>
                  <div className='cursor-pointer text-[11px] text-black/70 hover:text-black'>
                    {voter.name}
                  </div>
                </UserTooltip>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};

/**
 * The ballot for next month's board. Every player gets a fixed number of votes
 * per cycle, and nominating a song spends one of them — so putting a song up
 * costs exactly as much as backing someone else's pick, and nobody can flood
 * the ballot for free.
 */
export const VotingBoard = ({
  nominations,
  currentUserId,
  userName,
}: VotingBoardProps) => {
  const { t } = useTranslation("challenges");
  const intlLocale = useIntlLocale();
  const [isNominateOpen, setIsNominateOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { nominate, isNominating, toggleVote } = useChallengeMutations();

  const ballotId = votingChallengeId();
  const ranked = useMemo(() => rankNominations(nominations), [nominations]);
  const votesLeft = remainingVotes(nominations, currentUserId);
  const nominatedIds = useMemo(
    () => new Set(nominations.map((n) => n.songId)),
    [nominations],
  );

  // Tracked by id, not by value, so the preview's vote button keeps up with the
  // refetch that follows a vote.
  const preview = nominations.find((n) => n.id === previewId) ?? null;
  const previewHasVoted =
    !!currentUserId &&
    (preview?.voters ?? []).some((v) => v.id === currentUserId);

  const handleToggleVote = (nomination: ChallengeNomination) => {
    if (!currentUserId) return;
    const hasVoted = (nomination.voters ?? []).some(
      (v) => v.id === currentUserId,
    );
    if (!hasVoted && votesLeft === 0) {
      toast.error(t("ballot.out_of_votes", { count: VOTES_PER_USER }));
      return;
    }
    toggleVote({ nomination, userId: currentUserId, userName });
  };

  const handleNominate = async (song: Song) => {
    if (!currentUserId) return;
    if (votesLeft === 0 && !nominatedIds.has(song.id)) {
      toast.error(t("ballot.out_of_votes", { count: VOTES_PER_USER }));
      return;
    }
    await nominate({ song, userId: currentUserId, userName });
    setIsNominateOpen(false);
  };

  return (
    <div className='space-y-7'>
      {/* The ballot's month and what it decides are on the page banner — this
          is the part a voter still needs in front of the list: the rules. */}
      <div className='max-w-2xl space-y-3'>
        <p className='text-sm font-medium leading-relaxed text-zinc-400'>
          <Interpolate
            text={t("ballot.rules")}
            values={{
              votes: <span className='font-bold text-white'>{t("ballot.votes_count", { count: VOTES_PER_USER })}</span>,
              top: <span className='font-bold text-white'>{CHALLENGE_SONG_COUNT}</span>,
            }}
          />
        </p>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <Button
            onClick={() => setIsNominateOpen(true)}
            disabled={!currentUserId || votesLeft === 0}
            size='lg'>
            <Plus />
            {t("ballot.nominate")}
          </Button>
          <span
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold",
              votesLeft > 0
                ? "bg-amber-400/10 text-amber-300"
                : "bg-white/5 text-zinc-500",
            )}>
            {currentUserId
              ? t("ballot.votes_left_of", { left: votesLeft, total: VOTES_PER_USER })
              : t("ballot.sign_in")}
          </span>
        </div>
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          icon={<Vote />}
          title={t("ballot.empty_title")}
          description={t("ballot.empty_body", {
            month: challengeMonthLabel(ballotId, intlLocale),
          })}
        />
      ) : (
        <div className='space-y-1.5'>
          {ranked.map((nomination, index) => (
            <div key={nomination.id}>
              {index === CHALLENGE_SONG_COUNT && (
                <p className='px-3 pb-2 pt-6 text-xs font-medium text-zinc-400'>
                  {t("ballot.below_cut")}
                </p>
              )}
              <NominationRow
                nomination={nomination}
                index={index}
                hasVoted={
                  !!currentUserId &&
                  (nomination.voters ?? []).some((v) => v.id === currentUserId)
                }
                canVote={!!currentUserId && votesLeft > 0}
                isQualifying={index < CHALLENGE_SONG_COUNT}
                onToggleVote={() => handleToggleVote(nomination)}
                onPreview={() => setPreviewId(nomination.id)}
              />
            </div>
          ))}
        </div>
      )}

      <SongPreviewDialog
        song={preview}
        onClose={() => setPreviewId(null)}
        vote={
          preview
            ? {
                count: preview.voteCount ?? 0,
                hasVoted: previewHasVoted,
                canVote: !!currentUserId && votesLeft > 0,
                onToggle: () => handleToggleVote(preview),
              }
            : undefined
        }
      />

      <Dialog open={isNominateOpen} onOpenChange={setIsNominateOpen}>
        <DialogContent className='flex h-full flex-col bg-zinc-950 sm:h-[560px]'>
          <DialogHeader className='mb-2'>
            <DialogTitle className='text-xl font-bold text-white'>
              {t("ballot.nominate")}
              <span className='ml-2 text-sm font-semibold text-zinc-500'>
                {votesLeft === 1 ? t("ballot.vote_left", { count: votesLeft }) : t("ballot.votes_left", { count: votesLeft })}
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className='mb-2 rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500'>
            {t("ballot.pick_existing")}
          </p>
          <SongPickerPanel
            existingIds={new Set<string>()}
            onAdd={handleNominate}
            collectionSongs={[]}
            canAdd={!isNominating && votesLeft > 0}
            className='min-h-0 flex-1'
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
