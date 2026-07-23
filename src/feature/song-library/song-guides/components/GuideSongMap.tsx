import { Flame } from "lucide-react";

import type { SongGuide } from "../types";
import { DifficultyMeter } from "./DifficultyMeter";
import { GuideSection } from "./GuideSection";

interface GuideSongMapProps {
  guide: SongGuide;
}

export const GuideSongMap = ({ guide }: GuideSongMapProps) => {
  const songMap = guide.songMap;
  if (!songMap) return null;

  return (
    <GuideSection heading={songMap.heading} intro={songMap.intro}>
      <div className='space-y-3'>
        {songMap.sections.map((section) => (
          <div key={section.name} className='rounded-lg bg-zinc-900/40 p-5'>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-zinc-100'>{section.name}</h3>
                {section.isHardest && (
                  <span className='flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400'>
                    <Flame className='h-3 w-3' />
                    Hardest part
                  </span>
                )}
              </div>
              <div className='w-40'>
                <DifficultyMeter value={section.difficulty} showValue={false} />
              </div>
            </div>
            <p className='text-sm leading-relaxed text-zinc-400'>
              {section.description}
            </p>
          </div>
        ))}
      </div>
      <div className='mt-6 rounded-lg bg-orange-500/10 p-6'>
        <p className='text-sm leading-relaxed text-zinc-300'>
          {songMap.hardestSummary}
        </p>
      </div>
    </GuideSection>
  );
};
