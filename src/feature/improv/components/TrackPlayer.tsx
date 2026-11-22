import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { youtubeThumbnail } from "feature/improv/utils/improvLink";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpRight, Play } from "lucide-react";
import { useState } from "react";

const ART = ["blues", "rock", "funk", "jazz", "ballad", "metal"];

/**
 * One of the module's six paintings, for a card whose video host gives no
 * thumbnail. Picked by the seed, so the same card always wears the same one.
 */
export const improvArtSrc = (seed: string): string => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `/images/improv/style-${ART[hash % ART.length]}.webp`;
};

export const improvTrackUrl = (youtubeId: string): string =>
  `https://www.youtube.com/watch?v=${youtubeId}`;

interface TrackPlayerProps {
  /** The backing track is a YouTube video. */
  youtubeId: string;
  title: string;
  /**
   * `hero` is the round's own player: the video's thumbnail until play is
   * pressed, then the video in its place. `thumb` is a small cover for lists —
   * too small to hold a video, so its key opens the track on YouTube.
   */
  variant?: "hero" | "thumb";
  /** Hero only: the line over the cover, e.g. "Backing track #12". */
  label?: string;
  className?: string;
}

export const TrackPlayer = ({
  youtubeId,
  title,
  variant = "hero",
  label,
  className,
}: TrackPlayerProps) => {
  const { t } = useTranslation("improv");
  // Remembers which video was started, so a new round's track comes up as a
  // cover again instead of autoplaying in the old one's place.
  const [startedId, setStartedId] = useState<string | null>(null);
  const isStarted = startedId === youtubeId;

  if (variant === "thumb") {
    return (
      <div
        className={cn(
          "force-dark relative aspect-video h-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900",
          className,
        )}>
        <img
          src={youtubeThumbnail(youtubeId)}
          alt=''
          loading='lazy'
          className='h-full w-full object-cover'
        />
        <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
          <Button asChild size='icon'>
            <a
              href={improvTrackUrl(youtubeId)}
              target='_blank'
              rel='noreferrer'
              aria-label={t("player.open_title", { title })}
              title={t("player.open")}>
              <Play />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className='force-dark relative aspect-video overflow-hidden rounded-lg bg-zinc-950'>
        {isStarted ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title}
            allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
            allowFullScreen
            className='absolute inset-0 h-full w-full'
          />
        ) : (
          <>
            <img
              src={youtubeThumbnail(youtubeId)}
              alt=''
              className='h-full w-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/60' />
            {label && (
              <p className='absolute left-5 top-4 text-xs font-semibold text-amber-300'>
                {label}
              </p>
            )}
            <div className='absolute inset-0 flex items-center justify-center'>
              <Button
                type='button'
                size='icon'
                onClick={() => setStartedId(youtubeId)}
                aria-label={t("player.play", { title })}
                className='h-16 w-16 [&_svg]:size-7'>
                <Play />
              </Button>
            </div>
          </>
        )}
      </div>

      <a
        href={improvTrackUrl(youtubeId)}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-1.5 self-start text-xs font-medium text-zinc-400 transition-colors duration-fast hover:text-zinc-100'>
        {t("player.open")}
        <ArrowUpRight className='h-3.5 w-3.5' />
      </a>
    </div>
  );
};
