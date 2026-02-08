import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  ctaText?: string;
  href?: string;
}

export const ActionCard = ({ 
  title, 
  description, 
  ctaText = 'Get Started for Free', 
  href = '/signup' 
}: ActionCardProps) => {
  return (
    <div className="my-12 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 shadow-2xl">
      <div className="relative z-10">
        <h3 className="mb-3 text-2xl font-bold tracking-tight text-white">
          {title}
        </h3>
        <p className="mb-6 text-zinc-400">
          {description}
        </p>
        <Link 
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-400 hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
        >
          {ctaText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
};
