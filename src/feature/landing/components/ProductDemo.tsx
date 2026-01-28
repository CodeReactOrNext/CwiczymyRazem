"use client";

import { Play } from "lucide-react";

export const ProductDemo = () => {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="relative mx-auto max-w-5xl">
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-zinc-900/10 p-1 sm:p-2 backdrop-blur-sm overflow-hidden">
            <div className="relative aspect-video rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden bg-zinc-950">
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


        </div>
      </div>
    </section>
  );
};
