import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import SettingsView from "feature/user/view/SettingsView";

const Settings: NextPage = () => {
  const { t } = useTranslation("settings");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <MainLayout subtitle={t("settings_subtilte")} variant='primary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <SettingsView />}
    </MainLayout>
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
