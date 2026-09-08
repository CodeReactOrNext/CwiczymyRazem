import { ChevronDown } from "lucide-react";

export interface faqQuestionInterface {
  title: string;
  message: string;
}

export interface faqGroupInterface {
  section: string;
  questions: faqQuestionInterface[];
}

interface FaqLayoutProps {
  groups: faqGroupInterface[];
}

/**
 * Native <details> instead of the Radix accordion on purpose: Radix unmounts
 * closed panels, so every answer was missing from the server-rendered HTML and
 * the page read as thin content to crawlers. <details> keeps the answers in the
 * markup (and makes find-in-page work) with zero JavaScript.
 */
export const FaqLayout = ({ groups }: FaqLayoutProps) => {
  return (
    <div className='space-y-6'>
      {groups.map((group) => (
        <section
          key={group.section}
          className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
          <h2 className='mb-6 text-lg font-bold text-zinc-100'>
            {group.section}
          </h2>

          <div className='space-y-4'>
            {group.questions.map((faq) => (
              <details key={faq.title} className='group'>
                <summary className='flex cursor-pointer list-none items-center justify-between gap-4 rounded py-2 text-base font-medium text-zinc-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 [&::-webkit-details-marker]:hidden'>
                  {faq.title}
                  <ChevronDown className='h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180' />
                </summary>
                <p className='max-w-2xl pb-4 pt-1 text-sm leading-relaxed text-zinc-400'>
                  {faq.message}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
