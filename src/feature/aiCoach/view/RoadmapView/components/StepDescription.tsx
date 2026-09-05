import { cn } from "assets/lib/utils";
import { Info, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import React, { useMemo } from "react";

import { parseDescriptionSections } from "../../../utils/parseDescriptionSections";

const SECTION_META: { match: RegExp; Icon: typeof Info; color: string }[] = [
  { match: /what it is/i, Icon: Info, color: "text-sky-400" },
  { match: /why it matters/i, Icon: Lightbulb, color: "text-amber-400" },
  {
    match: /how to (practice|develop|do it)/i,
    Icon: ListChecks,
    color: "text-cyan-400",
  },
];

/** The step's authored text, one block per `[Heading]`, bullets rendered as a list. */
export const StepDescription: React.FC<{ description: string }> = ({
  description,
}) => {
  const sections = useMemo(
    () => parseDescriptionSections(description),
    [description],
  );

  return (
    <div className='flex flex-col gap-7'>
      {sections.map((section, i) => {
        const meta = section.heading
          ? SECTION_META.find((m) => m.match.test(section.heading as string))
          : undefined;
        const Icon = meta?.Icon ?? Sparkles;
        return (
          <section key={i} className='flex flex-col gap-3'>
            {section.heading && (
              <h3 className='flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-400'>
                <Icon
                  className={cn("h-3.5 w-3.5", meta?.color ?? "text-zinc-400")}
                />
                {section.heading}
              </h3>
            )}
            <div className='flex flex-col gap-2.5 text-sm leading-relaxed text-zinc-300'>
              {section.lines.map((line, j) =>
                line.startsWith("- ") ? (
                  <div key={j} className='flex items-start gap-3'>
                    <span className='mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600' />
                    <span>{line.slice(2)}</span>
                  </div>
                ) : (
                  <p key={j}>{line}</p>
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
