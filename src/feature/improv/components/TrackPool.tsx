import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { TrackPlayer } from "feature/improv/components/TrackPlayer";
import {
  useRemoveImprovTrack,
  useToggleImprovVote,
} from "feature/improv/hooks/useImprov";
import type { ImprovTrack } from "feature/improv/types/improv.types";
import { IMPROV_ROUND_DAYS } from "feature/improv/types/improv.types";
import { placeKeyClass } from "feature/leadboard/components/rankRowStyles";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ChevronUp, Music2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TrackPoolProps {
  pool: ImprovTrack[];
  uid: string | null;
  isAdmin: boolean;
  nextRoundStartsAt: number;
  onUpload: () => void;
}

const PoolRow = ({
  track,
  rank,
  uid,
  isAdmin,
}: {
  track: ImprovTrack;
  rank: number;
  uid: string | null;
  isAdmin: boolean;
}) => {
  const { t } = useTranslation("improv");
  const vote = useToggleImprovVote();
  const remove = useRemoveImprovTrack();
  const canRemove = isAdmin || track.uploadedById === uid;

  return (
    <li className='flex flex-wrap items-center gap-4 rounded-lg bg-zinc-800/40 p-4'>
      {/* The gold key on top says it leads: that track becomes the round. */}
      <span
        translate='no'
        title={rank === 1 ? t("next.leading") : undefined}
        className={cn("h-7 w-8 text-xl", placeKeyClass(rank, false))}>
        {rank}
        {rank === 1 && <span className='sr-only'>{t("next.leading")}</span>}
      </span>
      <TrackPlayer
        variant='thumb'
        youtubeId={track.youtubeId}
        title={track.title}
      />

      <div className='min-w-0 flex-1 basis-48'>
        <p className='truncate text-base font-semibold text-zinc-100'>
          {track.title}
        </p>
        {track.channel && (
          <p className='mt-0.5 truncate text-sm text-zinc-400'>
            {track.channel}
          </p>
        )}
        <p className='mt-0.5 text-xs text-zinc-500'>
          {t("next.by", { name: track.uploadedByName })}
        </p>
      </div>

      <div className='ml-auto flex items-center gap-2'>
        {canRemove && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            loading={remove.isPending}
            aria-label={t("next.remove")}
            title={t("next.remove")}
            onClick={() =>
              remove.mutate(track.id, {
                onError: () => toast.error(t("submit.error")),
              })
            }>
            {!remove.isPending && <Trash2 />}
          </Button>
        )}
        <Button
          type='button'
          variant='ghost'
          aria-pressed={track.hasMyVote}
          disabled={vote.isPending}
          onClick={() =>
            vote.mutate(track.id, {
              onError: () => toast.error(t("submit.error")),
            })
          }
          className={cn(
            "min-w-[5.5rem]",
            track.hasMyVote &&
              "bg-amber-400/15 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200",
          )}>
          <ChevronUp />
          <span className='tabular-nums'>{track.voteCount}</span>
          <span className='sr-only'>
            {track.hasMyVote ? t("next.voted") : t("next.vote")}
          </span>
        </Button>
      </div>
    </li>
  );
};

/**
 * The pool the next round is drawn from. Anyone uploads, everyone votes, and
 * at the changeover the track on top becomes the round — so the list is shown
 * in exactly that order, with the leader marked.
 */
export const TrackPool = ({
  pool,
  uid,
  isAdmin,
  nextRoundStartsAt,
  onUpload,
}: TrackPoolProps) => {
  const { t } = useTranslation("improv");
  const intlLocale = useIntlLocale();
  const changeover = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(nextRoundStartsAt);

  return (
    <div className='flex flex-col gap-6'>
      <Card className='flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6'>
        <div className='min-w-0 max-w-2xl'>
          <h2 className='text-base font-semibold text-zinc-100'>
            {t("next.title", { date: changeover })}
          </h2>
          <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
            {t("next.body", { days: IMPROV_ROUND_DAYS })}
          </p>
        </div>
        <Button onClick={onUpload} size='lg' className='shrink-0'>
          <Plus />
          {t("next.upload")}
        </Button>
      </Card>

      {pool.length === 0 ? (
        <EmptyState
          icon={<Music2 />}
          title={t("next.empty_title")}
          description={t("next.empty_body")}
        />
      ) : (
        <ol className='flex flex-col gap-3'>
          {pool.map((track, index) => (
            <PoolRow
              key={track.id}
              track={track}
              rank={index + 1}
              uid={uid}
              isAdmin={isAdmin}
            />
          ))}
        </ol>
      )}
    </div>
  );
};
