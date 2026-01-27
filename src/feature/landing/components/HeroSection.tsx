"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Logo } from "components/Logo/Logo";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { Music2, Zap } from "lucide-react";
import { ChevronRight, Loader2, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaFire } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const HeroSection = () => {
  const router = useRouter();
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const userAuth = useAppSelector(selectUserAuth);
  const isLoggedIn = !!userAuth;

  const handleGoToDashboard = () => {
    setIsDashboardLoading(true);
    router.push("/dashboard");
  };

  const handleGoogleLogin = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <section className='relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#000]'>
      <GoogleOneTap />
      
      {/* Hero Image - Lightened */}
      <div className='absolute inset-0 select-none pointer-events-none opacity-50'>
        <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10'></div>
        <Image
          src='/images/hero-image.png'
          alt='Guitarist practicing'
          fill
          className='object-cover object-center grayscale'
          priority
        />
      </div>

      {/* Floating Glow Animation (Flow) - ULTRA INTENSE */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: ['-15%', '15%'],
            y: ['-10%', '10%'],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            repeatType: "mirror",
            ease: "easeInOut" 
          }}
          className="absolute -top-[15%] -left-[10%] w-[120%] sm:w-[80%] h-[70%] bg-cyan-500/30 blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: ['15%', '-15%'],
            y: ['10%', '-10%'],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            repeatType: "mirror",
            ease: "easeInOut" 
          }}
          className="absolute -bottom-[15%] -right-[10%] w-[120%] sm:w-[80%] h-[70%] bg-teal-500/20 blur-[150px] rounded-full"
        />
      </div>

      <div className='relative z-20 mx-auto max-w-7xl px-6 lg:px-8 w-full text-center'>
        {/* Navigation - Clean & Floated */}
        <nav className='absolute top-[-10vh] left-0 right-0 py-8 px-6 lg:px-8 z-30 flex justify-center'>
           <Logo large />
        </nav>

        <div className='max-w-4xl mx-auto flex flex-col items-center pt-20'>
          {/* Header - Reduced Size */}
          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-8 font-display'>
            Stop guessing. <br />
            <span className='text-zinc-400'>Start seeing it.</span>
          </h1>

          <p className='max-w-2xl text-xl sm:text-2xl text-zinc-400 font-medium leading-relaxed mb-12 tracking-tight'>
            Riff Quest turns your practice sessions into visible growth. <br className="hidden sm:block"/>
            Built for guitarists who want to practice smarter.
          </p>

          {/* Action Group */}
          <div className='flex flex-col items-center gap-8'>
            {isLoggedIn ? (
              <Button
                onClick={handleGoToDashboard}
                disabled={isDashboardLoading}
                className='h-14 px-10 bg-white text-black hover:bg-zinc-200 font-bold text-lg transition-all rounded-lg'
              >
                {isDashboardLoading ? <Loader2 className='animate-spin' /> : "Go to Dashboard"}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href='/signup'>
                    <Button className='h-14 px-12 bg-white hover:bg-zinc-200 text-black font-bold text-lg transition-all rounded-lg shadow-2xl shadow-white/10'>
                      Start Free
                    </Button>
                  </Link>
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleFetching}
                    className="h-14 px-8 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-base transition-all rounded-lg flex items-center gap-3"
                  >
                    <FcGoogle className="h-5 w-5" /> Continue with Google
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 text-zinc-400 text-sm font-bold uppercase tracking-widest">
                  <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                  <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                  <Link href="#features" className="hover:text-white transition-colors">How it works</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
