import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions, icon }: PageHeaderProps) => {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 px-5 py-4 sm:px-6 sm:py-5">
      {/* Left cyan accent bar */}
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-gradient-to-b from-cyan-400 via-cyan-500/60 to-transparent" />

      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left_center,rgba(6,182,212,0.07)_0%,transparent_65%)]" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-white sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-zinc-400">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
};
