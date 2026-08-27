import { cn } from "assets/lib/utils";

/**
 * The notched luggage tags an item wears in its top-right corner.
 *
 * Year and country are the two facts that make a guitar a *specific* guitar
 * rather than a model, so they hang off the artwork like tags on a case rather
 * than sitting in the header with the name. Shared because the card, the pedal
 * card and the rig socket all show the same pair — they were three copies of
 * the same clip-path, which is three chances for them to drift apart.
 */
interface SpecTagsProps {
  /** Falsy entries are dropped, so optional item fields can be passed straight in. */
  tags: (string | number | null | undefined)[];
  className?: string;
}

export const SpecTags = ({ tags, className }: SpecTagsProps) => {
  const shown = tags.filter(Boolean);
  if (shown.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      {shown.map((tag, i) => (
        <div key={i} className='relative flex items-center'>
          {/* The eyelet the tag hangs from */}
          <div
            className='absolute left-[3px] z-10 h-[5px] w-[5px] rounded-full'
            style={{
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          <div
            className='truncate text-[9px] font-semibold tracking-wide text-zinc-300'
            style={{
              background: "linear-gradient(135deg, #28282e, #1b1b21)",
              borderRadius: "2px 3px 3px 2px",
              clipPath: "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)",
              paddingLeft: "14px",
              paddingRight: "8px",
              paddingTop: "3px",
              paddingBottom: "3px",
            }}>
            {tag}
          </div>
        </div>
      ))}
    </div>
  );
};
