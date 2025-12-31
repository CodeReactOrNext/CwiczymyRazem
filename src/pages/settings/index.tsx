import SettingsView from "feature/settings/SettingsView";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const Settings: NextPageWithLayout = () => {
  const { t } = useTranslation("settings");

  return <SettingsView />;
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={null}
      subtitle="Settings"
      variant='secondary'>
      {page}
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
