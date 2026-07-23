"use client";

import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className='relative overflow-hidden bg-zinc-950 pb-12 pt-24'>
      {/* Background decoration */}
      <div className='absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[120px]'></div>

      <GuitarPatternBackground opacity={0.03} />

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-16 grid grid-cols-1 gap-16 md:grid-cols-12 lg:gap-24'>
          {/* Brand Column */}
          <div className='space-y-10 md:col-span-5'>
            <div className='space-y-6'>
              <Image
                src='/images/longlightlogo.svg'
                alt='Riff Quest'
                width={180}
                height={40}
                className='h-10 w-auto'
              />
              <p className='max-w-sm text-lg font-medium leading-relaxed text-zinc-400'>
                A practice tracker for guitarists who want proof they are
                improving.
              </p>
              <p className='max-w-sm text-sm font-medium leading-relaxed text-zinc-400'>
                Riff Quest is{" "}
                <span className='font-bold text-zinc-300'>100% free</span>, no
                subscriptions, no paywalls. It stays free thanks to the
                community, funded entirely through{" "}
                <span className='font-bold text-amber-400'>
                  Buy Me a Coffee
                </span>
                . If it helps your playing, you can chip in to keep it growing.
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-4'>
              <Link
                href='https://discord.gg/6yJmsZW2Ne'
                target='_blank'
                rel='noopener noreferrer'>
                <div className='flex items-center gap-3 rounded-lg bg-zinc-900/60 px-5 py-2.5 text-xs font-bold text-[#5865F2] transition-background hover:bg-zinc-800/60'>
                  <svg className='h-5 w-5 fill-current' viewBox='0 0 24 24'>
                    <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
                  </svg>
                  Discord
                </div>
              </Link>

              <Link
                href='https://buymeacoffee.com/riffquest'
                target='_blank'
                rel='noopener noreferrer'>
                <div className='flex items-center gap-3 rounded-lg bg-zinc-900/60 px-5 py-2.5 text-xs font-bold text-amber-400 transition-background hover:bg-zinc-800/60'>
                  <svg
                    className='h-5 w-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M17 8h1a4 4 0 0 1 0 8h-1' />
                    <path d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z' />
                    <line x1='6' x2='6' y1='2' y2='4' />
                    <line x1='10' x2='10' y1='2' y2='4' />
                    <line x1='14' x2='14' y1='2' y2='4' />
                  </svg>
                  Buy me a coffee
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className='grid grid-cols-2 gap-12 md:col-span-7 md:grid-cols-3'>
            <div className='space-y-6'>
              <h4 className='text-xs font-bold text-white/40'>Community</h4>
              <ul className='space-y-4'>
                <li>
                  <Link
                    href='/blog'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Blog{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/blog/best-app-for-guitar-practice'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Best Guitar Learning Apps 2026{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/song-library'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Song Library{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/about'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    About{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/how-it-works'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    How it works{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
              </ul>
            </div>
            <div className='space-y-6'>
              <h4 className='text-xs font-bold text-white/40'>
                Practice guides
              </h4>
              <ul className='space-y-4'>
                <li>
                  <Link
                    href='/beginner-guitar-exercises'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Beginner Exercises{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/guitar-speed-hand-synchronization-exercises'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Speed & Hand Sync{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/guitar-scale-practice-routine'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Scale Practice Routine{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/intermediate-guitar-practice-routine'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Intermediate Routine{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/daily-guitar-practice-plan'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Daily Practice Plan{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
              </ul>
            </div>
            <div className='space-y-6'>
              <h4 className='text-xs font-bold text-white/40'>Support</h4>
              <ul className='space-y-4'>
                <li>
                  <Link
                    href='/contact'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Contact{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/privacy-policy'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Privacy Policy{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
                <li>
                  <Link
                    href='/terms-of-service'
                    className='group flex items-center text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
                    Terms of Service{" "}
                    <ChevronRight className='ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100' />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-6 pt-8 sm:flex-row'>
          <p className='text-xs font-bold text-zinc-500'>© 2026 Riff Quest</p>
        </div>
      </div>
    </footer>
  );
};
