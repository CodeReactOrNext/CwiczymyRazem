import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
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
import { SongPickerPanel } from "feature/songs/components/Playlists/SongPickerPanel";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ChevronUp, Music, Plus, Vote } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface VotingBoardProps {
  nominations: ChallengeNomination[];
  currentUserId: string | null;
  userName: string;
}

const RANK_TINTS: Record<number, string> = {
  0: "text-amber-300",
  1: "text-zinc-300",
  2: "text-orange-400/90",
};

interface NominationRowProps {
  nomination: ChallengeNomination;
  index: number;
  hasVoted: boolean;
  canVote: boolean;
  isQualifying: boolean;
  onToggleVote: () => void;
}

const NominationRow = ({
  nomination,
  index,
  hasVoted,
  canVote,
  isQualifying,
  onToggleVote,
}: NominationRowProps) => {
  const tier = getSongTier(
    (nomination.avgDifficulty ?? 0) === 0
      ? "?"
      : nomination.tier || nomination.avgDifficulty || "?",
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors sm:px-3",
        isQualifying ? "bg-amber-400/[0.06]" : "bg-white/[0.02]",
      )}>
      <span
        className={cn(
          "w-8 shrink-0 text-center text-2xl font-black tabular-nums leading-none sm:w-10",
          isQualifying
            ? (RANK_TINTS[index] ?? "text-amber-200/70")
            : "text-zinc-700",
        )}>
        {index + 1}
      </span>

      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800'>
        {nomination.coverUrl ? (
          <img
            src={nomination.coverUrl}
            alt=''
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-zinc-600'>
            <Music className='h-4 w-4' />
          </div>
        )}
      </div>

      <div className='min-w-0 flex-1'>
        <p translate='no' className='truncate text-sm font-semibold text-white'>
          {nomination.title}
        </p>
        <p translate='no' className='truncate text-xs text-zinc-500'>
          {nomination.artist}
          <span className='mx-1.5 text-zinc-700'>·</span>
          <UserTooltip userId={nomination.nominatedBy}>
            <Link
              href={`/user/${nomination.nominatedBy}`}
              className='hover:text-zinc-300'>
              put up by {nomination.nominatedByName}
            </Link>
          </UserTooltip>
        </p>
      </div>

      <span
        className='hidden shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold sm:inline'
        style={{ backgroundColor: `${tier.color}14`, color: tier.color }}>
        {tier.tier}
      </span>

      <button
        type='button'
        onClick={onToggleVote}
        disabled={!hasVoted && !canVote}
        aria-pressed={hasVoted}
        className={cn(
          "flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95",
          hasVoted
            ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
            : canVote
              ? "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              : "bg-white/[0.02] text-zinc-600",
        )}>
        <ChevronUp className={cn("h-4 w-4", hasVoted && "fill-current")} />
        <span className='tabular-nums'>{nomination.voteCount ?? 0}</span>
      </button>
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
  const [isNominateOpen, setIsNominateOpen] = useState(false);
  const { nominate, isNominating, toggleVote } = useChallengeMutations();

  const ballotId = votingChallengeId();
  const ranked = useMemo(() => rankNominations(nominations), [nominations]);
  const votesLeft = remainingVotes(nominations, currentUserId);
  const nominatedIds = useMemo(
    () => new Set(nominations.map((n) => n.songId)),
    [nominations],
  );

  const handleToggleVote = (nomination: ChallengeNomination) => {
    if (!currentUserId) return;
    const hasVoted = (nomination.voters ?? []).includes(currentUserId);
    if (!hasVoted && votesLeft === 0) {
      toast.error(`You've used all ${VOTES_PER_USER} votes this month.`);
      return;
    }
    toggleVote({ nomination, userId: currentUserId });
  };

  const handleNominate = async (song: Song) => {
    if (!currentUserId) return;
    if (votesLeft === 0 && !nominatedIds.has(song.id)) {
      toast.error(`You've used all ${VOTES_PER_USER} votes this month.`);
      return;
    }
    await nominate({ song, userId: currentUserId, userName });
    setIsNominateOpen(false);
  };

  return (
    <div className='space-y-7 p-4 sm:p-6 md:p-10'>
      <div className='max-w-2xl space-y-3'>
        <span className='flex items-center gap-1.5 text-xs font-bold text-amber-300'>
          <Vote className='h-3.5 w-3.5' />
          Ballot for {challengeMonthLabel(ballotId)}
        </span>
        <h2 className='text-2xl font-black tracking-tight text-white md:text-3xl'>
          Pick next month’s board
        </h2>
        <p className='text-sm font-medium leading-relaxed text-zinc-400'>
          You get{" "}
          <span className='font-bold text-white'>{VOTES_PER_USER} votes</span>{" "}
          per month. Put a song up or back one that’s already on the ballot —
          nominating spends a vote too. When the month turns, the top{" "}
          <span className='font-bold text-white'>{CHALLENGE_SONG_COUNT}</span>{" "}
          become the new challenge. Ties go to whoever proposed it first.
        </p>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <Button
            onClick={() => setIsNominateOpen(true)}
            disabled={!currentUserId || votesLeft === 0}
            className='h-10 px-5 font-bold'>
            <span className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Nominate a song
            </span>
          </Button>
          <span
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold",
              votesLeft > 0
                ? "bg-amber-400/10 text-amber-300"
                : "bg-white/5 text-zinc-500",
            )}>
            {currentUserId
              ? `${votesLeft} of ${VOTES_PER_USER} votes left`
              : "Sign in to vote"}
          </span>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
            <Vote size={26} />
          </div>
          <h3 className='mb-1 text-lg font-bold text-white'>
            The ballot is empty
          </h3>
          <p className='max-w-xs text-sm text-zinc-500'>
            Nothing has been put up for {challengeMonthLabel(ballotId)} yet.
            First nomination sets the tone.
          </p>
        </div>
      ) : (
        <div className='max-w-4xl space-y-1.5'>
          {ranked.map((nomination, index) => (
            <div key={nomination.id}>
              {index === CHALLENGE_SONG_COUNT && (
                <p className='px-3 pb-2 pt-6 text-[11px] font-bold text-zinc-600'>
                  below the cut — needs more votes to make the board
                </p>
              )}
              <NominationRow
                nomination={nomination}
                index={index}
                hasVoted={
                  !!currentUserId &&
                  (nomination.voters ?? []).includes(currentUserId)
                }
                canVote={!!currentUserId && votesLeft > 0}
                isQualifying={index < CHALLENGE_SONG_COUNT}
                onToggleVote={() => handleToggleVote(nomination)}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isNominateOpen} onOpenChange={setIsNominateOpen}>
        <DialogContent className='flex h-full max-w-none flex-col border-white/5 bg-zinc-950 p-6 sm:h-[560px] sm:max-w-lg sm:rounded-2xl'>
          <DialogHeader className='mb-2'>
            <DialogTitle className='font-openSans text-xl font-bold text-white'>
              Nominate a song
              <span className='ml-2 text-sm font-semibold text-zinc-500'>
                {votesLeft} {votesLeft === 1 ? "vote" : "votes"} left
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className='mb-2 rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-500'>
            Picking a song that’s already on the ballot just adds your vote to
            it.
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
