"use client";

import { Button } from "assets/components/ui/button";
import { Logo } from "components/Logo/Logo";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Slim nav that slides in once the hero (and its own static nav) scrolls
 * out of view, so the primary CTA stays reachable on a page that is
 * otherwise ~8 screens of scroll with no signup button until the footer.
 */
export const LandingStickyNav = () => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (y) => {
    // Past ~85% of the viewport the hero nav is gone; React bails out of
    // re-renders while the boolean stays the same, so this is cheap.
    setVisible(y > window.innerHeight * 0.85);
  });

  return (
    <motion.header
      inert={!visible}
      initial={false}
      animate={{ y: visible ? 0 : "-110%" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
      }
      className='fixed inset-x-0 top-0 z-50 bg-zinc-950/85 backdrop-blur-md'>
      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-12'>
        <Logo />
        <div className='flex items-center gap-6'>
          <Link
            href='/how-it-works'
            className='hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block'>
            How it works
          </Link>
          <Link
            href='/login'
            className='hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block'>
            Sign in
          </Link>
          <Link href='/signup'>
            <Button className='group/btn h-10 rounded-lg border-none bg-white px-5 text-sm font-bold text-black transition-colors duration-300 hover:bg-zinc-50 active:scale-[0.98]'>
              <span className='flex items-center gap-2 whitespace-nowrap'>
                Start tracking free
                <ArrowRight className='h-4 w-4 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-1' />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
