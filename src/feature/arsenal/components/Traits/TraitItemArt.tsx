import { cn } from "assets/lib/utils";

/** Trait items are emerald, the colour the cards already use for traits. */
export const IMPRINT_TILE_COLOR = "#34d399";
/** The extractor is a rare tool, in loot amber. */
export const EXTRACTOR_TILE_COLOR = "#fbbf24";

/**
 * A Trait Imprint: a small cast plate the trait was pressed into. Flat, two
 * inks of one colour and nothing else, like the rest of the stash's art.
 */
export const ImprintArt = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 48 48'
    aria-hidden
    className={cn("h-full w-full", className)}>
    <rect
      x='9'
      y='7'
      width='30'
      height='36'
      rx='6'
      className='fill-emerald-700'
    />
    <rect
      x='9'
      y='5'
      width='30'
      height='36'
      rx='6'
      className='fill-emerald-400'
    />
    <circle cx='24' cy='19' r='7' className='fill-emerald-700' />
    <path
      d='M24 13.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.6 3.8-.5z'
      className='fill-emerald-200'
    />
    <rect
      x='15'
      y='30'
      width='18'
      height='3'
      rx='1.5'
      className='fill-emerald-700'
    />
    <rect
      x='18'
      y='35'
      width='12'
      height='2.5'
      rx='1.25'
      className='fill-emerald-700/70'
    />
  </svg>
);

/**
 * A Trait Extractor: a luthier's syringe — barrel, plunger, needle — the tool
 * that draws a trait out of an instrument.
 */
export const ExtractorArt = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 48 48'
    aria-hidden
    className={cn("h-full w-full", className)}>
    <g transform='rotate(-45 24 24)'>
      <rect
        x='21.5'
        y='2'
        width='5'
        height='7'
        rx='1.5'
        className='fill-zinc-300'
      />
      <rect
        x='16'
        y='8'
        width='16'
        height='3.5'
        rx='1.75'
        className='fill-zinc-400'
      />
      <rect
        x='18'
        y='11'
        width='12'
        height='22'
        rx='3'
        className='fill-amber-500'
      />
      <rect
        x='18'
        y='11'
        width='8'
        height='22'
        rx='3'
        className='fill-amber-300'
      />
      <rect
        x='20'
        y='22'
        width='8'
        height='9'
        rx='1.5'
        className='fill-emerald-400'
      />
      <rect
        x='21'
        y='33'
        width='6'
        height='4'
        rx='1'
        className='fill-zinc-400'
      />
      <rect
        x='23.2'
        y='37'
        width='1.6'
        height='9'
        rx='0.8'
        className='fill-zinc-300'
      />
    </g>
  </svg>
);
