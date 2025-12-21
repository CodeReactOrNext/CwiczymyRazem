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
import { Loader2, ChevronRight } from "lucide-react";

export const HeroSection = () => {
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const userAuth = useAppSelector(selectUserAuth);
  const isLoggedIn = !!userAuth;

  const handleGoogleLogin = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <section className='relative min-h-screen flex items-center overflow-hidden bg-[#0d0d0c]'>
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
            className='text-5xl sm:text-7xl font-bold tracking-tight text-white mb-6 uppercase'>
            The ultimate <br />
            <span className='bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent'>guitar practice tracker</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10 max-w-lg'>
            The intelligent guitar practice app for guitarists. Build your guitar practice routine, track time by skill, and visualize your guitar progress tracking with detailed analytics.
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
            <div className='flex items-center gap-1'>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div 
                  key={i} 
                  className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${i < 5 ? 'bg-zinc-800 text-zinc-400' : 'bg-cyan-500/20 text-cyan-400'}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='flex flex-wrap gap-4 items-center'>
            
            {isLoggedIn ? (
              <Link href='/dashboard' className='w-full sm:w-auto'>
                <Button className='h-12 px-10 rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold text-lg transition-all shadow-lg shadow-cyan-500/40 w-full'>
                  Go to Dashboard <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href='/signup' className='w-full sm:w-auto'>
                  <Button className='h-12 px-10 rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold text-lg transition-all shadow-lg shadow-cyan-500/40 w-full sm:w-auto'>
                    Join Now
                  </Button>
                </Link>
                <Link href='/login' className='w-full sm:w-auto'>
                  <Button variant="outline" className='h-12 px-10 rounded-xl border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 font-bold text-lg transition-all w-full sm:w-auto'>
                    Sign In
                  </Button>
                </Link>
                <Button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleFetching}
                    variant="outline"
                    className="h-12 px-8 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all w-full sm:w-auto flex items-center gap-2"
                >
                    {isGoogleFetching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FcGoogle className="h-5 w-5" />
                    )}
                    Google
                </Button>
              </>
            )}
            
            {!isLoggedIn && (
               <Link href='#features' className="ml-2 hidden sm:block">
                <span className='text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors cursor-pointer'>
                  Learn how it works
                </span>
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0d0c] to-transparent'></div>
    </section>
  );
};
