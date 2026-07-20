import { getSongTier } from "feature/songs/utils/getSongTier";

import type { GuideLiveData, SongGuide } from "../types";
import { DifficultyMeter } from "./DifficultyMeter";
import { GuideSection } from "./GuideSection";

interface GuideVerdictProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

export const GuideVerdict = ({ guide, liveData }: GuideVerdictProps) => {
  const difficulty = liveData.song?.avgDifficulty || guide.editorial.difficulty;
  const tier = getSongTier(difficulty);

  return (
    <GuideSection heading={guide.verdict.heading}>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <div className='shrink-0 rounded-lg bg-zinc-900/60 p-6 lg:w-72'>
          <div className='mb-1 flex items-baseline gap-2'>
            <span
              className='font-display text-5xl font-bold tabular-nums'
              style={{ color: tier.color }}>
            {difficulty.toFixed(1)}
            </span>
            <span className='text-sm text-zinc-500'>/ 10</span>
          </div>
          <p className='mb-4 text-sm font-semibold' style={{ color: tier.color }}>
            {tier.label}
          </p>
          <DifficultyMeter value={difficulty} />
          <p className='mt-5 text-sm leading-relaxed text-zinc-400'>
            {guide.editorial.oneLiner}
          </p>
        </div>
        <div className='space-y-4'>
          {guide.verdict.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className='leading-relaxed text-zinc-400'>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </GuideSection>
  );
};
