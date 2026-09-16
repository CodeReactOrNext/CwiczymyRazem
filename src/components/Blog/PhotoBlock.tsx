import { Maximize2 } from 'lucide-react';
import React from 'react';

interface PhotoBlockProps {
  src: string;
  alt: string;
  caption?: string;
  /** 'landscape' | 'square' | 'auto' - controls the crop ratio. 'auto' keeps the
   *  image's native dimensions uncropped, useful for screenshots. Defaults to landscape. */
  ratio?: string;
  /** Intrinsic pixel size of the source. Worth passing with `ratio='auto'`, where
   *  nothing else tells the browser how tall the image will be, so the article
   *  below it stops jumping while the file loads. MDX props arrive as strings. */
  width?: number | string;
  height?: number | string;
}

export const PhotoBlock = ({ src, alt, caption, ratio = 'landscape', width, height }: PhotoBlockProps) => {
  const ratioClass =
    ratio === 'square' ? 'aspect-square object-cover' : ratio === 'auto' ? 'h-auto' : 'aspect-[3/2] object-cover';

  return (
    <figure className="not-prose my-10 w-full">
      {/* Screenshots carry fine detail — tab numbers, filter labels — that the
          article column shrinks past readability. `data-zoomable` is what the
          ZoomableImages wrapper around the post body listens for. */}
      <button
        type="button"
        data-zoomable
        aria-label={`Enlarge image: ${alt}`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={`w-full rounded-lg ${ratioClass}`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 rounded bg-zinc-950/70 p-2 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>
      {caption && <figcaption className="mt-3 text-sm text-zinc-500">{caption}</figcaption>}
    </figure>
  );
};
