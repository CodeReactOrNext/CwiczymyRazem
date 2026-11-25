import { cn } from "assets/lib/utils";

/**
 * A switch's state on a session key: green when on, grey when off. Keys in
 * the session toolbar speak one grammar — a dot is a switch, a chevron opens
 * a menu, a bare key just acts — so "off" never has to look disabled.
 */
export const StateDot = ({ on, className }: { on: boolean; className?: string }) => (
  <span
    aria-hidden
    className={cn("h-[7px] w-[7px] shrink-0 rounded-full", on ? "bg-emerald-400" : "bg-zinc-600", className)}
  />
);
