"use client";

import { Check, Zap, Star, Trophy } from "lucide-react";
import { Button } from "assets/components/ui/button";
import Link from "next/link";

export const PricingSection = () => {
  return (
    <section className='relative py-24 sm:py-32 bg-[#0d0d0c] border-t border-zinc-800/50'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center mb-16'>
          <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl'>
            Start your journey today
          </h2>
          <p className='mt-4 text-lg text-zinc-400'>
            Everything you need to master guitar. Completely free.
          </p>
        </div>

        <div className='mx-auto max-w-lg'>
          <div className='relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 p-8 shadow-2xl shadow-cyan-500/10'>
            {/* Glow effect */}
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-transparent'></div>
            
            <div className='relative'>
              <div className='flex items-center justify-between mb-8'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-xl font-bold text-white'>Unlimited Access</h3>
                  </div>
                  <p className='text-zinc-400 text-sm'>Join our community</p>
                </div>
        
              </div>

              <ul className='space-y-4 mb-8'>
                {[
                  { text: 'Timer with 4 skill categories', icon: Zap },
                  { text: 'Detailed statistics & analytics', icon: Star },
                  { text: 'Activity heatmap tracking', icon: Check },
                  { text: 'Gamification & achievements', icon: Trophy },
                  { text: 'Song library management', icon: Check },
                  { text: 'Community leaderboard', icon: Check },
                ].map((feature, i) => (
                  <li key={i} className='flex items-center gap-3'>
                    <div className='w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center'>
                      <feature.icon className='w-4 h-4 text-cyan-400' />
                    </div>
                    <span className='text-zinc-300 text-sm'>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Link href='/signup' className="block">
                <Button className='w-full py-6 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-base hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 transition-all'>
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
