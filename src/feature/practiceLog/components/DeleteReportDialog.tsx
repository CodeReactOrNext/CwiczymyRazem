import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";
import { toast } from "sonner";

import { deletePracticeReport } from "../services/practiceLogMutations.service";
import type { PracticeLogSession } from "../types/practiceLog.types";

interface DeleteReportDialogProps {
  session: PracticeLogSession | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export const DeleteReportDialog = ({
  session,
  onOpenChange,
  onDeleted,
}: DeleteReportDialogProps) => {
  const { t } = useTranslation("practice_log");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!session) return;
    setIsDeleting(true);
    try {
      await deletePracticeReport(session.id);
      toast.success(t("toast.delete_success"));
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      console.error("Failed to delete report:", error);
      toast.error(t("toast.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={!!session}
      onOpenChange={onOpenChange}
      title={t("delete_dialog.title")}
      description={t("delete_dialog.description", {
        title: session?.title ?? "",
      })}
      cancelLabel={t("delete_dialog.cancel")}
      confirmLabel={
        isDeleting ? t("delete_dialog.deleting") : t("delete_dialog.confirm")
      }
      onConfirm={handleDelete}
      destructive
      loading={isDeleting}
    />
  );
};
