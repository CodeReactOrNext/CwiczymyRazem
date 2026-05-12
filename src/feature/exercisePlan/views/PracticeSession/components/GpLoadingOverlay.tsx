import { memo } from "react";

interface GpLoadingOverlayProps {
  isLoading: boolean;
}

export const GpLoadingOverlay = memo(function GpLoadingOverlay({ isLoading }: GpLoadingOverlayProps) {
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4 bg-zinc-950/90 backdrop-blur-sm">
      <div className="h-10 w-10 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
        Loading track…
      </p>
    </div>
  );
});
