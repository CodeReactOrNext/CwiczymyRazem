import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Lock, Pencil, Trash2 } from "lucide-react";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META, SESSION_TYPE_CONFIG } from "../config/sessionType";
import type { PracticeLogSession } from "../types/practiceLog.types";

interface SessionCardProps {
  session: PracticeLogSession;
  onEdit: (session: PracticeLogSession) => void;
  onDelete: (session: PracticeLogSession) => void;
  compact?: boolean;
  /** 1-based order badge shown when a single day is selected (matches the timeline). */
  index?: number;
}

export const SessionCard = ({
  session,
  onEdit,
  onDelete,
  compact = false,
  index,
}: SessionCardProps) => {
  const { t } = useTranslation(["practice_log", "common"]);
  const config = SESSION_TYPE_CONFIG[session.type];
  const TypeIcon = config.icon;
  const isManual = session.type === "manual";
  const isBackdated =
    !!session.isDateBackReport && session.isDateBackReport !== "0";

  const categorySplit =
    !compact && session.timeSumary
      ? CATEGORY_META.filter(({ key }) => session.timeSumary![key] > 0)
      : [];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg transition-colors hover:bg-white/[0.05]",
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      )}
    >
      <div
        className={cn(
          "relative flex flex-shrink-0 items-center justify-center rounded-lg shadow-lg transition-all duration-300 group-hover:scale-105",
          config.iconBg,
          config.iconBorder,
          compact ? "h-10 w-10" : "h-12 w-12"
        )}
      >
        <TypeIcon
          className={cn(
            config.iconText,
            "transition-colors duration-300",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          aria-label={t(config.labelKey)}
        />
        {index !== undefined && (
          <span
            className={cn(
              "absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold tabular-nums shadow-md ring-2 ring-zinc-900",
              config.accentSolid,
              config.accentText
            )}
          >
            {index}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium text-zinc-100",
            compact ? "text-[13px]" : "text-sm"
          )}
        >
          {session.title}
        </p>

        {!compact && session.description && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {session.description}
          </p>
        )}

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
          <span className="tabular-nums">
            {session.date.toLocaleTimeString("en", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isBackdated && (
            <span className="text-zinc-600">{t("card.backdated")}</span>
          )}
          {categorySplit.map(({ key, labelKey, dot }) => (
            <span key={key} className="hidden items-center gap-1.5 sm:flex">
              <span className={cn("h-1 w-1 rounded-full", dot)} />
              <span className="tabular-nums">
                {convertMsToHM(session.timeSumary![key])}
              </span>
              <span>{t(labelKey)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <span
          title={t("card.duration")}
          className={cn(
            "flex items-center justify-end gap-1.5 tabular-nums",
            compact ? "min-w-[54px]" : "min-w-[62px]"
          )}
        >
          <Clock size={13} className="shrink-0 text-zinc-500" aria-hidden />
          <span
            className={cn(
              "font-bold text-zinc-100",
              compact ? "text-sm" : "text-[15px]"
            )}
          >
            {convertMsToHM(session.timeMs)}
          </span>
        </span>
        <span
          title={t("card.points")}
          className="flex min-w-[52px] items-center justify-end gap-1.5 tabular-nums"
        >
          <img
            src="/images/points.png"
            alt=""
            aria-hidden
            className="h-4 w-4 shrink-0 object-contain"
          />
          <span
            className={cn(
              "font-bold text-amber-300",
              compact ? "text-sm" : "text-[15px]"
            )}
          >
            {session.points}
          </span>
        </span>
      </div>

      {isManual ? (
        <div className="flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            onClick={() => onEdit(session)}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            title={t("card.edit")}
            aria-label={t("card.edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(session)}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            title={t("card.delete")}
            aria-label={t("card.delete")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div className="flex w-[60px] shrink-0 items-center justify-center">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-help rounded-lg p-2 text-zinc-600 transition-colors hover:text-zinc-400"
                  aria-label={t("card.recorded_tooltip")}
                >
                  <Lock size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-center">
                {t("card.recorded_tooltip")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
