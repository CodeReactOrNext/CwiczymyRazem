import PageLoadingSpinner from "components/PageLoadingSpinner";
import TimerView from "feature/user/view/TimerView";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Timer: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return !isLoggedIn ? (
    <PageLoadingSpinner layoutVariant='primary' />
  ) : (
    <TimerView />
  );
};

export default Timer;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "timer"])),
    },
  };
}
