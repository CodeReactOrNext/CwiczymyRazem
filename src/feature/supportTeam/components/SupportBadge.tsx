import { cn } from "assets/lib/utils";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { getSupportLabel } from "feature/supportTeam/utils/supportTeam.utils";
import { ShieldCheck } from "lucide-react";

interface SupportBadgeProps {
  member?: SupportTeamMember | null;
  /** "light" is for the few surfaces on a white background (the profile hover card). */
  tone?: "dark" | "light";
  className?: string;
}

/** Text pill shown next to a support member's name wherever there is room. */
export const SupportBadge = ({
  member,
  tone = "dark",
  className,
}: SupportBadgeProps) => (
  <span
    title={`${getSupportLabel(member)} — riff.quest team`}
    className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
      tone === "light"
        ? "bg-purple-100 text-purple-700"
        : "bg-purple-500/15 text-purple-300",
      className,
    )}>
    <ShieldCheck size={10} strokeWidth={2.5} />
    {getSupportLabel(member)}
  </span>
);

interface SupportMarkProps {
  member?: SupportTeamMember | null;
  className?: string;
}

/**
 * Icon-only variant for the tight avatar stack in "Live Now", where a text pill
 * would not fit.
 */
export const SupportMark = ({ member, className }: SupportMarkProps) => (
  <div
    title={`${getSupportLabel(member)} — riff.quest team`}
    className={cn(
      "flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white ring-2 ring-zinc-950",
      className,
    )}>
    <ShieldCheck className='h-2.5 w-2.5' strokeWidth={3} />
  </div>
);
