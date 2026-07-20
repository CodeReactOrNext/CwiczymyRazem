import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuidePracticePlanProps {
  guide: SongGuide;
}

export const GuidePracticePlan = ({ guide }: GuidePracticePlanProps) => {
  return (
    <GuideSection
      heading={guide.practicePlan.heading}
      intro={guide.practicePlan.intro}>
      <ol className='space-y-3'>
        {guide.practicePlan.steps.map((step, index) => (
          <li
            key={step.slice(0, 32)}
            className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5'>
            <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400'>
              {index + 1}
            </span>
            <p className='text-sm leading-relaxed text-zinc-300'>{step}</p>
          </li>
        ))}
      </ol>
    </GuideSection>
  );
};
