"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { Reveal } from "feature/landing/components/Reveal";
import { ChevronDown } from "lucide-react";

/**
 * Native <details> instead of the shared Radix accordion on purpose:
 * Radix unmounts closed panels, while <details> keeps every answer in the
 * server-rendered HTML (SEO, find-in-page auto-expand) with zero JS.
 */
export const FaqSection = ({
  questions,
}: {
  questions: faqQuestionInterface[];
}) => {
  return (
    <section className='bg-zinc-900 py-20'>
      <Reveal className='mx-auto max-w-3xl px-6 lg:px-8'>
        <h2 className='mb-10 font-landingHeading text-3xl font-bold leading-tight tracking-tight text-white'>
          Frequently asked questions
        </h2>

        <div className='space-y-3'>
          {questions.map((faq) => (
            <details
              key={faq.title}
              className='group rounded-lg bg-zinc-950/50 px-6'>
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-bold tracking-tight text-white [&::-webkit-details-marker]:hidden'>
                {faq.title}
                <ChevronDown className='h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180' />
              </summary>
              <p className='pb-6 text-sm leading-relaxed text-zinc-400'>
                {faq.message}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
};
