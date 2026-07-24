export interface SubdivisionOption {
  value: number;
  title: string;
}

export const SUBDIVISIONS: SubdivisionOption[] = [
  { value: 1, title: "Quarter notes — no subdivision" },
  { value: 2, title: "Eighth notes" },
  { value: 3, title: "Eighth-note triplets" },
  { value: 4, title: "Sixteenth notes" },
];

// Real note-head/beam glyphs (quarter / beamed eighths / triplet / beamed
// sixteenths) instead of text labels — reads at a glance the way an actual
// metronome's subdivision selector does. Shared by every UI that exposes
// metronome.setSubdivision so they all draw the same glyph for a given value.
export const SubdivisionIcon = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  const paired = value !== 1;
  const doubleBeam = value === 4;

  return (
    <svg viewBox='0 0 24 24' fill='none' className={className} aria-hidden>
      {paired ? (
        <>
          <ellipse
            cx='7'
            cy='19'
            rx='3.1'
            ry='2.3'
            fill='currentColor'
            transform='rotate(-12 7 19)'
          />
          <ellipse
            cx='17'
            cy='19'
            rx='3.1'
            ry='2.3'
            fill='currentColor'
            transform='rotate(-12 17 19)'
          />
          <line
            x1='9.9'
            y1='19'
            x2='9.9'
            y2='5'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
          />
          <line
            x1='19.9'
            y1='19'
            x2='19.9'
            y2='5'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
          />
          <rect
            x='9.9'
            y='5'
            width='10'
            height='2'
            rx='0.6'
            fill='currentColor'
          />
          {doubleBeam && (
            <rect
              x='9.9'
              y='8.2'
              width='10'
              height='2'
              rx='0.6'
              fill='currentColor'
            />
          )}
          {value === 3 && (
            <text
              x='14.9'
              y='4'
              textAnchor='middle'
              fontSize='7'
              fontWeight='700'
              fill='currentColor'>
              3
            </text>
          )}
        </>
      ) : (
        <>
          <ellipse
            cx='9.5'
            cy='19'
            rx='3.3'
            ry='2.5'
            fill='currentColor'
            transform='rotate(-12 9.5 19)'
          />
          <line
            x1='12.7'
            y1='19'
            x2='12.7'
            y2='4'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
          />
        </>
      )}
    </svg>
  );
};
