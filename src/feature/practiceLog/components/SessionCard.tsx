import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Clock, History, Lock, Pencil, Star, Trash2 } from "lucide-react";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META, SESSION_TYPE_CONFIG } from "../config/sessionType";
import type { PracticeLogSession } from "../types/practiceLog.types";

interface SessionCardProps {
  session: PracticeLogSession;
  onEdit: (session: PracticeLogSession) => void;
  onDelete: (session: PracticeLogSession) => void;
  compact?: boolean;
}

export const SessionCard = ({
  session,
  onEdit,
  onDelete,
  compact = false,
}: SessionCardProps) => {
  const { t } = useTranslation(["practice_log", "common"]);
  const config = SESSION_TYPE_CONFIG[session.type];
  const TypeIcon = config.icon;
  const isManual = session.type === "manual";
  const isBackdated =
    !!session.isDateBackReport && session.isDateBackReport !== "0";

  const categorySplit = session.timeSumary
    ? CATEGORY_META.filter(({ key }) => session.timeSumary![key] > 0)
    : [];

  return (
    <div className="group relative flex items-stretch gap-0 overflow-hidden rounded-xl bg-zinc-900/40 ring-1 ring-white/5 transition-all hover:bg-zinc-900/70 hover:ring-white/10">
      {/* Type accent bar */}
      <div className={cn("w-1 shrink-0", config.accentBar)} />

      <div
        className={cn(
          "flex flex-1 items-center gap-3 min-w-0",
          compact ? "px-3 py-2.5" : "px-4 py-3.5"
        )}
      >
        {/* Type icon tile */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border",
            config.iconTile,
            compact ? "h-9 w-9" : "h-11 w-11"
          )}
        >
          <TypeIcon size={compact ? 16 : 18} />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-zinc-100">
              {session.title}
            </p>
            <span
              className={cn(
                "hidden xs:inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                config.badge
              )}
            >
              {t(config.labelKey)}
            </span>
            {isBackdated && (
              <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                <History size={9} />
                {t("card.backdated")}
              </span>
            )}
          </div>

          {session.description && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {session.description}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1 font-mono">
              <Clock size={10} />
              {session.date.toLocaleTimeString("en", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {!compact &&
              categorySplit.map(({ key, labelKey, text, dot }) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                  <span className={cn("font-semibold", text)}>
                    {convertMsToHM(session.timeSumary![key])}
                  </span>
                  <span className="hidden sm:inline">{t(labelKey)}</span>
                </span>
              ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-zinc-500" />
              <span className="text-sm font-bold tabular-nums text-zinc-200">
                {convertMsToHM(session.timeMs)}
              </span>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">
              {t("card.duration")}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-amber-500/[0.06] px-2.5 py-1.5">
            <div className="flex items-center gap-1">
              <Star size={11} className="text-amber-400" fill="currentColor" />
              <span className="text-sm font-bold tabular-nums text-amber-300">
                {session.points}
              </span>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-amber-500/50">
              {t("card.points")}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isManual ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onEdit(session)}
              className="rounded-lg bg-zinc-800/60 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title={t("card.edit")}
              aria-label={t("card.edit")}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(session)}
              className="rounded-lg bg-zinc-800/60 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title={t("card.delete")}
              aria-label={t("card.delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0">
                  <button
                    disabled
                    className="cursor-not-allowed rounded-lg bg-zinc-800/40 p-2 text-zinc-600"
                    aria-label={t("card.recorded_tooltip")}
                  >
                    <Lock size={14} />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px] text-center">
                {t("card.recorded_tooltip")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
