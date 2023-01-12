import MainLayout from "layouts/MainLayout";
import SettingsLayout from "layouts/SettingsLayout/SettingsLayout";
import { useTranslation } from "react-i18next";

const SettingsView = () => {
  const { t } = useTranslation("settings");
  return (
    <MainLayout subtitle={t("settings_subtilte")} variant='primary'>
      <SettingsLayout />
    </MainLayout>
  );
};

export default SettingsView;
