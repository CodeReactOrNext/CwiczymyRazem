"use client";

import { Button } from "assets/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

export const FinalCTASection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={sectionRef} className="relative py-32 bg-black overflow-hidden border-t border-white/5">
      {/* Premium background effects */}
      <div className="absolute inset-0 z-0">
        <motion.div 
            style={{ y: y1 }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.05] blur-[140px] rounded-full" 
        />
        <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-500/[0.05] blur-[140px] rounded-full" 
        />
        <div className="absolute inset-0 bg-[url('/static/images/old_effect_dark.webp')] opacity-[0.03] pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-lg">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> alpha mission
                </div>

                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 font-display leading-[0.9] tracking-tighter">
                  Level up your <br />
                  <span className="text-zinc-600">future self.</span>
                </h2>

                <p className="text-lg sm:text-xl text-zinc-500 mb-12 max-w-xl mx-auto font-medium leading-relaxed">
                  Join guitarists who already transformed their practice into progress.
                </p>

                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/signup">
                        <Button className="h-20 px-16 bg-white text-black hover:bg-zinc-100 font-bold text-2xl transition-all rounded-lg shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] group relative overflow-hidden">
                            <span className="relative z-10 flex items-center">
                                Start Free <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </Link>
                  </motion.div>
                </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
};
