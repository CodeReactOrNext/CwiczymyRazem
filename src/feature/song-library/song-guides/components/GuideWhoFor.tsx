import { CircleCheck, CirclePause } from "lucide-react";

import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideWhoForProps {
  guide: SongGuide;
}

export const GuideWhoFor = ({ guide }: GuideWhoForProps) => {
  return (
    <GuideSection heading={guide.whoFor.heading}>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg bg-zinc-900/40 p-6'>
          <div className='mb-4 flex items-center gap-2'>
            <CircleCheck className='h-5 w-5 text-emerald-400' />
            <h3 className='font-semibold text-zinc-100'>You&apos;re ready if</h3>
          </div>
          <ul className='space-y-3'>
            {guide.whoFor.ready.map((item) => (
              <li
                key={item.slice(0, 32)}
                className='text-sm leading-relaxed text-zinc-400'>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className='rounded-lg bg-zinc-900/40 p-6'>
          <div className='mb-4 flex items-center gap-2'>
            <CirclePause className='h-5 w-5 text-amber-400' />
            <h3 className='font-semibold text-zinc-100'>Maybe wait if</h3>
          </div>
          <ul className='space-y-3'>
            {guide.whoFor.notYet.map((item) => (
              <li
                key={item.slice(0, 32)}
                className='text-sm leading-relaxed text-zinc-400'>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GuideSection>
  );
};
