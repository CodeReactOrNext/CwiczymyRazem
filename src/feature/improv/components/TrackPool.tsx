import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { TrackPlayer } from "feature/improv/components/TrackPlayer";
import {
  useRemoveImprovTrack,
  useToggleImprovVote,
} from "feature/improv/hooks/useImprov";
import type { ImprovTrack } from "feature/improv/types/improv.types";
import { IMPROV_ROUND_DAYS } from "feature/improv/types/improv.types";
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
      <span className='w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-zinc-500'>
        {String(rank).padStart(2, "0")}
      </span>
      <TrackPlayer
        variant='thumb'
        youtubeId={track.youtubeId}
        title={track.title}
      />

      <div className='min-w-0 flex-1 basis-48'>
        <p className='flex flex-wrap items-center gap-2'>
          <span className='truncate text-base font-semibold text-zinc-100'>
            {track.title}
          </span>
          {rank === 1 && <Chip color='amber'>{t("next.leading")}</Chip>}
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
            "h-10 min-w-[5.5rem] px-4",
            track.hasMyVote &&
              "bg-amber-400/15 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200",
          )}>
          <span className='flex items-center gap-2'>
            <ChevronUp />
            <span className='tabular-nums'>{track.voteCount}</span>
            <span className='sr-only'>
              {track.hasMyVote ? t("next.voted") : t("next.vote")}
            </span>
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
        <Button onClick={onUpload} className='h-11 shrink-0 px-5'>
          <span className='flex items-center gap-2'>
            <Plus />
            {t("next.upload")}
          </span>
        </Button>
      </Card>

      {pool.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
            <Music2 size={26} />
          </div>
          <h3 className='mb-1 text-lg font-bold text-zinc-100'>
            {t("next.empty_title")}
          </h3>
          <p className='max-w-sm text-sm text-zinc-400'>
            {t("next.empty_body")}
          </p>
        </div>
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
