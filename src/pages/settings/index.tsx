import SettingsView from "feature/settings/SettingsView";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

const Settings: NextPage = () => {
  const { t } = useTranslation("settings");


  return (
    <AppLayout
      pageId={null}
      subtitle={t("settings_subtilte")}
      variant='secondary'>
      <SettingsView />
    </AppLayout>
  );
};

export default Settings;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
        "common",
        "settings",
        "yup_errors",
        "toast",
  ],
});
