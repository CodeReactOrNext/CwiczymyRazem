import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Play, X } from "lucide-react";
import type { SyntheticEvent } from "react";

export interface ChangelogVideo {
  id: string;
  /** Shorts are 9:16, every other YouTube link is a regular 16:9 video. */
  vertical: boolean;
}

// Shorts have a portrait cover at `oardefault`; regular videos only have a 4:3
// cover with letterbox bars, which `object-cover` crops back to the frame.
const getCoverUrl = (id: string, vertical: boolean) =>
  `https://i.ytimg.com/vi/${id}/${vertical ? "oardefault" : "hqdefault"}.jpg`;

// Not every Short has a portrait cover yet; the 4:3 one still crops to 9:16,
// because YouTube centers the vertical frame inside it.
const fallBackToLandscapeCover =
  (id: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    const fallback = getCoverUrl(id, false);
    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
    }
  };

interface ChangelogVideoCardProps {
  video: ChangelogVideo;
  /** What the video shows, e.g. "Backing Band". Only screen readers hear it. */
  title: string;
  /** The cover's width; its height follows from the video's ratio. */
  className?: string;
}

/**
 * A video cover in the changelog that opens the player in a dialog. The
 * YouTube player only loads on click, so a month of entries costs a few
 * images instead of a few players.
 */
export const ChangelogVideoCard = ({
  video,
  title,
  className,
}: ChangelogVideoCardProps) => {
  const { t } = useTranslation("ui");
  const coverUrl = getCoverUrl(video.id, video.vertical);
  const onCoverError = fallBackToLandscapeCover(video.id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type='button'
          aria-label={t("changelog.play_video", { title })}
          className={cn(
            "group relative block overflow-hidden rounded-lg bg-zinc-900/60 click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
            video.vertical ? "aspect-[9/16]" : "aspect-video",
            className,
          )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=''
            loading='lazy'
            onError={onCoverError}
            className='h-full w-full object-cover'
          />
          <span
            aria-hidden
            className='absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-fast group-hover:bg-black/30'>
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors duration-fast group-hover:bg-black/80'>
              <Play className='ml-0.5 h-5 w-5 fill-current' />
            </span>
          </span>
        </button>
      </DialogTrigger>

      {/* Nothing but the video: no frame, no caption. The close button floats
          above its corner, clear of the player's own controls. */}
      <DialogContent
        hideCloseButton
        aria-describedby={undefined}
        className='left-[50%] top-[50%] block h-auto w-auto translate-x-[-50%] translate-y-[-50%] overflow-visible rounded-lg border-none bg-transparent p-0 shadow-none sm:p-0 short:p-0 sm:short:overflow-visible'>
        <DialogTitle className='sr-only'>{title}</DialogTitle>
        {/* Sized by width so the frame keeps its ratio on any screen: it fits
            the viewport width, and its height leaves room for the close button. */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-black",
            video.vertical
              ? "aspect-[9/16] w-[min(100vw_-_2rem,(100dvh_-_7rem)*0.5625,32rem)]"
              : "aspect-video w-[min(100vw_-_2rem,(100dvh_-_7rem)*1.7778,80rem)]",
          )}>
          {/* The cover shows through until the player has painted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=''
            aria-hidden
            onError={onCoverError}
            className='absolute inset-0 h-full w-full object-cover opacity-40'
          />
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture'
            allowFullScreen
            className='absolute inset-0 h-full w-full'
          />
        </div>
        <DialogClose className='absolute -top-12 right-0 rounded-full bg-zinc-900/80 p-2 text-zinc-300 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-white'>
          <X className='h-5 w-5' aria-hidden />
          <span className='sr-only'>{t("close")}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
