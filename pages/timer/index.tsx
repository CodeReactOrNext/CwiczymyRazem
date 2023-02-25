import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import TimerView from "feature/user/view/TimerView";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const Timer: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });
  return (
    <AuthLayoutWrapper pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <TimerView />}
    </AuthLayoutWrapper>
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
