import SettingsView from "feature/user/view/SettingsView";
import type { NextPage } from "next";
import PageLoadingSpinner from "components/PageLoadingSpinner";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useAutoLogIn from "hooks/useAutoLogIn";

const Settings: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return !isLoggedIn ? (
    <PageLoadingSpinner layoutVariant='primary' />
  ) : (
    <SettingsView />
  );
};

export default Settings;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "settings"])),
    },
  };
}
