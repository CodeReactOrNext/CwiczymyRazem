import { Button } from "assets/components/ui/button";
import { Logo } from "components/Logo/Logo";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const StaticCTA = () => (
  <div className="flex flex-col items-center gap-6">
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href='/signup'>
          <div className="relative p-[1px] overflow-hidden rounded-lg group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] will-change-transform bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
            <Button className='relative h-14 px-8 bg-white hover:bg-zinc-50 text-black border-none font-bold text-base transition-all rounded-[7px] shadow-2xl overflow-hidden group/btn'>
              <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
                Start My Guitar Progress
                <ArrowRight className="w-5 h-5 text-orange-500 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Button>
          </div>
        </Link>
      </div>
      <span className="text-xs text-zinc-400 font-medium whitespace-nowrap text-center mt-1">
        Free forever for tracking progress
      </span>
    </div>
    <div className="flex items-center gap-6 text-white text-sm font-bold uppercase tracking-widest mt-2">
      <Link href="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
      <span className="w-1 h-1 rounded-full bg-white/20"></span>
      <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">How it works</Link>
    </div>
  </div>
);

const HeroAuthButtons = dynamic(
  () => import("feature/landing/components/HeroAuthButtons").then((m) => m.HeroAuthButtons),
  { ssr: false, loading: () => <StaticCTA /> }
);

export const HeroSection = () => {
  return (
    <section className='relative min-h-[90vh] flex flex-col items-center justify-center bg-[#000]'>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className='absolute inset-0 select-none opacity-50'>
          <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10'></div>
          <Image
            src='/images/hero-image.webp'
            alt='Guitarist practicing'
            fill
            className='object-cover object-center grayscale'
            priority
          />
        </div>
        <div className="absolute inset-0 hidden md:block">
          <div className="animate-glow-float-1 will-change-transform absolute -top-[15%] -left-[10%] w-[80%] h-[70%] bg-cyan-500/30 blur-[100px] rounded-full" />
          <div className="animate-glow-float-2 will-change-transform absolute -bottom-[15%] -right-[10%] w-[80%] h-[70%] bg-orange-500/25 blur-[100px] rounded-full" />
        </div>
      </div>

      <nav className='relative z-30 w-full py-8 px-6 lg:px-8 flex justify-center'>
        <Logo large />
      </nav>

      <div className='relative z-20 mx-auto max-w-7xl px-6 lg:px-8 w-full text-center flex-1 flex items-center justify-center'>
        <div className='max-w-4xl mx-auto flex flex-col items-center py-8 sm:py-12'>
          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-8 font-display'>
            The guitar practice tracker <br />
            <span className='bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent'>built for real progress.</span>
          </h1>
          <p className='max-w-2xl text-xl sm:text-2xl text-zinc-400 font-medium leading-relaxed mb-12 tracking-tight'>
            Log sessions, discover song difficulty ratings, and follow a <br className="hidden sm:block"/>
            structured routine — from beginner to advanced.
          </p>
          <HeroAuthButtons />
        </div>
      </div>
    </section>
  );
};
