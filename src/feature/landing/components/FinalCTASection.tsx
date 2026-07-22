"use client";

import { Button } from "assets/components/ui/button";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const FinalCTASection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-28'>
      {/* Background decoration - Floating Glow (pure CSS, no JS-driven animation) */}
      <div className='absolute inset-0 z-0 overflow-hidden'>
        <div className='pointer-events-none absolute left-1/4 top-1/4 h-[800px] w-[800px] animate-glow-float-1 rounded-full bg-cyan-500/15 blur-[140px]' />
        <div className='pointer-events-none absolute bottom-1/4 right-1/4 h-[800px] w-[800px] animate-glow-float-2 rounded-full bg-cyan-500/10 blur-[140px]' />
        <GuitarPatternBackground opacity={0.02} />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='flex flex-col items-center text-center'>
          <div className='max-w-4xl'>
            <h2 className='mb-8 font-landingHeading text-5xl font-bold leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl'>
              Level up your <br />
              <span className='text-cyan-400'>future self.</span>
            </h2>

            <p className='mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-zinc-400 sm:text-xl'>
              Join guitarists who already turned practice into progress.
            </p>

            <div className='flex flex-col items-center'>
              <Link href='/signup'>
                <div className='group relative overflow-hidden rounded-lg p-[1px] transition-transform duration-300 active:scale-[0.98]'>
                  {/* Vibrant Rotating Border Beam - Restored and Working */}
                  <div className='absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100' />

                  <Button className='group/btn relative h-14 w-full overflow-hidden rounded-lg border-none bg-zinc-950 px-10 text-base font-bold text-white transition-all hover:bg-zinc-900 sm:h-14 sm:w-auto'>
                    <span className='relative z-10 flex items-center gap-3'>
                      Start My Guitar Progress
                      <ArrowRight className='h-5 w-5 text-cyan-400 transition-transform duration-300 group-hover/btn:translate-x-2' />
                    </span>
                  </Button>
                </div>
              </Link>
              <span className='mt-3 whitespace-nowrap text-xs font-medium text-zinc-400'>
                Free forever for tracking progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
