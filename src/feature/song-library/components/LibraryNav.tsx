"use client";

import { Button } from "assets/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const LibraryNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/">
          <Image
            src="/images/longlightlogo.svg"
            alt="Riff Quest"
            width={120}
            height={32}
            className="h-6 w-auto"
          />
        </Link>

        <div className="flex items-center gap-6">
          <span className="hidden sm:block text-sm font-bold text-cyan-400">
            Song Library
          </span>
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link href="/signup">
            <Button className="h-8 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors">
              Start Free
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
