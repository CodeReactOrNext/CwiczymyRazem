"use client";

import { Button } from "assets/components/ui/button";
import { useScroll, useTransform, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

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
    <section ref={sectionRef} className="relative py-32 bg-black overflow-hidden border-t border-white/5">
      {/* Background decoration - Dynamic Floating Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
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
        <motion.div 
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
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">future self.</span>
                </h2>

                <p className="text-lg sm:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join guitarists who already transformed their practice into progress. <br className="hidden sm:block"/>
                  The journey to mastery starts with a single click.
                </p>

                <div className="flex flex-col items-center">
                  <Link href="/signup">
                      <div className="relative p-[1px] overflow-hidden rounded-lg group">
                          {/* Vibrant Rotating Border Beam */}
                          <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                          
                          <Button className="relative h-16 sm:h-16 w-full sm:w-auto px-12 bg-zinc-950 text-white hover:bg-zinc-900 border-none font-bold text-xl transition-all rounded-[7px] shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] overflow-hidden">
                              <span className="relative z-10 flex items-center gap-3">
                                  Start Free <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                              </span>
                          </Button>
                      </div>
                  </Link>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};
