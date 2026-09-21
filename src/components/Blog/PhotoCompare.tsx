import { cn } from "assets/lib/utils";
import { Check, X } from "lucide-react";
import React from "react";

/**
 * A side-by-side "this, not that" photo pair, for the places where a fault is far
 * easier to recognise than to describe. Colour does the sorting: red-400 is the
 * app's error accent, emerald-400 its success accent.
 *
 * Both photos carry `data-zoomable`, so the ZoomableImages wrapper around the post
 * body opens them full size. The marked-up detail in these shots (a dotted line
 * along a wrist) is thinner than the article column can show.
 *
 * MDX content compiles with no scope, so every prop has to survive as a plain
 * string (same constraint as SongRanking / PracticeBlueprint).
 */
interface PhotoCompareProps {
  wrongSrc: string;
  wrongAlt: string;
  /** Names the fault itself, e.g. "Spine curved, wrist bent". Not the word "wrong". */
  wrongLabel: string;
  rightSrc: string;
  rightAlt: string;
  rightLabel: string;
  caption?: string;
}

const PANES = [
  {
    key: "wrong" as const,
    Icon: X,
    chip: "bg-red-500/10 text-red-400",
  },
  {
    key: "right" as const,
    Icon: Check,
    chip: "bg-emerald-500/10 text-emerald-400",
  },
];

export const PhotoCompare = ({
  wrongSrc,
  wrongAlt,
  wrongLabel,
  rightSrc,
  rightAlt,
  rightLabel,
  caption,
}: PhotoCompareProps) => {
  const panes = {
    wrong: { src: wrongSrc, alt: wrongAlt, label: wrongLabel },
    right: { src: rightSrc, alt: rightAlt, label: rightLabel },
  };

  return (
    <figure className='not-prose my-10 w-full rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='grid gap-6 sm:grid-cols-2'>
        {PANES.map(({ key, Icon, chip }) => {
          const pane = panes[key];

          return (
            <div key={key}>
              <button
                type='button'
                data-zoomable
                aria-label={`Enlarge image: ${pane.alt}`}
                className='group block w-full cursor-zoom-in overflow-hidden rounded-lg transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:opacity-90'>
                <img
                  src={pane.src}
                  alt={pane.alt}
                  width={800}
                  height={1000}
                  loading='lazy'
                  decoding='async'
                  className='aspect-[4/5] w-full rounded-lg object-cover'
                />
              </button>

              <p
                className={cn(
                  "m-0 mt-3 inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                  chip,
                )}>
                <Icon className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
                {pane.label}
              </p>
            </div>
          );
        })}
      </div>

      {caption && (
        <figcaption className='mt-6 text-sm leading-relaxed text-zinc-400'>
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
