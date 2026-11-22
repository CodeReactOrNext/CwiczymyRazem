import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { useAppDispatch } from "store/hooks";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Sign out?" — the one confirmation in front of logging out, shared by the
 * account menu in the header and the phone's More sheet. Mount it outside the
 * menu or sheet that opens it: those close on select and would take a dialog
 * inside them down too.
 */
export const LogoutDialog = ({ open, onOpenChange }: LogoutDialogProps) => {
  const { t } = useTranslation("nav");
  const dispatch = useAppDispatch();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("sign_out")}
      description={t("sign_out_confirm")}
      cancelLabel={t("cancel")}
      confirmLabel={t("sign_out")}
      destructive
      onConfirm={() => {
        dispatch(logUserOff());
        onOpenChange(false);
      }}
    />
  );
};
