import type { ReactNode } from "react";


interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export const DashboardSection = ({
  title,
  subtitle,
  children,
  action,
  compact = false,
  className = "",
}: DashboardSectionProps) => {
  const spacing = compact ? "mb-4" : "mb-5";

  return (
    <div className={`relative overflow-hidden rounded-xl  ${className}`}>
      <div className='relative'>
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

        <div className='relative'>{children}</div>
      </div>
    </div>
  );
};
