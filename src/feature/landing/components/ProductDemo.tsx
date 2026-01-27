"use client";

import { Play } from "lucide-react";

export const ProductDemo = () => {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl">
          <div className="relative rounded-[2rem] border border-white/10 bg-zinc-900/50 p-2 backdrop-blur-sm overflow-hidden shadow-[0_0_100px_-20px_rgba(6,182,212,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-teal-500/5 pointer-events-none z-10"></div>
            
            <div className="relative aspect-video rounded-[1.5rem] overflow-hidden bg-zinc-950">
                <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                >
                    <source src="/demo.webm" type="video/webm" />
                    Your browser does not support the video tag.
                </video>
            </div>
          </div>

          {/* Floating Accents */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};
