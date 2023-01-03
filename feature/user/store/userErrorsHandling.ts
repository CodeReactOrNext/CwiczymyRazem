import { SerializedError } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import i18n from "i18next";

export const loginViaEmailErrorHandler = (error: SerializedError) => {
  if (error.code === "auth/wrong-password") {
    toast.error(i18n.t("toast:errors.password"));
    return;
  }
  if (error.code === "auth/user-not-found") {
    toast.error(i18n.t("toast:errors.email"));
    return;
  }
  if (error.code === "auth/timeout") {
    toast.error(i18n.t("toast:errors.timeout"));
    return;
  }
  if (error.code === "auth/email-already-in-use") {
    toast.error(i18n.t("toast:errors.email_already-in-use"));
    return;
  }
  toast.error(i18n.t("toast:errors.login"));
};

export const loginViaGoogleErrorHandler = (error: SerializedError) => {
  if (error.code === "auth/popup-closed-by-user") {
    toast.error(i18n.t("toast:errors.popup_closed_by_user"));
    return;
  }
  if (error.code === "auth/timeout") {
    toast.error(i18n.t("toast:errors.timeout"));
    return;
  }
  toast.error(i18n.t("toast:errors.login"));
};

export const createAccountErrorHandler = (error: SerializedError) => {
  if (error.code === "auth/credential-already-in-use") {
    toast.error(i18n.t("toast:errors.credential_already_in_use"));
    return;
  }
  if (error.code === "auth/email-already-in-use") {
    toast.error(i18n.t("toast:errors.email_already-in-use"));
    return;
  }
  if (error.code === "auth/timeout") {
    toast.error(i18n.t("toast:errors.timeout"));
    return;
  }
  toast.error(i18n.t("toast:errors.singup"));
};

export const udpateDataErrorHandler = () => {
  toast.error(i18n.t("toast:errors.upadate"));
};

export const avatarErrorHandler = () => {
  toast.error(i18n.t("toast:errors.avatar_max"));
};
