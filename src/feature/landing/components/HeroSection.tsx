"use client";

import { Button } from "assets/components/ui/button";
import { Logo } from "components/Logo/Logo";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { ArrowRight,LayoutDashboard, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
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
    <section className='relative min-h-[90vh] flex flex-col items-center justify-center bg-[#000]'>
      <GoogleOneTap />

      {/* Background layers - overflow-hidden scoped here, not on the section */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Hero Image - Lightened */}
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

        {/* Floating Glow Animation (Flow) - hidden on mobile */}
        <div className="absolute inset-0 hidden md:block">
          <div className="animate-glow-float-1 will-change-transform absolute -top-[15%] -left-[10%] w-[80%] h-[70%] bg-cyan-500/30 blur-[100px] rounded-full" />
          <div className="animate-glow-float-2 will-change-transform absolute -bottom-[15%] -right-[10%] w-[80%] h-[70%] bg-orange-500/25 blur-[100px] rounded-full" />
        </div>
      </div>

      {/* Navigation - positioned relative to section */}
      <nav className='relative z-30 w-full py-8 px-6 lg:px-8 flex justify-center'>
        <Logo large />
      </nav>

      <div className='relative z-20 mx-auto max-w-7xl px-6 lg:px-8 w-full text-center flex-1 flex items-center justify-center'>
        <div className='max-w-4xl mx-auto flex flex-col items-center py-8 sm:py-12'>
          {/* Header - Reduced Size */}
          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-8 font-display'>
            The guitar practice tracker <br />
            <span className='bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent'>built for real progress.</span>
          </h1>

          <p className='max-w-2xl text-xl sm:text-2xl text-zinc-400 font-medium leading-relaxed mb-12 tracking-tight'>
            Log sessions, discover song difficulty ratings, and follow a <br className="hidden sm:block"/>
            structured routine — from beginner to advanced.
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
                  {!isDashboardLoading && <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] will-change-transform bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)]" />}
                  
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
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link href='/signup'>
                        <div className="relative p-[1px] overflow-hidden rounded-lg group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            {/* Vibrant Rotating Border Beam - Restored and Working */}
                            <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] will-change-transform bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                            
                            <Button className='relative h-14 px-8 bg-white hover:bg-zinc-50 text-black border-none font-bold text-base transition-all rounded-[7px] shadow-2xl overflow-hidden group/btn'>
                                <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
                                  Start My Guitar Progress 
                                  <ArrowRight className="w-5 h-5 text-orange-500 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                                </span>
                            </Button>
                        </div>
                      </Link>
                      <Button
                        onClick={handleGoogleLogin}
                        disabled={isGoogleFetching}
                        className="h-14 px-8 bg-black text-white hover:bg-zinc-900 border border-white/10 font-semibold text-base transition-all rounded-lg flex items-center gap-3 shadow-lg"
                      >
                        <FcGoogle className="h-5 w-5 mr-2" /> Continue with Google
                      </Button>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium whitespace-nowrap text-center mt-1">Free forever for tracking progress</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-white text-sm font-bold uppercase tracking-widest mt-2">
                    <Link href="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">How it works</Link>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
