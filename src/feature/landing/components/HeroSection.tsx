"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Logo } from "components/Logo/Logo";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { Zap } from "lucide-react";
import { ChevronRight, Loader2 } from "lucide-react";
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

        <div className='max-w-2xl lg:max-w-4xl pt-32 sm:pt-40'>
          {/* Header & Description Group */}
          <div className="space-y-4 mb-10">
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]'>
              Build a daily guitar practice <br />
              <span className='bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent italic'>routine that actually works</span>
            </h1>

            <div className="max-w-2xl space-y-3">
              <h2 className='text-lg sm:text-xl font-bold text-zinc-200 leading-snug'>
                Track your practice, skills, and song difficulty — and stay motivated without rigid plans or pressure.
              </h2>
              <p className='text-base text-zinc-500 leading-relaxed font-semibold'>
                A free guitar practice app for guitarists who struggle with motivation and visible progress.
              </p>
            </div>
          </div>

          {/* Featured Stat & Streak */}
          <div className='flex flex-wrap items-center gap-12 mb-12'>
            {/* Prominent Stat */}
            <div className='flex items-center gap-4 group cursor-default'>
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                <Zap className='w-8 h-8 text-cyan-400 relative z-10' />
              </div>
              <div className="flex flex-col">
                <span className='text-white font-black text-3xl leading-none tracking-tight'>10,000h+</span>
                <span className='text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2'>Practice Hours Logged</span>
              </div>
            </div>

            {/* Streak Counter */}
            <div className='flex items-center gap-4'>
              <div className='flex h-12 items-center gap-3 rounded-2xl bg-zinc-900/30 px-4 shadow-sm backdrop-blur-md border border-white/5'>
                <div className="flex items-center gap-2 shrink-0">
                    <FaFire className="text-xl text-orange-500" />
                    <span className="text-base font-black text-white">12</span>
                </div>
                <div className='flex items-center gap-1.5 border-l border-white/10 pl-3'>
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                        const activeDays = [0, 1, 3, 4, 5, 6];
                        const isActive = activeDays.includes(index);
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-black transition-all duration-300",
                                    isActive
                                        ? "bg-white text-zinc-900"
                                        : "bg-zinc-800/40 text-zinc-700"
                                )}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Group */}
          <div className='flex flex-col gap-6'>
            {isLoggedIn ? (
              <Button
                onClick={handleGoToDashboard}
                disabled={isDashboardLoading}
                className='h-12 px-8 bg-white text-black hover:bg-zinc-200 font-black text-base transition-all w-full sm:w-56 shadow-xl shadow-white/5 whitespace-nowrap'
              >
                {isDashboardLoading ? (
                  <>
                    Loading... <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                  </>
                ) : (
                  <>
                    Go to Dashboard <ChevronRight className='ml-1 w-4 h-4' />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Primary Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link href='/signup' className='flex-1 sm:flex-none'>
                    <Button className='h-14 px-10 bg-cyan-500 text-black hover:bg-cyan-400 font-black text-lg transition-all w-full sm:w-auto shadow-lg shadow-cyan-500/10 border-none rounded-xl whitespace-nowrap'>
                      Start practicing for free
                    </Button>
                  </Link>
                  
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleFetching}
                    variant="outline"
                    className="h-14 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-base transition-all rounded-xl flex items-center justify-center gap-3 sm:w-64 whitespace-nowrap"
                  >
                    {isGoogleFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FcGoogle className="h-5 w-5" />
                    )}
                    Sign in with Google
                  </Button>
                </div>

                {/* Secondary Info */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                      <span>Already have an account?</span>
                      <Link href="/login" className="text-white hover:text-cyan-400 font-black transition-all">
                        Sign in
                      </Link>
                    </div>

                    <Link href='#features' className="group flex items-center gap-2">
                        <span className='text-zinc-600 group-hover:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2'>
                          <div className="h-px w-4 bg-zinc-800 group-hover:bg-cyan-500/50 transition-colors" />
                          How it works
                        </span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0d0c] to-transparent'></div>
    </section>
  );
};
