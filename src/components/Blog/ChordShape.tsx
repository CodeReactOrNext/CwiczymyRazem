import React from "react";

// MDX content is compiled with no scope, so props must survive as plain strings
// — same pipe-delimited convention as Checklist/StepList.
interface ChordShapeProps {
  /** Diagram path under /images/blog/guitar-chords. */
  src: string;
  /** Alt text describing the shape, not the chord name alone. */
  alt: string;
  /** Where a downward strum starts, e.g. "A string (5)". */
  lowest: string;
  /** Pipe-delimited "Finger::Where it goes" pairs. */
  fingers: string;
  /** The note or string that usually goes wrong in this shape. */
  listen: string;
  /** A short drill for this shape. */
  practice: string;
}

const parsePairs = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, detail] = item.split("::").map((part) => part.trim());
      return { label, detail };
    });

/**
 * One open-chord entry: the supplied diagram beside its finger positions.
 *
 * The diagram is drawn at 440x580 and displayed at 220 CSS pixels, which is the
 * size it stays readable at on a phone without pinch-zooming — so it sits above
 * the instructions on a narrow screen and beside them from `md` up. The text is
 * real HTML rather than baked into the image: the diagram supplements the
 * instructions, it is never the only place the information exists.
 */
export const ChordShape = ({
  src,
  alt,
  lowest,
  fingers,
  listen,
  practice,
}: ChordShapeProps) => {
  const positions = parsePairs(fingers);

  return (
    <figure className='not-prose my-10 flex flex-col gap-7 rounded-lg bg-zinc-900/40 p-6 md:flex-row md:gap-9 md:p-8'>
      <div className='shrink-0'>
        <img
          src={src}
          alt={alt}
          width={440}
          height={580}
          loading='lazy'
          decoding='async'
          className='mx-auto w-[220px] rounded-lg'
        />
      </div>

      <div className='min-w-0 space-y-7'>
        <dl className='space-y-3'>
          {positions.map((position) => (
            <div key={position.label} className='flex flex-wrap gap-x-2'>
              <dt className='font-bold text-white'>{position.label}</dt>
              <dd className='text-zinc-400'>{position.detail}</dd>
            </div>
          ))}
          <div className='flex flex-wrap gap-x-2'>
            <dt className='font-bold text-white'>Strum from</dt>
            <dd className='text-zinc-400'>{lowest}</dd>
          </div>
        </dl>

        <p className='text-sm leading-relaxed text-zinc-400'>
          <span className='font-bold text-white'>Listen for </span>
          {listen}
        </p>

        <p className='text-sm leading-relaxed text-zinc-400'>
          <span className='font-bold text-white'>Try this </span>
          {practice}
        </p>
      </div>
    </figure>
  );
};
