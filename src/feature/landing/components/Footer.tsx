"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export const Footer = () => {
    return (
        <footer className='relative bg-[#0d0d0c] py-16 border-t border-zinc-800'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='flex flex-col items-center justify-between gap-8 lg:flex-row'>
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

              {/* Links */}
              <div className='flex items-center gap-8 text-sm'>
                <Link href='/faq' className='text-zinc-400 hover:text-white transition-colors'>
                  FAQ
                </Link>
                <Link href='/contact' className='text-zinc-400 hover:text-white transition-colors'>
                  Contact
                </Link>
                <Link href='/privacy' className='text-zinc-400 hover:text-white transition-colors'>
                  Privacy
                </Link>
              </div>

              {/* Social */}
              <div className='flex items-center gap-4'>
                <a href='#' className='w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all'>
                  <Github className='w-5 h-5' />
                </a>
                <a href='#' className='w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all'>
                  <Twitter className='w-5 h-5' />
                </a>
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
