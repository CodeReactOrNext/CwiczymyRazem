import { cn } from "assets/lib/utils";
import { Sparkles, Zap } from "lucide-react";

import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideTechniquesProps {
  guide: SongGuide;
}

const TechniqueDots = ({ level }: { level: number }) => (
  <div
    className='flex items-center gap-1'
    aria-label={`Technique difficulty ${level} of 5`}>
    {[1, 2, 3, 4, 5].map((dot) => (
      <span
        key={dot}
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          dot <= level ? "bg-cyan-400" : "bg-zinc-700"
        )}
      />
    ))}
  </div>
);

export const GuideTechniques = ({ guide }: GuideTechniquesProps) => {
  return (
    <GuideSection
      heading={guide.techniques.heading}
      intro={guide.techniques.intro}>
      <div className='grid gap-4 md:grid-cols-2'>
        {guide.techniques.items.map((technique) => (
          <div
            key={technique.name}
            className={cn(
              "rounded-lg p-5",
              technique.role === "core" ? "bg-zinc-900/60" : "bg-zinc-900/30"
            )}>
            <div className='mb-2 flex items-center justify-between gap-3'>
              <h3 className='flex items-center gap-2 font-semibold text-zinc-100'>
                {technique.role === "core" ? (
                  <Zap
                    className='h-4 w-4 shrink-0 text-cyan-400'
                    aria-hidden='true'
                  />
                ) : (
                  <Sparkles
                    className='h-4 w-4 shrink-0 text-purple-400'
                    aria-hidden='true'
                  />
                )}
                {technique.name}
              </h3>
              <TechniqueDots level={technique.difficulty} />
            </div>
            {technique.role === "bonus" && (
              <p className='mb-2 text-xs font-medium text-purple-400'>
                Stretch goal — optional at first
              </p>
            )}
            <p className='text-sm leading-relaxed text-zinc-400'>
              {technique.description}
            </p>
          </div>
        ))}
      </div>
    </GuideSection>
  );
};
