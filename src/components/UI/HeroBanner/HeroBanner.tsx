import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  rightContent?: React.ReactNode;
  backgroundImage?: string;
  backgroundContent?: ReactNode;
  characterImage?: string;
  secondaryImage?: string;
  eyebrow?: string;
  eyebrowClassName?: string;
  onClick?: () => void;
  className?: string;
  leftContent?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

export const HeroBanner = ({
  title,
  subtitle,
  buttonText,
  rightContent,
  backgroundImage,
  backgroundContent,
  characterImage,
  secondaryImage,
  eyebrow = "Daily practice",
  eyebrowClassName = "text-orange-400/80",
  onClick,
  className = "",
  leftContent,
  children,
  compact = false,
}: HeroBannerProps) => {
  return (
    <div
      className={`relative flex rounded-none md:rounded-xl items-start border-none overflow-hidden md:overflow-visible ${compact ? '' : 'min-h-[220px] md:min-h-[160px] lg:min-h-[180px]'} ${className}`}
    >
      {/* Backgrounds Container (Clipped) */}
      <div className="absolute inset-0 rounded-none md:rounded-xl overflow-hidden pointer-events-none z-0">
        {/* Base background — matches page bg so it bleeds in */}
        <div className="absolute inset-0 bg-background" />

        {/* Background Image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}

        {/* Warm spot on the right — more prominent orange glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_100%_at_85%_100%,rgba(234,88,12,0.3),transparent_70%)]" />

        {/* Left-to-right fade so text stays readable — only rounded on desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-second-600 via-second-600/90 via-60% to-transparent md:rounded-tl-2xl" />

        {/* Renders after the fade so custom elements remain highly visible */}
        {backgroundContent}

        {/* Bottom edge fade — ties the banner into the cards below */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-second-600/60 to-transparent" />
      </div>

      {/* Glow blob behind the figures */}
      {(characterImage || secondaryImage) && (
        <div className="absolute bottom-[-60px] right-[-20px] w-[340px] h-[340px] bg-orange-900/20 blur-[80px] rounded-full pointer-events-none" />
      )}

      {/* Metronome — tucked beside the guitarist */}
      {secondaryImage && (
        <img
          src={secondaryImage}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-[80px] xxs:right-[100px] xs:right-[120px] md:right-[220px] lg:right-[250px] h-[65%] xs:h-[75%] max-h-[240px] w-auto object-contain object-bottom pointer-events-none select-none z-[2]"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}
        />
      )}

      {/* Guitarist — on mobile smaller and no overflow, on desktop overflows upward */}
      {characterImage && (
        <img
          src={characterImage}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-[-20px] xxs:right-[-40px] xs:right-[-60px] h-[80%] xxs:h-[85%] xs:h-[90%] max-h-[280px] md:right-[-8px] md:h-[130%] md:max-h-[420px] w-auto object-contain object-bottom pointer-events-none select-none z-[3]"
          style={{ filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.6))" }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col md:flex-row w-full items-start md:items-start justify-between gap-6 md:gap-8 ${
          compact ? 'p-4 md:p-5 lg:px-6 lg:py-4' : 'p-6 md:p-8 lg:px-10 lg:py-8'
        } ${
          characterImage ? "pr-[120px] xs:pr-[160px] md:pr-8 lg:pr-10" : ""
        }`}
      >
        <div className="space-y-2 max-w-xl w-full">
          {eyebrow && (
            <p className={`text-xs font-semibold tracking-[0.2em] uppercase md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0 md:rounded-none ${eyebrowClassName}`}>
              {eyebrow}
            </p>
          )}
          <div className="md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0 bg-second-600/60 backdrop-blur-md rounded-none md:rounded-lg px-3 py-2 inline-block">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-zinc-400 text-sm font-medium mt-1">{subtitle}</p>
            )}
          </div>
          {leftContent && (
            <div className="mt-4 sm:mt-6 relative z-20">
              {leftContent}
            </div>
          )}
        </div>

        {(buttonText || rightContent || children) && (
          <div className="flex flex-col items-start md:items-end shrink-0 z-10 w-full md:w-auto gap-4 md:gap-0">
            {rightContent && (
              <div className="pt-1">{rightContent}</div>
            )}
            {!rightContent && buttonText && (
              <button
                onClick={onClick}
                className="group/btn rounded-md bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 flex items-center gap-2 active:scale-95 shrink-0"
              >
                {buttonText}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            )}
            {children && <div className="w-full md:w-auto md:mb-1">{children}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
