"use client";

import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Music } from "lucide-react";
import Link from "next/link";

interface LibraryHeroSectionProps {
  totalSongs: number;
}

export const LibraryHeroSection = ({ totalSongs }: LibraryHeroSectionProps) => {
  return (
    <section className="relative pt-32 pb-24 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-sky-500/4 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-zinc-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-zinc-400">Song Library</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 block">
            Guitar Song Library
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[0.9] font-display mb-6">
            Every guitar song
            <br />
            <span className="text-zinc-500">you want to learn.</span>
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-xl">
            Browse {totalSongs > 0 ? `${totalSongs}+` : "thousands of"} songs ranked by real
            community difficulty ratings. From D-tier beginner picks to S-tier legendary
            challenges — find exactly where you are right now.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/signup">
              <Button className="h-12 px-8 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors">
                Track Your Songs Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="#explore"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Music className="h-4 w-4" />
              Explore the library
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
