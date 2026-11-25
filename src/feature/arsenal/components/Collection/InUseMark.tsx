import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Plug } from "lucide-react";

interface InUseMarkProps {
  className?: string;
}

/**
 * The plug plate: "this piece is plugged into what you play" — on the profile,
 * in a rig slot or on the pedalboard.
 *
 * The hammer mark's twin in size and shape, kept neutral on purpose: every hue a
 * socket can wear is already a rarity, and amber is Mythic's own.
 */
export const InUseMark = ({ className }: InUseMarkProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <span
      title={t("stash.in_use")}
      aria-hidden
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-zinc-100 text-zinc-900 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]",
        className,
      )}>
      <Plug size={12} strokeWidth={2.75} aria-hidden />
    </span>
  );
};
