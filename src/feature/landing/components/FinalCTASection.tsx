"use client";

import { Button } from "assets/components/ui/button";
import { LazyMotion, m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const loadFeatures = () => import("framer-motion").then((res) => res.domAnimation);

export const FinalCTASection = () => {
  const sectionRef = useRef(null);
  
  // Keep very light parallax for background only if possible, or just remove motion
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <LazyMotion features={loadFeatures}>
    <section ref={sectionRef} className="relative py-32 bg-black overflow-hidden border-t border-white/5">
      {/* Background decoration - Dynamic Floating Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <m.div 
            animate={{ 
                x: ['-5%', '5%'],
                y: ['-2%', '8%'],
                opacity: [0.1, 0.18, 0.1]
            }}
            transition={{ 
                duration: 10, 
                repeat: Infinity, 
                repeatType: "mirror",
                ease: "easeInOut" 
            }}
            className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-cyan-500 rounded-full blur-[140px] pointer-events-none" 
        />
        <m.div 
            animate={{ 
                x: ['5%', '-5%'],
                y: ['5%', '-5%'],
                opacity: [0.08, 0.15, 0.08]
            }}
            transition={{ 
                duration: 12, 
                repeat: Infinity, 
                repeatType: "mirror",
                ease: "easeInOut",
                delay: 1
            }}
            className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[140px] pointer-events-none" 
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
            <div className="max-w-4xl">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 font-display leading-[0.9] tracking-tighter">
                  Level up your <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">future self.</span>
                </h2>

                <p className="text-lg sm:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join guitarists who already transformed their practice into progress. <br className="hidden sm:block"/>
                  The journey to mastery starts with a single click.
                </p>

                <div className="flex flex-col items-center">
                  <Link href="/signup">
                      <div className="relative p-[1px] overflow-hidden rounded-lg group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                          {/* Vibrant Rotating Border Beam - Restored and Working */}
                          <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                          
                          <Button className="relative h-14 sm:h-14 w-full sm:w-auto px-10 bg-zinc-950 text-white hover:bg-zinc-900 border-none font-bold text-base transition-all rounded-[7px] shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] overflow-hidden group/btn">
                              <span className="relative z-10 flex items-center gap-3">
                                  Start My Guitar Progress 
                                  <ArrowRight className="w-5 h-5 text-orange-500 group-hover/btn:translate-x-2 transition-transform duration-300" />
                              </span>
                          </Button>
                      </div>
                  </Link>
                  <span className="mt-3 text-xs text-zinc-400 font-medium whitespace-nowrap">Free forever for tracking progress</span>
                </div>
            </div>
        </div>
      </div>
    </section>
    </LazyMotion>
  );
};
