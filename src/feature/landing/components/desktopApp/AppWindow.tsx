"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Minus, Square, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

/** Input meter bars: a picked note, its decay, the next one — looped. */
const METER_LEVELS = [
  0.15, 0.85, 0.7, 0.55, 0.45, 0.35, 0.9, 0.75, 0.6, 0.4, 0.3, 0.2,
];

interface AppWindowProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * The desktop app's window around a real screenshot of it: title bar with the
 * app's name and the screen it is on, an input meter that moves while the
 * window is on screen, and the system's window buttons.
 */
export const AppWindow = ({ src, alt, width, height }: AppWindowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const still = !!useReducedMotion();

  return (
    <div ref={ref} className='overflow-hidden rounded-xl bg-zinc-900'>
      <div className='flex h-10 items-center gap-3 bg-zinc-800/70 pl-4 pr-1'>
        <Image
          src='/images/logolight.svg'
          alt=''
          width={14}
          height={16}
          className='h-4 w-auto opacity-80'
        />
        <span className='truncate text-xs text-zinc-300'>
          Riff Quest
          <span className='text-zinc-500'> · Tone Studio</span>
        </span>

        <span
          className='ml-auto hidden items-center gap-2 text-[11px] text-zinc-500 sm:flex'
          aria-hidden='true'>
          Input
          <span className='flex h-3 items-end gap-[2px]'>
            {[0, 1, 2, 3, 4, 5].map((bar) => (
              <motion.span
                key={bar}
                className='w-[3px] rounded-[1px] bg-emerald-400'
                style={{ height: "20%" }}
                animate={
                  inView && !still
                    ? {
                        height: METER_LEVELS.map(
                          (level) =>
                            `${Math.max(12, Math.min(100, (level - bar * 0.1) * 120))}%`,
                        ),
                      }
                    : { height: "45%" }
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </span>
        </span>

        <span className='flex text-zinc-500 sm:ml-2' aria-hidden='true'>
          <span className='flex h-10 w-10 items-center justify-center'>
            <Minus className='h-3.5 w-3.5' />
          </span>
          <span className='flex h-10 w-10 items-center justify-center'>
            <Square className='h-3 w-3' />
          </span>
          <span className='flex h-10 w-10 items-center justify-center'>
            <X className='h-3.5 w-3.5' />
          </span>
        </span>
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        sizes='(min-width: 1024px) 680px, 100vw'
        className='block h-auto w-full'
      />
    </div>
  );
};
