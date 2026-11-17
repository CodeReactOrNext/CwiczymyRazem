import { Button } from "assets/components/ui/button";
import { ImprovFace } from "feature/improv/components/ImprovFaces";
import { improvArtSrc } from "feature/improv/components/TrackPlayer";
import { useRemoveImprovTake } from "feature/improv/hooks/useImprov";
import type { ImprovTake } from "feature/improv/types/improv.types";
import {
  IMPROV_PROVIDER_LABEL,
  takeThumbnail,
} from "feature/improv/utils/improvLink";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ArrowUpRight, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa6";
import { toast } from "sonner";

interface TakeCardProps {
  take: ImprovTake;
  uid: string | null;
  canModerate: boolean;
}

/**
 * One take. The picture is a door, not a player: it opens the video where it
 * lives, and the Discord link opens the bot's message about it, where the
 * feedback is.
 */
export const TakeCard = ({ take, uid, canModerate }: TakeCardProps) => {
  const { t } = useTranslation("improv");
  const intlLocale = useIntlLocale();
  const remove = useRemoveImprovTake();
  const thumbnail = takeThumbnail(take.url);
  const provider = IMPROV_PROVIDER_LABEL[take.provider];
  const canRemove = canModerate || take.userId === uid;

  const postedAt = new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(take.createdAt);

  return (
    <article className='flex flex-col overflow-hidden rounded-lg bg-zinc-800/40'>
      <a
        href={take.url}
        target='_blank'
        rel='noreferrer'
        aria-label={t("take.watch", { name: take.userName, provider })}
        className='group force-dark relative block aspect-video overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400'>
        <img
          src={thumbnail ?? improvArtSrc(take.id)}
          alt=''
          loading='lazy'
          className='h-full w-full object-cover opacity-80 transition-opacity duration-fast group-hover:opacity-100'
        />
        <span className='absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white'>
          {t("take.number", { number: take.takeNumber })}
        </span>
        <span className='absolute inset-0 flex items-center justify-center'>
          <span className='flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white'>
            <Play className='h-5 w-5 translate-x-px' />
          </span>
        </span>
        <span className='absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-medium text-zinc-200'>
          {provider}
          <ArrowUpRight className='h-3 w-3' />
        </span>
      </a>

      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex items-center gap-3'>
          <ImprovFace name={take.userName} avatar={take.userAvatar} />
          <div className='min-w-0 flex-1'>
            <Link
              href={`/user/${take.userId}`}
              className='block truncate text-sm font-semibold text-zinc-100 hover:text-white'>
              {take.userName}
            </Link>
            <p className='text-xs text-zinc-400'>{postedAt}</p>
          </div>
          {canRemove && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              loading={remove.isPending}
              aria-label={t("take.remove")}
              title={t("take.remove")}
              onClick={() =>
                remove.mutate(take.id, {
                  onSuccess: () => toast.success(t("take.removed")),
                  onError: () => toast.error(t("submit.error")),
                })
              }>
              {!remove.isPending && <Trash2 />}
            </Button>
          )}
        </div>

        {take.note && (
          <p className='text-sm leading-relaxed text-zinc-300'>“{take.note}”</p>
        )}

        {take.discordUrl && (
          <a
            href={take.discordUrl}
            target='_blank'
            rel='noreferrer'
            className='mt-auto inline-flex items-center gap-2 self-start text-sm font-semibold text-indigo-300 transition-colors duration-fast hover:text-indigo-200'>
            <FaDiscord size={16} />
            {t("take.feedback")}
          </a>
        )}
      </div>
    </article>
  );
};

interface TakeGridProps {
  takes: ImprovTake[];
  uid: string | null;
  canModerate: boolean;
}

export const TakeGrid = ({ takes, uid, canModerate }: TakeGridProps) => (
  <div className='grid gap-4 sm:grid-cols-2'>
    {takes.map((take) => (
      <TakeCard key={take.id} take={take} uid={uid} canModerate={canModerate} />
    ))}
  </div>
);
