interface Affix {
  id: string;
  label: string;
  points: number;
}

interface CardAffixesProps {
  features: Affix[];
}

/** A mod worth this many points leads the list as the item's signature. */
const SIGNATURE_POINTS = 3;

/**
 * The mod list under a guitar or pedal card — strongest first, all of it.
 *
 * Both cards used to inline the same block with the same magic colours. It was
 * capped at three with a "+8 more" underneath to keep the grid even, but what
 * the card is *for* is reading what an instrument carries — a count of the mods
 * being withheld is the one thing on it nobody wants. A built guitar makes a
 * taller card than a plain one, and that is the honest shape of it.
 */
export const CardAffixes = ({ features }: CardAffixesProps) => {
  if (features.length === 0) return null;

  const sorted = [...features].sort((a, b) => b.points - a.points);
  const signature =
    sorted[0] && sorted[0].points >= SIGNATURE_POINTS ? sorted[0] : null;

  // Darker panel instead of the old hairline: the block separates from the image
  // above it by surface, not by a line.
  return (
    <div
      className='relative z-10 flex flex-shrink-0 flex-col gap-1 px-3 py-3'
      style={{ background: "rgba(0,0,0,0.28)" }}>
      {sorted.map((f) => {
        const isSignature = f.id === signature?.id;
        return (
          <div key={f.id} className='flex items-baseline gap-2 leading-snug'>
            <span
              className='flex-shrink-0 text-[11px]'
              style={{ color: isSignature ? "#f59e0b" : "#52525b" }}>
              {isSignature ? "★" : "◆"}
            </span>
            <span
              className='truncate text-[12px]'
              style={{ color: isSignature ? "#f5a524" : "#d4d4d8" }}>
              <span
                className='font-bold'
                style={{ color: isSignature ? "#fbbf24" : "#7dd3fc" }}>
                +{f.points}
              </span>{" "}
              {f.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
