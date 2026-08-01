import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";

import type { GuideLiveData, SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideProgressionProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

const LADDER: { tier: "D" | "C" | "B" | "A" | "S"; label: string }[] = [
  { tier: "D", label: "Beginner" },
  { tier: "C", label: "Intermediate" },
  { tier: "B", label: "Advanced" },
  { tier: "A", label: "Expert" },
  { tier: "S", label: "Legendary" },
];

export const GuideProgression = ({ guide, liveData }: GuideProgressionProps) => {
  const difficulty = liveData.song?.avgDifficulty || guide.editorial.difficulty;
  const activeTier = getSongTier(difficulty).tier;

  return (
    <GuideSection heading={guide.progression.heading}>
      <div className='mb-8 grid grid-cols-5 gap-2'>
        {LADDER.map((step) => {
          const stepTier = getSongTier(step.tier);
          const isActive = step.tier === activeTier;

          return (
            <div
              key={step.tier}
              className={cn(
                "rounded-lg p-3 text-center sm:p-4",
                isActive ? "bg-zinc-800/80" : "bg-zinc-900/30"
              )}>
              <p
                className='font-display text-xl font-bold sm:text-2xl'
                style={{ color: isActive ? stepTier.color : "#52525b" }}>
                {step.tier}
              </p>
              <p
                className={cn(
                  "mt-1 hidden text-xs sm:block",
                  isActive ? "text-zinc-300" : "text-zinc-600"
                )}>
                {step.label}
              </p>
              {isActive && (
                <p className='mt-2 text-[10px] font-semibold text-cyan-400 xs:text-xs'>
                  {guide.title}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className='max-w-3xl leading-relaxed text-zinc-400'>
        {guide.progression.description}
      </p>
    </GuideSection>
  );
};
