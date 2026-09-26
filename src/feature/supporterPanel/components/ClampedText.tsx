import { cn } from "assets/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * A pitch folded to three lines, with the rest one click away. A board is read
 * by scanning; one long paragraph pushed every other entry off the screen.
 */
export const ClampedText = ({
  text,
  fold = 180,
  className,
}: {
  text: string;
  /** Characters past which the text starts folded. */
  fold?: number;
  className?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > fold || text.split("\n").length > 3;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p
        className={cn(
          "max-w-prose whitespace-pre-line break-words text-sm leading-relaxed text-zinc-400",
          long && !expanded && "line-clamp-3",
        )}>
        {text}
      </p>
      {long && (
        <button
          type='button'
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className='inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-cyan-300'>
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            size={15}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
};
