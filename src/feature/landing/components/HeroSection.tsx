"use client";

import { Button } from "assets/components/ui/button";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Logo } from "components/Logo/Logo";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { Loader2, LayoutDashboard } from "lucide-react";
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
  const { status } = useSession();
  const userAuth = useAppSelector(selectUserAuth);
  
  const isSyncing = status === "authenticated" && !userAuth;
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
          className="absolute -top-[15%] -left-[10%] w-[120%] sm:w-[80%] h-[70%] bg-cyan-500/30 blur-[130px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: ['15%', '-15%'],
            y: ['10%', '-10%'],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            repeatType: "mirror",
            ease: "easeInOut" 
          }}
          className="absolute -bottom-[15%] -right-[10%] w-[120%] sm:w-[80%] h-[70%] bg-teal-500/20 blur-[130px] rounded-full"
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
            <span className='bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent'>Start seeing it.</span>
          </h1>

          <p className='max-w-2xl text-xl sm:text-2xl text-zinc-400 font-medium leading-relaxed mb-12 tracking-tight'>
            Riff Quest turns your practice sessions into visible growth. <br className="hidden sm:block"/>
            Built for guitarists who want to practice smarter.
          </p>

          {/* Action Group */}
          <div className='flex flex-col items-center gap-8'>
            {isSyncing ? (
               <div className="h-14 w-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400 opacity-50" />
               </div>
            ) : isLoggedIn ? (
              <div className="flex flex-col items-center">
                <div className="relative p-[1px] overflow-hidden rounded-lg group">
                  {/* Vibrant Rotating Border Beam */}
                  <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)]" />
                  
                  <Button
                    onClick={handleGoToDashboard}
                    disabled={isDashboardLoading}
                    className='relative h-14 px-10 bg-zinc-950 hover:bg-zinc-900 text-white border-none font-bold text-lg transition-all rounded-[7px] shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] overflow-hidden'
                  >
                    {isDashboardLoading ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <span className='relative z-10 flex items-center gap-2'>
                        <LayoutDashboard className='w-5 h-5 transition-transform group-hover:scale-110' />
                        Go to Dashboard
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href='/signup'>
                    <div className="relative p-[1px] overflow-hidden rounded-lg group">
                        {/* Vibrant Rotating Border Beam - Updated for White Button */}
                        <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                        
                        <Button className='relative h-14 px-10 bg-white hover:bg-zinc-100 text-black border-none font-bold text-lg transition-all rounded-[7px] shadow-2xl overflow-hidden'>
                            <span className="relative z-10">Start Free</span>
                        </Button>
                    </div>
                  </Link>
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleFetching}
                    className="h-14 px-8 bg-black text-white hover:bg-zinc-900 border border-white/10 font-semibold text-base transition-all rounded-lg flex items-center gap-3 shadow-lg"
                  >
                    <FcGoogle className="h-5 w-5" /> Continue with Google
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 text-white text-sm font-bold uppercase tracking-widest">
                  <Link href="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <Link href="#features" className="hover:text-cyan-400 transition-colors">How it works</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
