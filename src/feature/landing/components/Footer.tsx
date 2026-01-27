"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Send, ChevronRight } from "lucide-react";

export const Footer = () => {
    return (
        <footer className='relative bg-black pt-32 pb-12 border-t border-white/5 overflow-hidden'>
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 opacity-[0.02] [background-image:linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] [background-size:40px_40px]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
          
          <div className='mx-auto max-w-7xl px-6 lg:px-8 relative z-10'>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 mb-24">
                  
                  {/* Brand Column */}
                  <div className="md:col-span-5 space-y-10">
                    <div className="space-y-6">
                        <Image
                            src='/images/longlightlogo.svg'
                            alt='Riff Quest'
                            width={180}
                            height={40}
                            className='h-10 w-auto'
                        />
                        <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
                            The intelligent practice assistant designed for guitarists who value measurable progress over guesswork.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link 
                            href='https://discord.gg/6yJmsZW2Ne' 
                            target='_blank'
                            className='flex items-center gap-3 px-5 py-2.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/20 transition-all text-xs font-black uppercase tracking-widest'
                        >
                            <svg className='h-5 w-5 fill-current' viewBox='0 0 24 24'>
                                <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
                            </svg>
                            Discord
                        </Link>
                        <Link 
                            href="https://www.buymeacoffee.com/riffquest" 
                            target="_blank" 
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all text-xs font-black uppercase tracking-widest"
                        >
                             <Coffee className="w-4 h-4" /> Support
                        </Link>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
                      <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Platform</h4>
                          <ul className="space-y-4">
                              <li><Link href="/guide" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors flex items-center group">Guide <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ml-1" /></Link></li>
                              <li><Link href="/guitar-practice-builder" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors flex items-center group">Practice Builder <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ml-1" /></Link></li>
                          </ul>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Community</h4>
                        <ul className="space-y-4">
                            <li><Link href="/blog" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors flex items-center group">Blog <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ml-1" /></Link></li>
                            <li><Link href="/what-guitar-song-to-learn" className="text-sm font-bold text-cyan-500/80 hover:text-cyan-400 transition-colors flex items-center group">Song Suggester <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ml-1" /></Link></li>
                            <li><Link href="/about" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors flex items-center group">About <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ml-1" /></Link></li>
                        </ul>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Social</h4>
                        <ul className="space-y-4">
                            <li><Link href="https://discord.gg/6yJmsZW2Ne" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">Discord</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">Legal</Link></li>
                        </ul>
                      </div>
                  </div>
              </div>

              {/* Bottom Copyright Area */}
              <div className='pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6'>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Network Operational: Alpha 2.0.4</span>
                </div>
                <p className='text-[10px] font-bold text-zinc-700 uppercase tracking-widest'>
                  © 2026 Riff Quest • Crafted for guitarists
                </p>
              </div>
          </div>
        </footer>
    );
};
