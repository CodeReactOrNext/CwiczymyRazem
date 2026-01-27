"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { motion } from "framer-motion";

export const FaqSection = ({ questions }: { questions: faqQuestionInterface[] }) => {
  return (
    <section className='py-20 bg-zinc-950 border-t border-white/5'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='max-w-xl mb-12'>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-3xl font-bold text-white tracking-tighter leading-tight font-display'
          >
            Frequently Asked <br/>
            <span className="text-zinc-600">Questions.</span>
          </motion.h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t border-white/5 pt-12'>
          {questions.map((faq, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className='flex flex-col'
            >
              <h3 className='text-base font-bold text-white tracking-tight mb-3'>
                {faq.title}
              </h3>
              <p className='text-zinc-500 text-sm leading-relaxed max-w-md'>
                {faq.message}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
