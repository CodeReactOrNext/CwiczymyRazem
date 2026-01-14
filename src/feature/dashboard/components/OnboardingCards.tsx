import { Card } from "assets/components/ui/card";
import { Button } from "assets/components/ui/button";
import { useRouter } from "next/router";
import { Play, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "assets/lib/utils";

export const OnboardingCards = () => {
    const router = useRouter();
    const [loadingCard, setLoadingCard] = useState<string | null>(null);

    const handleNavigation = async (path: string, cardId: string) => {
        setLoadingCard(cardId);
        await router.push(path);
    };

    return (
        <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
            <div className={cn(
                "font-openSans relative flex h-full transform cursor-pointer overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-100 hover:shadow-xl hover:ring-2 sm:p-4",
                "hover:ring-cyan-500/40",
                "lg:col-span-2"
            )}
            onClick={() => handleNavigation("/timer", "practice")}
            tabIndex={0}
            aria-label="Begin Your First Practice"
            onKeyDown={(e) => e.key === "Enter" && handleNavigation("/timer", "practice")}>
                {(loadingCard === "practice" || loadingCard === "report") && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    </div>
                )}
                
                <div className="bg-cyan-500/25 absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl"></div>

                <div className='flex flex-1 flex-row items-center'>
                    <div className='flex-1 pr-2 sm:pr-3'>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className='line-clamp-1 text-sm font-bold text-white'>
                                Begin Your First Practice
                            </h3>
                            <Sparkles size={14} className="text-cyan-400 animate-pulse flex-shrink-0" />
                        </div>
                        <p className='line-clamp-2 text-xs text-gray-300'>
                            Practice regularly to improve your guitar playing skills.
                        </p>

                        <div className='mt-2 flex flex-wrap gap-1 sm:gap-1.5'>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigation("/timer", "practice");
                                }}
                                size='sm'
                                disabled={loadingCard === "practice"}
                                className='h-7 min-w-fit px-2 py-0 text-xs shadow-sm transition-colors'>
                                {loadingCard === "practice" ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Choose exercise"
                                )}
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigation("/report", "report");
                                }}
                                disabled={loadingCard === "report"}
                                className='h-7 min-w-fit border-second-400/30 px-2 py-0 text-xs transition-colors hover:bg-second-400/10'>
                                {loadingCard === "report" ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Report"
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className='flex-shrink-0'>
                        <div className="bg-cyan-500/20 text-cyan-400 rounded-full p-2 shadow-sm sm:p-2.5">
                            <Play className='h-6 w-6' fill="currentColor" />
                        </div>
                    </div>
                </div>

                <div className="text-cyan-400 opacity-80 hover:text-cyan-400 absolute right-2 top-2 transition-all">
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M7 17l9.2-9.2M17 17V7H7' />
                    </svg>
                </div>
            </div>

            <div className={cn(
                "font-openSans relative flex h-full transform cursor-pointer overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-100 hover:shadow-xl hover:ring-2 sm:p-4",
                "hover:ring-amber-500/40",
                "lg:col-span-2"
            )}
            onClick={() => handleNavigation("/guide", "guide")}
            tabIndex={0}
            aria-label="Start Your Journey"
            onKeyDown={(e) => e.key === "Enter" && handleNavigation("/guide", "guide")}>
                {loadingCard === "guide" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                    </div>
                )}
                
                <div className="bg-amber-500/25 absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl"></div>

                <div className='flex flex-1 flex-row items-center'>
                    <div className='flex-1 pr-2 sm:pr-3'>
                        <h3 className='mb-1 line-clamp-1 text-sm font-bold text-white'>
                            Start Your Journey
                        </h3>
                        <p className='line-clamp-2 text-xs text-gray-300'>
                            Discover all the features and get tips on how to make the most of your practice sessions.
                        </p>
                    </div>

                    <div className='flex-shrink-0'>
                        <div className="bg-amber-500/20 text-amber-400 rounded-full p-2 shadow-sm sm:p-2.5">
                            <BookOpen className='h-6 w-6' />
                        </div>
                    </div>
                </div>

                <div className="text-amber-400 opacity-80 hover:text-amber-400 absolute right-2 top-2 transition-all">
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M7 17l9.2-9.2M17 17V7H7' />
                    </svg>
                </div>
            </div>
        </div>
    );
};
