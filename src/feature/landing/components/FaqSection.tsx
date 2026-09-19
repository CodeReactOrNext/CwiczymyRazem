"use client";

import type {
  faqGroupInterface,
  faqQuestionInterface,
} from "feature/faq/components/FaqLayout";
import { Reveal } from "feature/landing/components/Reveal";
import { Plus } from "lucide-react";
import Link from "next/link";

export interface FaqMoreLink {
  /** Sentence before the link, so the link reads as part of a thought. */
  intro: string;
  href: string;
  label: string;
}

interface FaqSectionProps {
  /** Flat list; rendered as a single unlabeled group. */
  questions?: faqQuestionInterface[];
  /** Labeled groups. Takes precedence over `questions` when both are given. */
  groups?: faqGroupInterface[];
  moreLink?: FaqMoreLink;
}

/**
 * Native <details> instead of the shared Radix accordion on purpose:
 * Radix unmounts closed panels, while <details> keeps every answer in the
 * server-rendered HTML (SEO, find-in-page auto-expand) with zero JS.
 *
 * Hierarchy comes from three things, none of them a border: labeled groups,
 * a running Teko index in front of every question (the same numeral voice
 * as the rest of the landing), and the open item being the only tinted one.
 * The very first question starts open, so the section never reads as a
 * closed wall of identical rows.
 */
export const FaqSection = ({
  questions = [],
  groups,
  moreLink,
}: FaqSectionProps) => {
  const resolvedGroups: faqGroupInterface[] =
    groups && groups.length > 0 ? groups : [{ section: "", questions }];

  // Running 01..NN across groups, computed up front so render stays pure.
  const numbered = resolvedGroups.map((group, groupIndex) => {
    const start = resolvedGroups
      .slice(0, groupIndex)
      .reduce((count, previous) => count + previous.questions.length, 0);
    return {
      ...group,
      questions: group.questions.map((faq, i) => ({
        ...faq,
        index: start + i + 1,
      })),
    };
  });

  return (
    <section className='bg-zinc-900 py-24'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-20 lg:px-8'>
        <Reveal className='lg:sticky lg:top-24 lg:self-start'>
          <h2 className='font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl'>
            Frequently asked questions
          </h2>
          {moreLink && (
            <p className='mt-6 max-w-sm text-base leading-relaxed text-zinc-400'>
              {moreLink.intro}{" "}
              <Link
                href={moreLink.href}
                className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                {moreLink.label}
              </Link>
            </p>
          )}
        </Reveal>

        <Reveal delay={0.05} className='space-y-12'>
          {numbered.map((group) => (
            <div key={group.section || "faq"}>
              {group.section && (
                <h3 className='mb-3 pl-5 text-sm font-bold tracking-wide text-cyan-400'>
                  {group.section}
                </h3>
              )}
              <div className='space-y-1'>
                {group.questions.map((faq) => (
                  <details
                    key={faq.title}
                    open={faq.index === 1}
                    className='group rounded-lg px-5 transition-colors open:bg-zinc-950/50 hover:bg-zinc-950/30'>
                    <summary className='flex cursor-pointer list-none items-start gap-5 py-5 [&::-webkit-details-marker]:hidden'>
                      <span
                        aria-hidden='true'
                        className='w-7 shrink-0 font-teko text-[26px] font-medium tabular-nums leading-none text-zinc-600 transition-colors group-open:text-cyan-400'>
                        {String(faq.index).padStart(2, "0")}
                      </span>
                      <span className='flex-1 pt-px text-lg font-semibold leading-snug tracking-tight text-zinc-200 transition-colors group-open:text-white group-hover:text-white'>
                        {faq.title}
                      </span>
                      <Plus
                        aria-hidden='true'
                        className='mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-45'
                      />
                    </summary>
                    <p className='max-w-prose pb-6 pl-12 text-base leading-relaxed text-zinc-400'>
                      {faq.message}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
