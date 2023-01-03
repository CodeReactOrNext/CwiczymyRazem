import { i18n } from "next-i18next";
import { toast } from "react-toastify";

export const updateUserEmailSuccess = () => {
  toast.success(i18n?.t("toast:toast.update_email"));
};

export const updateUserPasswordSuccess = () => {
  toast.success(i18n?.t("toast:toast.update_password"));
};

export const updateUserAvatarSuccess = () => {
  toast.success(i18n?.t("toast:toast.update_avatar "));
};

export const newUserInfo = (points: number) => {
  if (points === 0) {
    toast.info(i18n?.t("toast:toast.new_user_tip"), {
      autoClose: 10000,
    });
  }
};
