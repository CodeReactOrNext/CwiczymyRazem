"use client";

import { useEffect, useState } from "react";

/**
 * Thin fixed bar under LibraryNav showing how far down the guide the reader
 * has scrolled — these pages run ~10-15k px tall with no other progress cue.
 */
export const GuideProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div
      className='fixed left-0 right-0 top-16 z-40 h-1 bg-zinc-900'
      role='progressbar'
      aria-label='Reading progress'
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}>
      <div
        className='h-full bg-cyan-400 transition-[width] duration-100'
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
