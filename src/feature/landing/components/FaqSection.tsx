"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

export const FaqSection = ({ questions }: { questions: faqQuestionInterface[] }) => {
  return (
    <section className='relative py-24 sm:py-32 bg-zinc-950'>
        <div className='mx-auto max-w-4xl px-6 lg:px-8'>
             <div className='text-center mb-16'>
                <h2 className='text-3xl font-bold text-white'>Frequently Asked Questions</h2>
             </div>
             
             <div className='space-y-4'>
                {questions.map((faq, index) => (
                     <div key={index} className='rounded-xl border border-zinc-800 bg-zinc-900/30 p-6'>
                         <h3 className='flex text-base font-semibold text-white mb-2'>
                             {faq.title}
                         </h3>
                         <p className='text-zinc-400 text-sm leading-relaxed'>
                             {faq.message}
                         </p>
                     </div>
                ))}
             </div>
        </div>
    </section>
  );
};
