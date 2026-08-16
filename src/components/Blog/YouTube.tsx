import { cn } from "assets/lib/utils";
import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";

interface YouTubeProps {
  /** The `v=` param of the watch URL, e.g. `"x2wERUdqtL0"`. */
  id: string;
  /** Accessible name for the player — say what the video shows. */
  title?: string;
  caption?: string;
  /** Escape hatch for the article-sized vertical margin, e.g. `"my-0"` in a modal. */
  className?: string;
}

/**
 * An embedded YouTube video, matted the same way `Screenshot` and `AppScreen`
 * mat their images so a video can sit in a wiki article without a visible seam.
 *
 * The iframe is lazy: an eager YouTube embed pulls several hundred KB of player
 * before anything below it renders, and wiki articles are public and indexed.
 */
export const YouTube = ({ id, title, caption, className }: YouTubeProps) => (
  <figure className={cn("not-prose my-10", className)}>
    <div className='overflow-hidden rounded-lg bg-zinc-900/40 p-2 sm:p-3'>
      <div className='relative aspect-video'>
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={title ?? "YouTube video player"}
          loading='lazy'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture'
          allowFullScreen
          className='absolute inset-0 h-full w-full rounded'
        />
      </div>
    </div>
    {caption && (
      <figcaption className='mt-3 text-xs text-zinc-500'>
        {withCurrencyIcons(caption)}
      </figcaption>
    )}
  </figure>
);
