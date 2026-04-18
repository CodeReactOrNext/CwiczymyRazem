"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import posthog from "posthog-js";

import { StepPath } from "../components/StepPath";
import { StepWelcome } from "../components/StepWelcome";
import { firebaseSaveOnboarding } from "../services/onboarding.service";
import type { OnboardingPath } from "../types";
import { ONBOARDING_TOTAL_STEPS } from "../types";

const OnboardingView = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingId, setLoadingId] = useState<OnboardingPath | null>(null);

  const handleNext = () => {
    if (currentStep < ONBOARDING_TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleChoose = async (id: OnboardingPath, path: string) => {
    setLoadingId(id);
    posthog.capture("onboarding_path_chosen", { path: id });
    await firebaseSaveOnboarding({ chosenPath: id }).catch(() => null);
    await router.push(path);
  };

  return (
    <div className='flex flex-col min-h-[100dvh] bg-background text-foreground overflow-x-hidden'>
      {/* Top Nav */}
      <header className='flex items-center justify-between p-4 md:p-6'>
        <div className='w-8 flex-shrink-0'>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className='p-2 -ml-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 active:bg-white/10'>
              <ArrowLeft className='h-5 w-5' />
            </button>
          )}
        </div>

        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={100}
          height={24}
          className='max-h-5 w-auto block'
          priority
        />

        <div className='w-8 flex-shrink-0 text-right'>
           {currentStep === 0 && (
            <Link
              href='/dashboard'
              className='text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider'>
              Skip
            </Link>
          )}
        </div>
      </header>

      {/* Main Area */}
      <main className='flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-5 py-8'>
        <div className='w-full'>
          {currentStep === 0 && <StepWelcome />}
          {currentStep === 1 && (
            <div className='animate-in fade-in slide-in-from-right-4 duration-300'>
              <StepPath onChoose={handleChoose} loadingId={loadingId} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Fixed Actions */}
      <div className='p-5 md:p-8 w-full max-w-lg mx-auto'>
        {currentStep === 0 ? (
          <button
            onClick={handleNext}
            className='w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-zinc-950 px-6 py-4 text-[15px] font-black transition-all active:scale-[0.98] drop-shadow-xl'>
            Get Started
            <ArrowRight className='h-5 w-5' />
          </button>
        ) : (
          <div className='h-14 flex items-center justify-center'>
            <div className='flex gap-2 items-center'>
              {[...Array(ONBOARDING_TOTAL_STEPS)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep ? "w-6 bg-white" : "w-1.5 bg-white/20"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default OnboardingView;
