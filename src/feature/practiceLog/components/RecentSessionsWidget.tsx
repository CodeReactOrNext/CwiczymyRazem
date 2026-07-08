import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { usePracticeLogSessions } from "../hooks/usePracticeLogSessions";
import type { PracticeLogSession } from "../types/practiceLog.types";
import { DeleteReportDialog } from "./DeleteReportDialog";
import { EditReportModal } from "./EditReportModal";
import { SessionCard } from "./SessionCard";

const RECENT_SESSIONS_COUNT = 10;

interface RecentSessionsWidgetProps {
  userAuth: string;
  onMutated?: () => void;
}

export const RecentSessionsWidget = ({
  userAuth,
  onMutated,
}: RecentSessionsWidgetProps) => {
  const { t } = useTranslation("practice_log");
  const { sessions, isLoading, refresh } = usePracticeLogSessions(userAuth);
  const [editingSession, setEditingSession] =
    useState<PracticeLogSession | null>(null);
  const [deletingSession, setDeletingSession] =
    useState<PracticeLogSession | null>(null);

  const recentSessions = (sessions ?? []).slice(0, RECENT_SESSIONS_COUNT);

  const handleMutated = () => {
    refresh();
    onMutated?.();
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-zinc-800/30 p-4 ring-1 ring-white/5 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History size={17} className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            {t("widget.title")}
          </h3>
        </div>
        <Link
          href="/practice-log"
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-semibold text-cyan-400 transition-colors hover:bg-white/10 hover:text-cyan-300"
        >
          {t("widget.view_all")}
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading || sessions === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-zinc-900/40"
            />
          ))}
        </div>
      ) : recentSessions.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          {t("widget.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={setEditingSession}
              onDelete={setDeletingSession}
              compact
            />
          ))}
        </div>
      )}

      <EditReportModal
        session={editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSaved={handleMutated}
      />
      <DeleteReportDialog
        session={deletingSession}
        onOpenChange={(open) => !open && setDeletingSession(null)}
        onDeleted={handleMutated}
      />
    </section>
  );
};
