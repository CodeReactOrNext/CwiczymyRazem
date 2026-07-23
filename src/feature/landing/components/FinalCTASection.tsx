"use client";

import { Button } from "assets/components/ui/button";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const FinalCTASection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-28'>
      <div className='absolute inset-0 z-0 overflow-hidden'>
        <div className='pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
        <GuitarPatternBackground opacity={0.02} />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='flex flex-col items-center text-center'>
          <div className='max-w-4xl'>
            <h2 className='mb-8 font-landingHeading text-5xl font-bold leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl'>
              Pick up the guitar. <br />
              <span className='text-cyan-400'>We track the rest.</span>
            </h2>

            <p className='mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-zinc-400 sm:text-xl'>
              Join guitarists who already turned practice into progress.
            </p>

            <div className='flex flex-col items-center'>
              <Link href='/signup'>
                <Button className='group/btn h-14 w-full rounded-lg border-none bg-white px-10 text-base font-bold text-black transition-colors duration-300 hover:bg-zinc-50 active:scale-[0.98] sm:w-auto'>
                  <span className='flex items-center gap-3'>
                    Start tracking free
                    <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-2' />
                  </span>
                </Button>
              </Link>
              <span className='mt-3 whitespace-nowrap text-xs font-medium text-zinc-400'>
                Free forever, no paywalls
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
