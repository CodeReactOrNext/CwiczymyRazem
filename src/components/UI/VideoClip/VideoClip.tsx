import { cn } from "assets/lib/utils";

interface VideoClipProps {
  /** Path under `public`, e.g. `"/guide/exercise.mp4"`. */
  src: string;
  /** What the clip shows — it is the accessible name for the player. */
  label: string;
  caption?: string;
  className?: string;
}

/**
 * A self-hosted screen recording, matted the same way `Screenshot` and the
 * `YouTube` embed are so the three can sit in one flow without a visible seam.
 *
 * It plays on its own, muted and looping: these are short silent captures of
 * the UI, and a clip that starts by itself reads as an illustration rather than
 * as homework. `controls` stays on so a viewer can pause, scrub or unmute.
 *
 * No fixed aspect ratio — recordings come in whatever shape the window was, and
 * forcing 16:9 would letterbox or crop them.
 */
export const VideoClip = ({
  src,
  label,
  caption,
  className,
}: VideoClipProps) => (
  <figure className={cn("not-prose my-8", className)}>
    <div className='overflow-hidden rounded-lg bg-zinc-900/40 p-2 sm:p-3'>
      <video
        src={src}
        aria-label={label}
        controls
        autoPlay
        muted
        loop
        playsInline
        preload='metadata'
        className='w-full rounded'
      />
    </div>
    {caption && (
      <figcaption className='mt-3 text-xs text-zinc-500'>{caption}</figcaption>
    )}
  </figure>
);
