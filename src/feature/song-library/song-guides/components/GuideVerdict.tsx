import type { SongGuide } from "../types";

interface GuideVerdictProps {
  guide: SongGuide;
}

/**
 * The direct answer to the guide's H1 question — deliberately broken out of
 * the shared dark GuideSection treatment into a white card. One intentional
 * "light beat" against an otherwise all-dark page gives the scroll a visual
 * rhythm and marks this as the section that matters most.
 */
export const GuideVerdict = ({ guide }: GuideVerdictProps) => {
  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-12'>
      <div className='rounded-lg bg-white p-8 sm:p-10'>
        <h2 className='font-display mb-4 text-balance text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl'>
          {guide.verdict.heading}
        </h2>
        <div className='space-y-4'>
          {guide.verdict.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className='leading-relaxed text-zinc-700'>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
