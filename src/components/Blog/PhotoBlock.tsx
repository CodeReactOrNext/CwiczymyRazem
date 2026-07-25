import React from 'react';

interface PhotoBlockProps {
  src: string;
  alt: string;
  caption?: string;
  /** 'landscape' | 'square' | 'auto' - controls the crop ratio. 'auto' keeps the
   *  image's native dimensions uncropped, useful for screenshots. Defaults to landscape. */
  ratio?: string;
}

export const PhotoBlock = ({ src, alt, caption, ratio = 'landscape' }: PhotoBlockProps) => {
  const ratioClass =
    ratio === 'square' ? 'aspect-square object-cover' : ratio === 'auto' ? 'h-auto' : 'aspect-[3/2] object-cover';

  return (
    <figure className="not-prose my-10 w-full">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full rounded-lg ${ratioClass}`}
      />
      {caption && <figcaption className="mt-3 text-sm text-zinc-500">{caption}</figcaption>}
    </figure>
  );
};
