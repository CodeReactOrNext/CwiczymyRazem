"use client";

import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className='relative bg-[#0d0d0c] py-16 border-t border-zinc-800'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
              {/* Logo */}
              <div className='flex items-center'>
                <Image
                  src='/images/longlightlogo.svg'
                  alt='Riff Quest'
                  width={150}
                  height={32}
                  className='h-8 w-auto opacity-80 hover:opacity-100 transition-opacity'
                />
              </div>


            <div className='mt-12 pt-8 border-t border-zinc-800/50 text-center'>
              <p className='text-sm text-zinc-600'>
                © 2025 Riff Quest. Made with ❤️ for guitarists everywhere.
              </p>
            </div>
          </div>
        </footer>
    );
};
