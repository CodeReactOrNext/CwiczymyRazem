import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { EmptyState } from "components/EmptyState/EmptyState";
import {
  WidgetHeader,
  WidgetLink,
} from "feature/dashboard/components/widgets/WidgetHeader";
import { useTranslation } from "hooks/useTranslation";
import { NotebookPen } from "lucide-react";
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
    <Card className="flex flex-col gap-3 p-5 sm:p-6">
      <WidgetHeader
        title={t("widget.title")}
        action={
          <WidgetLink href="/practice-log">{t("widget.view_all")}</WidgetLink>
        }
      />

      {isLoading || sessions === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : recentSessions.length === 0 ? (
        <EmptyState
          size='compact'
          className='bg-transparent px-0'
          icon={<NotebookPen />}
          title={t("widget.empty")}
        />
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
    </Card>
  );
};
