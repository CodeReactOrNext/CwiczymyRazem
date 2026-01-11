"use client";

import { Button } from "assets/components/ui/button";
import { Logo } from "components/Logo/Logo";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Zap, Calendar, Trophy, Star } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { Loader2, ChevronRight, Check, Sparkles } from "lucide-react";
import { FaFire } from "react-icons/fa";
import { cn } from "assets/lib/utils";

export const HeroSection = () => {
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const userAuth = useAppSelector(selectUserAuth);
  const isLoggedIn = !!userAuth;

  const handleGoogleLogin = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <section className='relative min-h-screen flex items-center overflow-hidden bg-[#000]'>
      <GoogleOneTap />
      {/* Subtle background gradient */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-[#0d0d0c] to-[#0d0d0c]'></div>
      
      {/* Hero Image */}
      <div className='absolute right-0 top-0 h-full w-full sm:w-2/3 lg:w-3/5 select-none pointer-events-none opacity-60'>
        <div className='absolute inset-0 bg-gradient-to-r from-[#0d0d0c] via-[#0d0d0c]/30 to-transparent z-10'></div>
        <div className='absolute inset-0 bg-gradient-to-b from-[#0d0d0c]/10 via-transparent to-[#0d0d0c] z-10'></div>
        <Image
          src='/images/hero-image.png'
          alt='Guitarist'
          fill
          className='object-cover object-center grayscale-[30%]'
          priority
        />
      </div>

      <div className='relative z-20 mx-auto max-w-7xl px-6 lg:px-8 w-full'>
        {/* Top bar - Navigation */}
        <nav className='absolute top-0 left-0 right-0 py-8 px-6 lg:px-8 z-30'>
          <div className='max-w-7xl mx-auto flex items-center justify-between'>
            <Logo large />
          </div>
        </nav>

        <div className='max-w-2xl lg:max-w-3xl pt-32 sm:pt-40'>
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6'>
            The ultimate <br />
            <span className='bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent'>guitar practice tracker</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10 max-w-xl'>
            The intelligent guitar practice app for guitarists. Build your guitar practice routine, track time by skill, and visualize your progress with detailed analytics.
          </motion.p>

          {/* Stats preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className='flex flex-wrap items-center gap-4 sm:gap-6 mb-10'
          >
            <div className='flex items-center gap-2'>
              <Star className='w-5 h-5 text-amber-400' />
              <span className='text-white font-semibold'>2934</span>
              <span className='text-zinc-500 text-sm'>points</span>
            </div>
            <div className='flex items-center gap-2'>
              <Zap className='w-5 h-5 text-cyan-400' />
              <span className='text-white font-semibold'>2693h</span>
              <span className='text-zinc-500 text-sm'>practiced</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-500 text-emerald-400">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                    <Check className="w-3 h-3" />
                </div>
                <span className='text-[10px] font-bold uppercase tracking-wider'>
                  Goal met
                </span>
              </div>
              
              <div className='flex h-10 items-center gap-3 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm'>
                <div className="flex items-center gap-1.5 shrink-0 px-1">
                    <FaFire className="text-xl text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                    <span className="text-sm font-black text-white">1</span>
                </div>
                <div className='flex items-center gap-1 border-l border-white/5 pl-2'>
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                        const isActive = index === 0;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-[4px] text-[9px] font-bold transition-all duration-300",
                                    isActive
                                        ? "bg-white text-zinc-900 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                        : "bg-zinc-800 text-zinc-600"
                                )}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='flex flex-wrap gap-4 items-center'>
            
            {isLoggedIn ? (
              <Link href='/dashboard' className='w-full sm:w-auto'>
                <Button className='h-12 px-10  bg-white text-black hover:bg-zinc-200 font-semibold text-base transition-all w-full'>
                  Go to Dashboard <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                        <Link href='/signup' className='w-full sm:w-auto'>
                        <Button className='h-12 px-10 bg-white text-black hover:bg-zinc-200 font-semibold text-base transition-all w-full sm:w-auto shadow-lg shadow-white/5'>
                            Join Now
                        </Button>
                        </Link>
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleFetching}
                            variant="outline"
                            className="h-12 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-semibold text-base transition-all w-full sm:w-auto flex items-center gap-2"
                        >
                            {isGoogleFetching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <FcGoogle className="h-5 w-5" />
                            )}
                            Google
                        </Button>
                    </div>
                    
                    <div className="flex flex-col items-center sm:items-start gap-1 mt-1">
                        <p className="text-zinc-500 text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-zinc-300 hover:text-cyan-400 font-bold transition-colors">
                                Sign in
                            </Link>
                        </p>

                        <Link href="/guitar-practice-builder" className="mt-4 flex items-center gap-2 group/gen">
                            <span className="text-cyan-400/80 group-hover/gen:text-cyan-400 text-sm font-semibold transition-colors">
                                Generate Custom Practice Plan
                            </span>
                            <Sparkles className="w-4 h-4 text-cyan-400/60 group-hover/gen:text-cyan-400 group-hover/gen:rotate-12 transition-all" />
                        </Link>
                        
                        {!isLoggedIn && (
                           <Link href='#features' className="mt-2 group">
                            <span className='text-zinc-600 group-hover:text-zinc-400 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2'>
                              <div className="h-px w-8 bg-zinc-800 group-hover:bg-cyan-500/50 transition-colors" />
                              Learn how it works
                              <div className="h-px w-8 bg-zinc-800 group-hover:bg-cyan-500/50 transition-colors" />
                            </span>
                          </Link>
                        )}
                    </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0d0c] to-transparent'></div>
    </section>
  );
};
