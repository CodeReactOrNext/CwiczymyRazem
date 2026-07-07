import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
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
    <AlertDialog open={!!session} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-none bg-zinc-900 text-zinc-100 sm:rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-zinc-50">
            {t("delete_dialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed text-zinc-400">
            {t("delete_dialog.description", {
              title: session?.title ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="border-none bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
          >
            {t("delete_dialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-500 text-white"
          >
            {isDeleting ? t("delete_dialog.deleting") : t("delete_dialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
