import SettingsView from "feature/settings/SettingsView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const Settings: NextPage = () => {
  const { t } = useTranslation("settings");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <AuthLayoutWrapper
      pageId={null}
      subtitle={t("settings_subtilte")}
      variant='secondary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <SettingsView />}
    </AuthLayoutWrapper>
  );
};

export default Settings;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "settings",
        "yup_errors",
        "toast",
      ])),
    },
  };
}
