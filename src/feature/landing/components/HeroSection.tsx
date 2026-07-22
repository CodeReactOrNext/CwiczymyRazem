import { Button } from "assets/components/ui/button";
import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Logo } from "components/Logo/Logo";
import type { Transition, Variants } from "framer-motion";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";

const StaticCTA = () => (
  <div className='flex flex-col items-center gap-5'>
    <div className='flex flex-col items-center gap-2'>
      <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
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
      <span className='mt-1 whitespace-nowrap text-center text-xs font-medium text-zinc-400'>
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
          Diagonal accent stripes instead of the tiled guitar-icon texture.
          The tiled pattern used to cover the entire hero as a full-bleed
          "wallpaper", which read as noise rather than atmosphere. This is
          confined to the right two-thirds behind the tab screenshot, fades
          out toward the headline via the mask, and echoes the diagonal
          stripe motif from the Rocksmith reference the client pointed to.
        */}
        <div
          aria-hidden
          className='absolute inset-y-0 right-0 w-2/3 opacity-[0.06] [mask-image:linear-gradient(to_left,black,transparent_85%)]'>
          <div className='absolute inset-0 -rotate-6 bg-[repeating-linear-gradient(115deg,rgba(34,211,238,0.9)_0px,rgba(34,211,238,0.9)_1.5px,transparent_1.5px,transparent_46px)]' />
        </div>
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
        <div className='grid w-full items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12'>
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

          <motion.div
            className='relative mx-auto w-full max-w-md lg:max-w-none'
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: shouldReduceMotion ? 0 : 0.35,
              ease: easeOutExpo,
            }}>
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};
