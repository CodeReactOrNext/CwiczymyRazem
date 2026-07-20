import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

interface GuideSectionProps {
  heading: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}

export const GuideSection = ({
  heading,
  intro,
  children,
  className,
}: GuideSectionProps) => {
  return (
    <section className={cn("mx-auto w-full max-w-5xl px-6 py-10", className)}>
      <h2 className='font-display mb-3 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl'>
        {heading}
      </h2>
      {intro && (
        <p className='mb-8 max-w-3xl leading-relaxed text-zinc-400'>{intro}</p>
      )}
      {children}
    </section>
  );
};
