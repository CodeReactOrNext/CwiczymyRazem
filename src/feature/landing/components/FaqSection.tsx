"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

export const FaqSection = ({ questions }: { questions: faqQuestionInterface[] }) => {
  return (
    <section className='py-20 bg-zinc-950 border-t border-white/5'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='max-w-xl mb-12'>
          <h2 className='text-3xl font-bold text-white tracking-tighter leading-tight font-display'>
            Frequently Asked <br/>
            <span className="text-zinc-600">Questions.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t border-white/5 pt-12'>
          {questions.map((faq, index) => (
            <div 
              key={index} 
              className='flex flex-col'
            >
              <h3 className='text-base font-bold text-white tracking-tight mb-3'>
                {faq.title}
              </h3>
              <p className='text-zinc-500 text-sm leading-relaxed max-w-md'>
                {faq.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
