import { i18n } from "next-i18next";
import { toast } from "react-toastify";

export const updateUserEmailSuccess = () => {
  toast.success(i18n?.t("toast:success.update_email"));
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
