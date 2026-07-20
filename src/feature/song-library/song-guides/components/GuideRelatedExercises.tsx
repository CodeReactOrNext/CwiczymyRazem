import type { SeoLandingGuideLink } from "feature/seoLanding/types/seoLanding.types";
import { ArrowRight, Dumbbell } from "lucide-react";
import Link from "next/link";

import { GuideSection } from "./GuideSection";

interface GuideRelatedExercisesProps {
  links: SeoLandingGuideLink[];
}

export const GuideRelatedExercises = ({ links }: GuideRelatedExercisesProps) => {
  if (links.length === 0) return null;

  return (
    <GuideSection
      heading='Build the skills this song needs'
      intro='Free, interactive exercise programs that drill the exact techniques above.'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {links.map((link) => (
          <Link
            key={link.slug}
            href={`/${link.slug}`}
            className='group flex h-full flex-col rounded-lg bg-zinc-900/40 p-6 transition-background hover:bg-zinc-900/70'>
            <Dumbbell className='mb-3 h-4 w-4 text-cyan-400' aria-hidden='true' />
            <h3 className='mb-2 font-bold text-zinc-100'>{link.title}</h3>
            <p className='mb-4 flex-1 text-sm leading-relaxed text-zinc-400'>
              {link.description}
            </p>
            <span className='flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300'>
              Practice this
              <ArrowRight className='h-4 w-4' aria-hidden='true' />
            </span>
          </Link>
        ))}
      </div>
    </GuideSection>
  );
};
