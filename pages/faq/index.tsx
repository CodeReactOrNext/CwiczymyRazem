import type { NextPage } from "next";
import { useTranslation } from "react-i18next";

import FaqView from "views/FaqView";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import useAutoLogIn from "hooks/useAutoLogIn";
import AuthLayoutWrapper from "Hoc/AuthLayoutWrapper";

const FaqPage: NextPage = () => {
  const { t } = useTranslation("faq");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/leaderboard",
    },
  });

  return (
    <AuthLayoutWrapper pageId={"faq"} subtitle={t("faq")} variant='secondary'>
      {isLoggedIn ? <FaqView /> : <PageLoadingLayout />}
    </AuthLayoutWrapper>
  );
};

export default FaqPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "faq",
        "toast",
      ])),
    },
  };
}
