import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";

interface ScreenshotProps {
  /** Path under `public`, e.g. `"/images/wiki/log-time.webp"`. */
  src: string;
  /** What the screen shows — read out when the image can't be. */
  alt: string;
  caption?: string;
  /**
   * Cap the rendered width, e.g. `"640px"`. Tall, narrow screens otherwise
   * stretch to the full column and push everything below them off-screen.
   */
  maxWidth?: string;
}

/**
 * A real screenshot, matted the same way {@link AppScreen} mats its mock windows
 * so the two can sit in one article without a visible seam.
 *
 * `not-prose` matters twice over: it keeps Tailwind Typography's ~1.8em `img`
 * margin off the picture (spacing is the figure's job here), and it stops the
 * caption inheriting prose paragraph styles.
 *
 * Screenshots age badly — the UI moves and nobody re-shoots. Prefer the mock
 * components for anything explaining a *mechanic* (what a session is worth), and
 * reach for this when the point is genuinely "this is what it looks like".
 */
export const Screenshot = ({ src, alt, caption, maxWidth }: ScreenshotProps) => (
  <figure className='not-prose my-10'>
    <div
      className='overflow-hidden rounded-lg bg-zinc-900/40 p-2 sm:p-3'
      style={maxWidth ? { maxWidth } : undefined}>
      {/* Plain <img>: sources arrive from markdown as bare strings with no known
          intrinsic size, so next/image would need width/height parsed out of
          them before it could add anything. The files are already WebP and
          lazy-loaded, which is most of what it would have bought us.
          `decoding="async"` keeps a long article's images off the main thread. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading='lazy'
        decoding='async'
        className='w-full rounded'
      />
    </div>
    {caption && (
      <figcaption className='mt-3 text-xs text-zinc-500'>
        {withCurrencyIcons(caption)}
      </figcaption>
    )}
  </figure>
);
