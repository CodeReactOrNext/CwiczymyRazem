"use client";

import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className='relative bg-[#0d0d0c] py-16 border-t border-zinc-800'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
              {/* Logo */}
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center'>
                  <span className='text-white font-bold text-lg'>P</span>
                </div>
                <div>
                  <span className='text-lg font-bold text-white'>Practice Together</span>
                  <p className='text-xs text-zinc-500'>Guitar Learning Platform</p>
                </div>
              </div>


            <div className='mt-12 pt-8 border-t border-zinc-800/50 text-center'>
              <p className='text-sm text-zinc-600'>
                © 2024 Practice Together. Made with ❤️ for guitarists everywhere.
              </p>
            </div>
          </div>
        </footer>
    );
};
