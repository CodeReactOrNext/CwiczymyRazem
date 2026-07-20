import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideMistakesProps {
  guide: SongGuide;
}

export const GuideMistakes = ({ guide }: GuideMistakesProps) => {
  return (
    <GuideSection heading={guide.mistakes.heading}>
      <div className='space-y-4'>
        {guide.mistakes.items.map((mistake) => (
          <div key={mistake.title} className='rounded-lg bg-zinc-900/40 p-6'>
            <h3 className='mb-3 font-semibold text-zinc-100'>{mistake.title}</h3>
            <div className='space-y-2 text-sm leading-relaxed'>
              <p className='text-zinc-400'>
                <span className='font-medium text-amber-400'>Why it hurts: </span>
                {mistake.why}
              </p>
              <p className='text-zinc-400'>
                <span className='font-medium text-emerald-400'>The fix: </span>
                {mistake.fix}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GuideSection>
  );
};
