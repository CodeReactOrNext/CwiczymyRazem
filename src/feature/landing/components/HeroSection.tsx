import { Button } from "assets/components/ui/button";
import { Logo } from "components/Logo/Logo";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

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

export const HeroSection = () => {
  return (
    <section className='relative flex min-h-[90vh] flex-col items-center justify-center bg-zinc-950'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0 select-none opacity-50'>
          <div className='absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black'></div>
          <Image
            src='/images/hero-image.webp'
            alt='Guitarist practicing'
            fill
            className='object-cover object-center grayscale'
            priority
          />
        </div>
        <div className='absolute inset-0 hidden md:block'>
          <div className='absolute -left-[10%] -top-[15%] h-[70%] w-[80%] animate-glow-float-1 rounded-full bg-cyan-500/30 blur-[100px] will-change-transform' />
          <div className='absolute -bottom-[15%] -right-[10%] h-[70%] w-[80%] animate-glow-float-2 rounded-full bg-cyan-500/20 blur-[100px] will-change-transform' />
        </div>
      </div>

      <nav className='relative z-30 flex w-full justify-center px-6 py-8 lg:px-8'>
        <Logo large />
      </nav>

      <div className='relative z-20 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 text-center lg:px-8'>
        <motion.div
          className='mx-auto flex max-w-4xl flex-col items-center py-8 sm:py-12'
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className='mb-8 font-landingHeading text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-8xl'>
            The guitar practice tracker <br />
            <span className='text-cyan-400'>built for real progress.</span>
          </h1>
          <p className='mb-12 max-w-2xl text-xl font-medium leading-relaxed tracking-tight text-zinc-400 sm:text-2xl'>
            Log sessions, discover song difficulty ratings, and follow a{" "}
            <br className='hidden sm:block' />
            structured routine, from beginner to advanced.
          </p>
          <HeroAuthButtons />
        </motion.div>
      </div>
    </section>
  );
};
