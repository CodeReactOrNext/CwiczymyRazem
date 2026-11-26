import { cn } from "assets/lib/utils";
import { useId } from "react";

/** The pick's outline, shared by the icon and anything that needs the same shape. */
export const PICK_PATH =
  "M20 42.5c-2.2 0-4.4-1.6-6.6-4.6C8.3 31 3 21.6 2.2 14.4 1.4 7.3 9.2 2 20 2s18.6 5.3 17.8 12.4C37 21.6 31.7 31 26.6 37.9c-2.2 3-4.4 4.6-6.6 4.6Z";

/**
 * A celluloid guitar pick in Fame amber — the thing a player tosses at someone after a session.
 * Flat like the rest of the app's tokens: one face colour, a darker ink showing along the lower
 * right edge for volume, one small highlight; no gradient or glow. Deliberately not Kostek: no
 * eyes, not his off-white.
 */
export const PickIcon = ({
  className,
  spent = false,
}: {
  className?: string;
  spent?: boolean;
}) => {
  const clipId = useId();

  return (
    <svg viewBox='0 0 40 44' aria-hidden className={cn("h-5 w-5", className)}>
      {spent ? (
        <path
          d={PICK_PATH}
          className='fill-none stroke-zinc-700'
          strokeWidth={2.5}
          strokeDasharray='4 3'
        />
      ) : (
        <>
          <clipPath id={clipId}>
            <path d={PICK_PATH} />
          </clipPath>
          <path d={PICK_PATH} className='fill-amber-600' />
          <g clipPath={`url(#${clipId})`}>
            <path
              d={PICK_PATH}
              transform='translate(-2.2 -2)'
              className='fill-amber-400'
            />
            <ellipse
              cx='13'
              cy='11'
              rx='4.4'
              ry='2.1'
              transform='rotate(-20 13 11)'
              className='fill-amber-100/60'
            />
          </g>
        </>
      )}
    </svg>
  );
};
