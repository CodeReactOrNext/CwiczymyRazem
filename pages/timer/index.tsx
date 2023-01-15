import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import TimerView from "feature/user/view/TimerView";

const Timer: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });
  return (
    <MainLayout subtitle='Timer' variant='secondary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <TimerView />}
    </MainLayout>
  );
};

export default Timer;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "timer",
        "toast",
      ])),
    },
  };
}
