import { Button } from "assets/components/ui/button";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Logo } from "components/Logo/Logo";
import { HERO_STATS } from "feature/landing/data/heroStats";
import type { Transition, Variants } from "framer-motion";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

const StaticCTA = () => (
  <div className='flex flex-col items-center gap-2'>
    <Link href='/signup'>
      <Button className='group/btn h-14 rounded-lg border-none bg-white px-8 text-base font-bold text-black transition-colors duration-300 hover:bg-zinc-50 active:scale-[0.98]'>
        <span className='flex items-center gap-3 whitespace-nowrap'>
          Start tracking free
          <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-1.5' />
        </span>
      </Button>
    </Link>
    <span className='mt-1 whitespace-nowrap text-xs font-medium text-zinc-400'>
      Free forever, no paywalls
    </span>
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

/**
 * Perspective stage: the dashboard window tilts back in 3D while two real
 * UI collages (borrowed from the how-it-works assets) float above it on
 * separate depth planes. The tilt is static CSS, so reduced motion only
 * skips the entrance animation, not the composition.
 */
/**
 * Count-up stat driven by a motion value rendered straight into the DOM,
 * so the rolling number never re-renders the React tree.
 */
const StatCounter = ({
  value,
  label,
  delay,
  shouldReduceMotion,
}: {
  value: number;
  label: string;
  delay: number;
  shouldReduceMotion: boolean;
}) => {
  const count = useMotionValue(0);
  // Stats are rounded down before being written to heroStats.ts, so the
  // trailing "+" signals a floor, not a fake-precise exact count.
  const display = useTransform(
    count,
    (v) => `${Math.round(v).toLocaleString("en-US")}+`,
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(value);
      return undefined;
    }
    const controls = animate(count, value, {
      duration: 1.8,
      delay,
      ease: easeOutExpo,
    });
    return () => controls.stop();
  }, [count, value, delay, shouldReduceMotion]);

  return (
    <div className='flex flex-col items-center gap-1'>
      <motion.span className='font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
        {display}
      </motion.span>
      <span className='text-sm font-medium text-zinc-400'>{label}</span>
    </div>
  );
};

const HeroPerspectiveStage = ({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean;
}) => (
  <div className='relative'>
    <div className='[perspective:1800px]'>
      <div className='[transform:rotateX(16deg)]'>
        <Link href='/dashboard' className='block'>
          <div className='overflow-hidden rounded-xl bg-zinc-950 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6),0_0_80px_rgba(34,211,238,0.05)] ring-1 ring-white/10'>
            <Image
              src='/images/hero-dashboard.webp'
              alt='Riff Quest dashboard with daily practice, quests and activity heatmap'
              width={1416}
              height={917}
              priority
              className='h-auto w-full'
            />
          </div>
        </Link>
      </div>
    </div>

    {/* The floating collages sit OUTSIDE the tilted plane on purpose: they
        stay flat and screen-facing, which is what makes them read as
        separate cards hovering above the receding dashboard. Each one bobs
        slowly on its own phase to sell the hover. */}
    <motion.div
      aria-hidden
      className='absolute -left-6 bottom-[34%] hidden w-[42%] sm:block lg:-left-16'
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: shouldReduceMotion ? 0 : 0.7,
        ease: easeOutExpo,
      }}>
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
        <Image
          src='/images/how-it-works/step-2.webp'
          alt=''
          width={956}
          height={534}
          className='h-auto w-full drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]'
        />
      </motion.div>
    </motion.div>
    <motion.div
      aria-hidden
      className='absolute -right-4 -top-10 hidden w-[45%] sm:block lg:-right-16'
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: shouldReduceMotion ? 0 : 0.85,
        ease: easeOutExpo,
      }}>
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}>
        <Image
          src='/images/how-it-works/step-1.webp'
          alt=''
          width={906}
          height={466}
          className='h-auto w-full drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]'
        />
      </motion.div>
    </motion.div>
  </div>
);

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className='relative flex min-h-[100dvh] flex-col overflow-hidden bg-zinc-950'>
      {/* Cortex-style spotlight: one concentrated beam from the top edge,
          one faint wide wash so the falloff stays soft. */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_-15%,rgba(34,211,238,0.26),transparent_65%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_-10%,rgba(34,211,238,0.08),transparent_60%)]' />
        <GuitarPatternBackground opacity={0.02} scale={1.3} />
      </div>

      <nav className='relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-12'>
        <Logo />
        <div className='flex items-center gap-6 text-sm font-medium text-zinc-400'>
          <Link
            href='/how-it-works'
            className='transition-colors hover:text-white'>
            How it works
          </Link>
          <Link href='/login' className='transition-colors hover:text-white'>
            Sign in
          </Link>
        </div>
      </nav>

      <div className='relative z-20 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-8 text-center sm:pt-12 lg:px-12'>
        <motion.div
          className='flex flex-col items-center'
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
              className='block text-cyan-400'>
              built for real progress
            </motion.span>
          </motion.h1>
          <p className='mx-auto mb-10 max-w-xl text-lg font-medium leading-relaxed tracking-tight text-zinc-400 sm:text-xl'>
            Log sessions, discover song difficulty ratings, and follow a
            structured routine, from beginner to advanced.
          </p>
          <HeroAuthButtons />
        </motion.div>
      </div>

      <motion.div
        className='relative z-10 mx-auto mt-14 w-full max-w-6xl flex-1 px-6 sm:mt-16 lg:px-10'
        initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: shouldReduceMotion ? 0 : 0.35,
          ease: easeOutExpo,
        }}>
        <HeroPerspectiveStage shouldReduceMotion={!!shouldReduceMotion} />
      </motion.div>

      <motion.div
        className='relative z-20 mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-24 pt-16 sm:flex-row sm:justify-center sm:gap-20 sm:pt-20'
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: shouldReduceMotion ? 0 : 0.7,
          ease: easeOutExpo,
        }}>
        {HERO_STATS.map((stat, i) => (
          <StatCounter
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delay={0.9 + i * 0.15}
            shouldReduceMotion={!!shouldReduceMotion}
          />
        ))}
      </motion.div>
    </section>
  );
};
