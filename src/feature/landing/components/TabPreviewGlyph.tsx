import {
  TAB_PREVIEW_LENGTH,
  type TabPreviewNote,
} from "feature/landing/lib/tabPreview";

const COL = 10;
const ROW = 7;
const PAD_X = 5;
const PAD_Y = 4;
const STRINGS = 6;
const WIDTH = PAD_X * 2 + COL * (TAB_PREVIEW_LENGTH - 1);
const HEIGHT = PAD_Y * 2 + ROW * (STRINGS - 1);

interface TabPreviewGlyphProps {
  notes: TabPreviewNote[];
  className?: string;
}

/**
 * A miniature of the exercise's opening bar: six string lines, one dot per
 * beat, high E on top exactly like the tab the player is about to open.
 * Every exercise gets its own silhouette (a flat row for a one-string drill,
 * a staircase for a shifting one, hollow dots for legato), which is the whole
 * point: the mark is derived from the content instead of stamped on it.
 */
export const TabPreviewGlyph = ({ notes, className }: TabPreviewGlyphProps) => (
  <svg
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    width={WIDTH}
    height={HEIGHT}
    aria-hidden='true'
    className={className}>
    {Array.from({ length: STRINGS }, (_, i) => {
      const y = PAD_Y + i * ROW;
      return (
        <line
          key={i}
          x1={0}
          x2={WIDTH}
          y1={y}
          y2={y}
          className='stroke-zinc-700/70'
          strokeWidth={1}
        />
      );
    })}
    {notes.slice(0, TAB_PREVIEW_LENGTH).map((note, i) => {
      const cx = PAD_X + i * COL;
      const cy = PAD_Y + (note.string - 1) * ROW;
      return note.slur ? (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={2.2}
          className='fill-zinc-950 stroke-cyan-400'
          strokeWidth={1.25}
        />
      ) : (
        <circle key={i} cx={cx} cy={cy} r={2.6} className='fill-cyan-400' />
      );
    })}
  </svg>
);
