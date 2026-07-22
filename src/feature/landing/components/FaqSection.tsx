"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

export const FaqSection = ({
  questions,
}: {
  questions: faqQuestionInterface[];
}) => {
  return (
    <section className='bg-zinc-900/40 py-28'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-16 max-w-xl'>
          <h2 className='font-landingHeading text-3xl font-semibold leading-tight tracking-tight text-white'>
            Frequently asked <br />
            <span className='text-zinc-600'>questions.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2'>
          {questions.map((faq, index) => (
            <div key={index} className='flex flex-col'>
              <h3 className='mb-3 text-base font-bold tracking-tight text-white'>
                {faq.title}
              </h3>
              <p className='max-w-md text-sm leading-relaxed text-zinc-500'>
                {faq.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
