"use client";

import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const LibraryCTASection = () => {
  return (
    <section className="relative py-32 bg-black overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: ["-5%", "5%"], y: ["-2%", "8%"], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-cyan-500 rounded-full blur-[140px] pointer-events-none"
        />
        <motion.div
          animate={{ x: ["5%", "-5%"], y: ["5%", "-5%"], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-sky-500 rounded-full blur-[140px] pointer-events-none"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="max-w-3xl">
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display leading-[0.9] tracking-tighter">
              Track every song
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                you learn.
              </span>
            </h2>

            <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Add songs to your Want to Learn list, log your practice, and watch your
              repertoire grow. Built for guitarists who are serious about progress.
            </p>

            <div className="flex flex-col items-center gap-3">
              <Link href="/signup">
                <div className="relative p-[1px] overflow-hidden rounded-lg group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                  <Button className="relative h-14 w-full sm:w-auto px-10 bg-zinc-950 text-white hover:bg-zinc-900 border-none font-bold text-base rounded-[7px] shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]">
                    <span className="relative z-10 flex items-center gap-3">
                      Start Tracking Songs Free
                      <ArrowRight className="w-5 h-5 text-orange-500 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </Link>
              <span className="text-xs text-zinc-500 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Log in →
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
