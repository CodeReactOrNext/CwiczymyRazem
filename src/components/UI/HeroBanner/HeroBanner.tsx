import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  rightContent?: React.ReactNode;
  backgroundImage: string;
  onClick?: () => void;
  className?: string;
}

export const HeroBanner = ({
  title,
  subtitle,
  buttonText,
  rightContent,
  backgroundImage,
  onClick,
  className = "",
}: HeroBannerProps) => {
  return (
    <div
      className={`relative flex overflow-hidden rounded-xl border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] md:min-h-[160px] lg:min-h-[180px] ${className}`}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center md:[background-position:center_calc(100%_+_90px)]"
        style={{ 
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/60 to-transparent md:to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8 lg:px-10 lg:py-12">
        <div className="space-y-2 max-w-2xl">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-widest">
            {title}
          </h3>
          {subtitle && (
            <p className="text-zinc-200 text-sm md:text-base lg:text-lg font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {rightContent ? (
          <div className="shrink-0">{rightContent}</div>
        ) : buttonText ? (
          <button 
            onClick={onClick}
            className="group/btn shrink-0 rounded-md bg-white text-zinc-950 px-6 py-3 text-sm md:text-base font-medium shadow-lg transition-all duration-300 flex items-center gap-2 active:scale-95"
          >
            {buttonText}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </button>
        ) : null}
      </div>
    </div>
  );
};
