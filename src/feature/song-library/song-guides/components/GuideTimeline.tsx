import { Clock } from "lucide-react";

import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideTimelineProps {
  guide: SongGuide;
}

export const GuideTimeline = ({ guide }: GuideTimelineProps) => {
  return (
    <GuideSection heading={guide.timeline.heading} intro={guide.timeline.intro}>
      <div className='grid gap-4 md:grid-cols-3'>
        {guide.timeline.entries.map((entry) => (
          <div key={entry.level} className='rounded-lg bg-zinc-900/40 p-6'>
            <p className='mb-4 text-sm font-medium text-zinc-400'>
              {entry.level}
            </p>
            <div className='mb-3 flex items-center gap-2'>
              <Clock className='h-4 w-4 text-cyan-400' />
              <span className='font-display text-xl font-bold text-cyan-400'>
                {entry.time}
              </span>
            </div>
            <p className='text-sm leading-relaxed text-zinc-400'>{entry.note}</p>
          </div>
        ))}
      </div>
    </GuideSection>
  );
};
