"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { Reveal } from "feature/landing/components/Reveal";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export interface FaqMoreLink {
  /** Sentence before the link, so the link reads as part of a thought. */
  intro: string;
  href: string;
  label: string;
}

/**
 * Native <details> instead of the shared Radix accordion on purpose:
 * Radix unmounts closed panels, while <details> keeps every answer in the
 * server-rendered HTML (SEO, find-in-page auto-expand) with zero JS.
 */
export const FaqSection = ({
  questions,
  moreLink,
}: {
  questions: faqQuestionInterface[];
  moreLink?: FaqMoreLink;
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

        {moreLink && (
          <p className='mt-8 text-sm leading-relaxed text-zinc-400'>
            {moreLink.intro}{" "}
            <Link
              href={moreLink.href}
              className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
              {moreLink.label}
            </Link>
          </p>
        )}
      </Reveal>
    </section>
  );
};
