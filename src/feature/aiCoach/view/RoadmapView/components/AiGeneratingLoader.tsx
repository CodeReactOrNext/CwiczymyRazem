import { Map as MapIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

const AI_MESSAGES = [
  "Analyzing your learning goal...",
  "Identifying key techniques...",
  "Writing practice exercises...",
  "Calibrating difficulty to your level...",
  "Setting success criteria...",
  "Almost there...",
];

/** What the drawer shows while the coach writes a step's details for the first time. */
export const AiGeneratingLoader: React.FC<{ stepTitle: string }> = ({
  stepTitle,
}) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % AI_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex flex-col gap-6 pt-2'>
      <div className='flex flex-col items-center gap-4 py-4'>
        <div className='relative flex items-center justify-center'>
          <span className='absolute h-16 w-16 animate-ping rounded-full bg-cyan-500/10' />
          <span className='absolute h-12 w-12 animate-pulse rounded-full bg-cyan-500/15' />
          <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20'>
            <MapIcon className='h-5 w-5 text-cyan-400' />
          </div>
        </div>

        <div className='flex flex-col items-center gap-1.5'>
          <p className='text-[11px] font-semibold tracking-widest text-cyan-400/80'>
            Coach is thinking
          </p>
          <p
            className='text-sm text-zinc-400 transition-opacity duration-300'
            style={{ opacity: fade ? 1 : 0 }}>
            {AI_MESSAGES[msgIdx]}
          </p>
        </div>

        <div className='flex items-center gap-1.5'>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className='h-1.5 w-1.5 rounded-full bg-cyan-500/60'
              style={{
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div className='rounded-lg bg-zinc-900/50 px-4 py-3'>
        <p className='mb-1 text-[10px] font-semibold tracking-widest text-zinc-500'>
          Generating details for
        </p>
        <p className='text-sm font-medium text-zinc-300'>{stepTitle}</p>
      </div>

      <div className='flex flex-col gap-4'>
        {[92, 100, 78, 95, 65, 88].map((w, i) => (
          <div
            key={i}
            className='h-3 overflow-hidden rounded-full bg-zinc-800/60'
            style={{ width: `${w}%` }}>
            <div
              className='h-full w-full rounded-full'
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.12) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.8s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
