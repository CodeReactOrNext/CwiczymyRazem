"use client";

import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const PricingSection = () => {
  const grainOverlay = "before:content-[''] before:absolute before:inset-0 before:opacity-[0.03] before:pointer-events-none before:bg-[url('/static/images/old_effect_dark.webp')] before:z-50";

  return (
    <section className={`py-32 bg-zinc-950 relative overflow-hidden ${grainOverlay}`}>
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-8">
               <Sparkles className="w-3 h-3" /> Fully Operational
            </div>
            
            <h2 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight mb-8 font-display'>
              Professional tracking, <br />
              <span className="text-zinc-600">at zero cost.</span>
            </h2>
            
            <p className='text-xl sm:text-2xl text-zinc-400 font-medium leading-relaxed mb-20 max-w-2xl mx-auto'>
              We believe great tools should be accessible. Riff Quest is 100% free with no hidden subscriptions or locked features.
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12 text-left mb-24 max-w-3xl mx-auto'>
              {[
                'Intelligent Practice Timer',
                'Visual Consistency Tracker',
                'Skill-specific Analytics',
                'Song Library Access',
                'Achievement System',
                'Zero Subscription Costs'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:scale-150 transition-transform duration-300"></div>
                  <span className="text-zinc-300 font-bold tracking-tight text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href='/signup'>
                <Button className='h-20 px-16 bg-white text-black hover:bg-zinc-100 font-bold text-2xl transition-all rounded-lg shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)]'>
                  Launch Your Journey
                </Button>
              </Link>
            </motion.div>
            
            <p className="mt-12 text-zinc-600 text-sm font-bold uppercase tracking-widest">
                No Credit Card Required • Join 600+ Guitarists
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
