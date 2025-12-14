import { Card } from "assets/components/ui/card";
import { i18n } from "next-i18next";

import type { LocalizedContent } from "../../../types/exercise.types";

interface TipsCardProps {
  tips: Array<LocalizedContent>;
}

export const TipsCard = ({ tips }: TipsCardProps) => {
  const currentLang = i18n?.language as keyof LocalizedContent;

  return (
    <Card className='border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm'>
      {/* PRIMARY: Enhanced header with visual hierarchy */}
      <div className='border-b border-zinc-700/30 bg-gradient-to-r from-emerald-500/5 to-transparent p-4'>
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 rounded-full bg-emerald-400'></div>
          <h3 className='text-lg font-semibold text-white'>Wskazówki</h3>
          <div className='ml-auto'>
            <span className='rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300'>
              {tips.length} wskazówek
            </span>
          </div>
        </div>
      </div>

      <div className='p-4'>
        {/* SECONDARY: Enhanced tips list with better hierarchy */}
        <div className='space-y-4'>
          {tips.map((tip, index) => (
            <div key={index} className='group flex items-start gap-3'>
              <div className='mt-1 flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400/60 transition-colors duration-200 group-hover:bg-emerald-400'></div>
              <p className='text-sm leading-relaxed text-zinc-200 transition-colors duration-200 group-hover:text-white'>
                {tip[currentLang]}
              </p>
            </div>
          ))}
        </div>

        {/* TERTIARY: Tip progress indicator */}
        <div className='mt-5 border-t border-zinc-800/50 pt-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-zinc-400'>
              Pomocne wskazówki
            </span>
            <div className='flex gap-1'>
              {tips.map((_, idx) => (
                <div
                  key={idx}
                  className='h-1 w-1 rounded-full bg-emerald-400/40 transition-all duration-300 hover:bg-emerald-400/70'
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
