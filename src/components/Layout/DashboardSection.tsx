import { ReactNode } from "react";

type SectionColor =
  | "cyan"
  | "yellow"
  | "green"
  | "violet"
  | "purple"
  | "blue"
  | "red";

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  color: SectionColor;
  children: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

const colorConfig = {
  cyan: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  yellow: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  green: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  violet: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  purple: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  blue: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
  red: {
    gradient: "from-zinc-800/5 via-transparent to-zinc-700/5",
  },
};

export const DashboardSection = ({
  title,
  subtitle,
  color,
  children,
  action,
  compact = false,
  className = "",
}: DashboardSectionProps) => {
  const colors = colorConfig[color];
  const padding = compact ? "p-4" : "p-5";
  const spacing = compact ? "mb-4" : "mb-5";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-800/50 ${padding} shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-zinc-800/70 hover:shadow-xl ${className}`}>
      {/* Subtle background gradient */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colors.gradient}`}
      />

      <div className='relative'>
        {/* Header */}
        <div
          className={`flex items-center ${
            action ? "justify-between" : ""
          } ${spacing}`}>
          <div>
            <h3
              className={`font-bold text-white ${
                compact ? "text-lg" : "text-xl"
              }`}>
              {title}
            </h3>
            {subtitle && <p className='text-xs text-zinc-400'>{subtitle}</p>}
          </div>
          {action && action}
        </div>

        {/* Content */}
        <div className='relative'>{children}</div>
      </div>
    </div>
  );
};
