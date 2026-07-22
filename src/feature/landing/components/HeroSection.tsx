import { Button } from "assets/components/ui/button";
import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Logo } from "components/Logo/Logo";
import type { Transition, Variants } from "framer-motion";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";

const StaticCTA = () => (
  <div className='flex flex-col items-center gap-5 lg:items-start'>
    <div className='flex flex-col items-center gap-2 lg:items-start'>
      <div className='flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
        <Link href='/signup'>
          <div className='group relative overflow-hidden rounded-lg p-[1px] transition-transform duration-300 active:scale-[0.98]'>
            <div className='absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100 will-change-transform' />
            <Button className='group/btn relative h-14 overflow-hidden rounded-lg border-none bg-white px-8 text-base font-bold text-black transition-all hover:bg-zinc-50'>
              <span className='relative z-10 flex items-center gap-3 whitespace-nowrap'>
                Start My Guitar Progress
                <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-1.5' />
              </span>
            </Button>
          </div>
        </Link>
      </div>
      <span className='mt-1 whitespace-nowrap text-center text-xs font-medium text-zinc-400 lg:text-left'>
        Free forever for tracking progress
      </span>
    </div>
    <div className='mt-1 flex items-center gap-3 text-sm font-medium text-zinc-400'>
      <Link href='/login' className='transition-colors hover:text-cyan-400'>
        Sign in
      </Link>
      <span aria-hidden>·</span>
      <Link
        href='/how-it-works'
        className='transition-colors hover:text-cyan-400'>
        How it works
      </Link>
    </div>
  </div>
);

const HeroAuthButtons = dynamic(
  () =>
    import("feature/landing/components/HeroAuthButtons").then(
      (m) => m.HeroAuthButtons,
    ),
  { ssr: false, loading: () => <StaticCTA /> },
);

const easeOutExpo: Transition["ease"] = [0.16, 1, 0.3, 1];

const headlineGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const headlineLine: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();

  // Cursor-reactive spotlight instead of generic floating glow orbs. Driven
  // entirely through motion values (never `useState`) so pointer movement
  // never triggers a React re-render.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.32);
  const spotlightX = useTransform(pointerX, (value) => `${value * 100}%`);
  const spotlightY = useTransform(pointerY, (value) => `${value * 100}%`);
  const spotlightBackground = useMotionTemplate`radial-gradient(560px circle at ${spotlightX} ${spotlightY}, rgba(34,211,238,0.14), transparent 65%)`;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  return (
    <section
      onPointerMove={handlePointerMove}
      className='relative flex min-h-[100dvh] flex-col overflow-hidden bg-zinc-950'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,211,238,0.12),transparent_60%)]' />
        {/*
          The tiled guitar/music-icon texture is back in the hero, but this
          time applied to the *entire* section as real ambience rather than
          cropped inside a small floating box (that hard-clipping was the
          bug from the previous round). Kept very faint so it reads as
          texture, not wallpaper.
        */}
        <GuitarPatternBackground opacity={0.025} scale={1.3} />
        {!shouldReduceMotion && (
          <motion.div
            className='absolute inset-0'
            style={{ background: spotlightBackground }}
          />
        )}
      </div>

      <nav className='relative z-30 flex w-full justify-center px-6 py-8 lg:justify-start lg:px-12'>
        <Logo large />
      </nav>

      <div className='relative z-20 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-8 lg:px-12'>
        <div className='grid w-full items-center gap-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12'>
          <motion.div
            className='mx-auto flex max-w-xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left'
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}>
            <motion.h1
              variants={headlineGroup}
              initial={shouldReduceMotion ? "visible" : "hidden"}
              animate='visible'
              className='mb-6 font-landingHeading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl'>
              <motion.span variants={headlineLine} className='block'>
                The guitar practice tracker
              </motion.span>
              <motion.span
                variants={headlineLine}
                className='relative mt-1 inline-block text-cyan-400'>
                built for real progress.
                <motion.span
                  aria-hidden
                  className='absolute inset-x-0 -bottom-1.5 h-[3px] origin-left rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300/80 to-transparent'
                  initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: shouldReduceMotion ? 0 : 0.7,
                    ease: easeOutExpo,
                  }}
                />
              </motion.span>
            </motion.h1>
            <p className='mb-10 max-w-lg text-lg font-medium leading-relaxed tracking-tight text-zinc-400 sm:text-xl'>
              Log sessions, discover song difficulty ratings, and follow a
              structured routine, from beginner to advanced.
            </p>
            <HeroAuthButtons />
          </motion.div>

          {/*
            Rebuilt from scratch: instead of a single flat screenshot sitting
            in a frame, this is a small assembled "dashboard" collage, two
            real product signals (streak/XP, an AI session grade) peeking
            out from behind the main tab view. It reads as an actual product
            in use rather than a static marketing photo, and it's built
            entirely from the app's own data model, not a generic effect.
          */}
          <motion.div
            className='relative mx-auto w-full max-w-md pb-4 pt-6 lg:max-w-none lg:pl-6'
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: shouldReduceMotion ? 0 : 0.35,
              ease: easeOutExpo,
            }}>
            <motion.div
              aria-hidden
              className='absolute -left-4 -top-10 z-0 hidden w-40 -rotate-6 rounded-lg p-4 glass-card sm:block lg:-left-14 lg:-top-12'
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.9 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : 0.75,
                ease: easeOutExpo,
              }}>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-[10px] font-bold text-zinc-400'>
                  Level 12
                </span>
                <Flame className='h-3.5 w-3.5 text-cyan-400' />
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-700/50'>
                <div className='h-full w-2/3 rounded-full bg-cyan-400' />
              </div>
              <div className='mt-2 text-[10px] font-bold text-zinc-400'>
                1,240 XP this month
              </div>
            </motion.div>

            <motion.div
              aria-hidden
              className='absolute -right-3 -top-8 z-0 hidden items-center gap-2 rounded-lg px-4 py-3 glass-card sm:flex lg:-right-8'
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.9 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : 0.9,
                ease: easeOutExpo,
              }}>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400'>
                A-
              </div>
              <div>
                <div className='text-[11px] font-bold text-white'>
                  Session graded
                </div>
                <div className='text-[10px] font-medium text-zinc-400'>
                  by AI, instantly
                </div>
              </div>
            </motion.div>

            <div className='relative z-10'>
              <AuroraGlowFrame>
                <div className='relative -rotate-2 overflow-hidden rounded-lg p-1.5 glass-card'>
                  <div className='relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-950 sm:aspect-video'>
                    <Image
                      src='/images/feature/tabs.webp'
                      alt='Animated Guitar Pro tablature synced with real-time audio playback'
                      fill
                      priority
                      sizes='(min-width: 1024px) 45vw, 90vw'
                      className='object-cover object-center'
                    />
                  </div>
                </div>
                <div className='absolute -bottom-4 -right-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-4 py-2.5'>
                  <span className='relative flex h-2 w-2'>
                    {!shouldReduceMotion && (
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75' />
                    )}
                    <span className='relative inline-flex h-2 w-2 rounded-full bg-cyan-400' />
                  </span>
                  <span className='text-[11px] font-bold text-cyan-400'>
                    Live tab playback
                  </span>
                </div>
              </AuroraGlowFrame>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
