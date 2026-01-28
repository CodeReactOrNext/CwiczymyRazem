"use client";

import { Button } from "assets/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const PricingSection = () => {


  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-teal-500/[0.12] blur-[150px] rounded-full pointer-events-none"></div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10'>
        <div className='max-w-4xl mx-auto'>
            <h2 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight mb-8 font-display'>
              Professional tracking, <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">at zero cost.</span>
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

            <div>
              <Link href='/signup'>
                <Button className='h-16 sm:h-20 w-full sm:w-auto px-8 sm:px-16 bg-white text-black hover:bg-zinc-100 font-bold text-xl sm:text-2xl transition-all rounded-lg shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)]'>
                  Launch Your Journey
                </Button>
              </Link>
            </div>
            
            <p className="mt-12 text-zinc-600 text-sm font-bold uppercase tracking-widest">
                No Credit Card Required • Join 600+ Guitarists
            </p>
        </div>
      </div>
    </section>
  );
};
