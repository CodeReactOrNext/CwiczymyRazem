import { i18n } from "utils/translation";
import { toast } from "sonner";

export const updateUserEmailSuccess = () => {
  toast.success(i18n?.t("toast:success.update_email"));
};
export const updateUserDataSuccess = () => {
  toast.success(i18n?.t("toast:success.update"));
};
export const updateUserPasswordSuccess = () => {
  toast.success(i18n?.t("toast:success.update_password"));
};
export const updateUserAvatarSuccess = () => {
  toast.success(i18n?.t("toast:success.update_avatar "));
};
export const updateDisplayNameSuccess = () => {
  toast.success(i18n?.t("toast:success.update_displayname"));
};
export const logOutInfo = () => {
  toast.success(i18n?.t("toast:success.logOut"));
};
export const restartInfo = () => {
  toast.success(i18n?.t("toast:success.restart"));
};
export const reportSuccess = () => {
  toast.success(i18n?.t("toast:success.report_success"));
};
export const signUpSuccess = () => {
  toast.success(i18n?.t("toast:success.singup"));
};
