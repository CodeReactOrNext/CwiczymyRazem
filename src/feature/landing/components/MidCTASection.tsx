"use client";

import { Button } from "assets/components/ui/button";
import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Reveal } from "feature/landing/components/Reveal";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * The page's conversion beat, right after the testimonials (the
 * highest-trust moment). Rendered as a glowing glass panel, the same frame
 * language as the product screenshots, so it reads as a highlighted moment
 * instead of another flat black band.
 */
export const MidCTASection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-24'>
      <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
        <Reveal>
          <AuroraGlowFrame>
            <div className='relative overflow-hidden rounded-lg p-10 glass-card sm:p-14'>
              <div className='pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]' />

              <div className='relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center'>
                <div>
                  <h2 className='font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                    Make tonight&apos;s practice count.
                  </h2>
                  <p className='mt-3 text-lg leading-relaxed text-zinc-400'>
                    Create an account and log your first session today.
                  </p>
                </div>
                <div className='flex shrink-0 flex-col items-start gap-2 sm:items-center'>
                  <Link href='/signup'>
                    <Button className='group/btn h-14 rounded-lg border-none bg-white px-8 text-base font-bold text-black transition-colors duration-300 hover:bg-zinc-50 active:scale-[0.98]'>
                      <span className='flex items-center gap-3 whitespace-nowrap'>
                        Start tracking free
                        <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-1.5' />
                      </span>
                    </Button>
                  </Link>
                  <span className='text-xs font-medium text-zinc-400'>
                    Free forever, no paywalls
                  </span>
                </div>
              </div>
            </div>
          </AuroraGlowFrame>
        </Reveal>
      </div>
    </section>
  );
};
