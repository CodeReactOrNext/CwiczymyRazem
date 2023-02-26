import type { NextPage } from "next";
import { useTranslation } from "react-i18next";

import FaqView from "feature/faq/view/FaqView";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import useAutoLogIn from "hooks/useAutoLogIn";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const FaqPage: NextPage = () => {
  const { t } = useTranslation("faq");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });

  return (
    <AuthLayoutWrapper pageId={"faq"} subtitle={t("faq")} variant='secondary'>
      <FaqView />
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
