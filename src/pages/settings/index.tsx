import SettingsView from "feature/settings/SettingsView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useTranslation } from "hooks/useTranslation";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

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
