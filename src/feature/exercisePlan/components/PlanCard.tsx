import { Card } from "assets/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { getPlanColor, getPlanIcon } from "feature/exercisePlan/data/planAppearance";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpRight, Globe, Heart, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  FaBrain,
  FaClock,
  FaEdit,
  FaGuitar,
  FaLayerGroup,
  FaListUl,
  FaMusic,
  FaTrashAlt,
  FaVideo,
  FaYoutube} from "react-icons/fa";

import type { DifficultyLevel, ExercisePlan } from "../types/exercise.types";

interface PlanCardProps {
  plan: ExercisePlan;
  onSelect?: () => void;
  onStart?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onUpgrade?: () => void;
  onTogglePublic?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  startButtonText?: string;
  isLoading?: boolean;
  isLocked?: boolean;
}

const categoryStyles = {
  technique: {
    gradient: "from-blue-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaGuitar,
    text: "text-blue-400",
    iconTile: "bg-blue-500/10 text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    glow: "bg-blue-500/25",
    cta: "group-hover:bg-blue-500 group-hover:text-zinc-950",
  },
  theory: {
    gradient: "from-emerald-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaBrain,
    text: "text-emerald-400",
    iconTile: "bg-emerald-500/10 text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "bg-emerald-500/25",
    cta: "group-hover:bg-emerald-500 group-hover:text-zinc-950",
  },
  creativity: {
    gradient: "from-purple-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaMusic,
    text: "text-purple-400",
    iconTile: "bg-purple-500/10 text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glow: "bg-purple-500/25",
    cta: "group-hover:bg-purple-500 group-hover:text-zinc-950",
  },
  hearing: {
    gradient: "from-amber-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaMusic,
    text: "text-amber-400",
    iconTile: "bg-amber-500/10 text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "bg-amber-500/25",
    cta: "group-hover:bg-amber-500 group-hover:text-zinc-950",
  },
  mixed: {
    gradient: "from-red-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaLayerGroup,
    text: "text-red-400",
    iconTile: "bg-red-500/10 text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    glow: "bg-red-500/25",
    cta: "group-hover:bg-red-500 group-hover:text-zinc-950",
  },
  playalong: {
    gradient: "from-red-500/15 via-zinc-900/60 to-zinc-950",
    icon: FaYoutube,
    text: "text-red-400",
    iconTile: "bg-red-500/10 text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    glow: "bg-red-500/25",
    cta: "group-hover:bg-red-500 group-hover:text-zinc-950",
  },
};

export const PlanCard = ({
  plan,
  onSelect,
  onStart,
  onDelete,
  onEdit,
  onUpgrade,
  onTogglePublic,
  onToggleFavorite,
  isFavorite = false,
  startButtonText,
  isLoading,
  isLocked = false,
}: PlanCardProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const { createRipple, ripple } = useRipple("bg-white/15");

  const getLocalizedString = (value: string | { en?: string; pl?: string } | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.pl || value.en || '';
  };

  const title = getLocalizedString(plan.title as any);
  const description = getLocalizedString(plan.description as any);

  const totalDuration = Math.round(
    plan.exercises.reduce((acc, exercise) => acc + exercise.timeInMinutes, 0)
  );

  const difficulty = ((plan as any).difficulty || "beginner") as
    | DifficultyLevel
    | "beginner";

  const hasPlayalong = plan.exercises.some(ex => ex.isPlayalong || ex.youtubeVideoId);
  const hasVideo = plan.exercises.some(ex => ex.videoUrl && !ex.youtubeVideoId);

  const categoryStyle = hasPlayalong ? categoryStyles.playalong : (categoryStyles[plan.category as keyof typeof categoryStyles] || categoryStyles.mixed);

  // User-chosen appearance (last step of the wizard) overrides the category-derived defaults.
  const colorOverride = getPlanColor(plan.color);
  const style = colorOverride ?? categoryStyle;
  const Icon: ComponentType<{ className?: string }> =
    getPlanIcon(plan.icon) ?? categoryStyle.icon;

  const isInteractive = isLocked ? !!onUpgrade : !!onSelect;

  // Author can come from a built-in plan (StaticImageData avatar) or a published
  // community plan (string avatar URL + authorUsername).
  const authorName = plan.author?.name ?? plan.authorUsername;
  const authorAvatar = plan.author?.avatar ?? plan.authorAvatar;

  // Only published community plans link to a real user profile (built-in plans
  // use a static `author` with no backing account).
  const authorProfileId = plan.authorUsername && plan.userId ? plan.userId : null;

  // Wraps the author avatar / name in a profile link + hover tooltip when the
  // plan is community-published; otherwise renders the children untouched.
  const withAuthorProfile = (children: ReactNode, className?: string) =>
    authorProfileId ? (
      <UserTooltip userId={authorProfileId}>
        <Link
          href={`/user/${authorProfileId}`}
          onClick={(e) => e.stopPropagation()}
          className={className}
        >
          {children}
        </Link>
      </UserTooltip>
    ) : (
      <>{children}</>
    );

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden p-5 rounded-lg transition-background bg-gradient-to-br",
        style.gradient,
        isLoading && "opacity-80 pointer-events-none",
        !isLocked && "click-behavior",
        isInteractive && "cursor-pointer"
      )}
      onClick={(e) => {
        const handler = isLocked ? onUpgrade : onSelect;
        if (!handler) return;
        createRipple(e);
        handler();
      }}>
      {ripple}

      {/* Decorative accent glow — intensifies on hover */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-40 transition-opacity duration-500 group-hover:opacity-75",
          isLocked ? "bg-zinc-500/15" : style.glow
        )}
      />
      {/* Brand watermark — large accent glyph tucked into the top-right corner */}
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.18]",
          isLocked ? "text-zinc-500" : style.text
        )}
      />

      {/* Header: Category Icon & Badges */}
      <div className="relative mb-3 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded",
              isLocked ? "bg-zinc-800/60 text-zinc-400" : style.iconTile
            )}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-medium capitalize tracking-wide text-zinc-300">
                {t(`exercises:categories.${plan.category}` as any)}
            </span>

            {!isLocked && (
                <span className="text-[11px] font-medium capitalize tracking-wide text-zinc-500">
                    {t(`exercises:difficulty.${difficulty}` as any)}
                </span>
            )}
            {hasPlayalong && !isLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                    <FaYoutube className="h-2.5 w-2.5" />
                    Playalong
                </span>
            )}
            {hasVideo && !isLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                    <FaVideo className="h-2.5 w-2.5" />
                    Video
                </span>
            )}
        </div>
        <div className="flex items-center gap-2">
            {onToggleFavorite && !isLocked && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                aria-pressed={isFavorite}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-[4px] border shadow-lg backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50 focus-visible:opacity-100",
                                    isFavorite
                                        // Already favorited — always visible so the state is recognizable at a glance.
                                        ? "border-rose-500/30 bg-rose-500/15 text-rose-400 opacity-100 hover:bg-rose-500/25 hover:text-rose-300"
                                        // Not favorited — fades in on card hover, with a tinted background so it reads as a button.
                                        : "border-white/10 bg-zinc-950/50 text-zinc-300 opacity-0 hover:bg-white/10 hover:text-rose-300 group-hover:opacity-100"
                                )}
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                            >
                                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {(onEdit || onDelete || onTogglePublic) && (
                <TooltipProvider delayDuration={200}>
                    <div className="mr-1 flex items-center gap-0.5 rounded-[4px] border border-white/10 bg-zinc-950/50 p-1 shadow-lg backdrop-blur-sm">
                        {onTogglePublic && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label={plan.isPublic ? "Unpublish plan" : "Publish plan"}
                                        className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
                                            plan.isPublic
                                                ? "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 hover:text-cyan-300"
                                                : "text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); onTogglePublic(); }}
                                    >
                                        <Globe className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {plan.isPublic ? "Published — click to unpublish" : "Click to publish"}
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onEdit && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Edit plan"
                                        className="flex h-9 w-9 items-center justify-center rounded-[4px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    >
                                        <FaEdit className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                        )}
                        {onDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Delete plan"
                                        className="flex h-9 w-9 items-center justify-center rounded-[4px] text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50"
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    >
                                        <FaTrashAlt className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            )}
            {isLocked && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 ring-1 ring-amber-500/25">
                <Lock className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-amber-500">Pro</span>
              </div>
            )}
        </div>
      </div>

      {/* Main Content with Avatar */}
      <div className="relative flex gap-4">
        {authorAvatar && withAuthorProfile(
            <div className={cn(
              "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg transition-all",
              isLocked && "grayscale opacity-50",
              authorProfileId && "ring-1 ring-transparent hover:ring-cyan-500/60"
            )}>
                {typeof authorAvatar === "string" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={authorAvatar}
                        alt={authorName ?? ""}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <Image
                        src={authorAvatar}
                        alt={authorName ?? ""}
                        fill
                        className="object-cover"
                    />
                )}
            </div>,
            "shrink-0"
        )}
        <div className="flex-1 space-y-1">
            {authorName && withAuthorProfile(
                <span className={cn(
                  "inline-block text-[11px] font-medium leading-none transition-colors",
                  isLocked ? "text-zinc-400" : "text-primary/80",
                  authorProfileId && "hover:text-cyan-400"
                )}>
                    {authorName}
                </span>,
                "w-fit"
            )}
            <h3 className={cn(
              "font-display text-[17px] font-bold leading-tight tracking-tight",
              isLocked ? "text-foreground/90" : "text-foreground"
            )}>
                {title}
            </h3>
            <p className={cn(
              "line-clamp-2 text-[12px] leading-relaxed",
              isLocked ? "text-muted-foreground/80" : "text-muted-foreground/80"
            )}>
                {description}
            </p>
        </div>
      </div>

      {/* Footer: Stats & Action */}
      <div className="relative mt-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLocked ? "text-zinc-600" : "text-zinc-400")}>
                <FaClock className={cn("h-3.5 w-3.5", isLocked ? "text-zinc-600" : "text-zinc-500")} />
                <span>{totalDuration} min</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLocked ? "text-zinc-600" : "text-zinc-400")}>
                <FaListUl className={cn("h-3.5 w-3.5", isLocked ? "text-zinc-600" : "text-zinc-500")} />
                <span>{plan.exercises.length}</span>
            </div>
        </div>

        {isLocked ? (
          <button
            type="button"
            aria-label="Upgrade to Pro"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 transition-colors duration-300 group-hover:bg-amber-500 group-hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
            onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
          >
            <Lock className="h-4 w-4" />
          </button>
        ) : onStart && (
          <button
            type="button"
            aria-label={startButtonText || "Start"}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-200 transition-colors duration-300",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
              style.cta
            )}
            onClick={(e) => {
                e.stopPropagation();
                onStart();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </Card>
  );
};
