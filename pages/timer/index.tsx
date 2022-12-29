import PageLoadingSpinner from "components/PageLoadingSpinner";
import useAutoLogIn from "hooks/useAutoLogIn";
import TimerLayout from "layouts/TimerLayout";
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
    <TimerLayout />
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
