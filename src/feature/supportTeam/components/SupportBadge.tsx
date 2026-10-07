import { cn } from "assets/lib/utils";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { useTranslation } from "hooks/useTranslation";
import { Heart } from "lucide-react";

/**
 * The badge's words: the member's own title when they have one, the generic
 * one otherwise, and the hover line spelling out what it means.
 */
const useSupportWords = (member?: SupportTeamMember | null) => {
  const { t } = useTranslation("supporter");
  const label = member?.title?.trim() || t("badge.label");
  return { label, tooltip: t("badge.tooltip", { label }) };
};

interface SupportBadgeProps {
  member?: SupportTeamMember | null;
  /** "light" is for the few surfaces on a white background (the profile hover card). */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Text pill shown next to a supporter's name wherever there is room. Gold + a
 * filled heart, the same language the donation surfaces use — a shield would
 * read as a moderator instead of someone funding the project.
 */
export const SupportBadge = ({
  member,
  tone = "dark",
  className,
}: SupportBadgeProps) => {
  const { label, tooltip } = useSupportWords(member);
  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold leading-none",
        tone === "light"
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-500/15 text-amber-300",
        className,
      )}>
      <Heart size={12} strokeWidth={2.5} fill='currentColor' />
      {label}
    </span>
  );
};

interface SupportMarkProps {
  member?: SupportTeamMember | null;
  className?: string;
}

/**
 * Icon-only variant for the tight avatar stack in "Live Now", where a text pill
 * would not fit.
 */
export const SupportMark = ({ member, className }: SupportMarkProps) => {
  const { tooltip } = useSupportWords(member);
  return (
    <div
      title={tooltip}
      className={cn(
        "flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-zinc-950 ring-2 ring-zinc-950",
        className,
      )}>
      <Heart className='h-2.5 w-2.5' strokeWidth={3} fill='currentColor' />
    </div>
  );
};
