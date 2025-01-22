import FaqView from "feature/faq/view/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
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
