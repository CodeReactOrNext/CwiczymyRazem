import FaqView from "feature/faq/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";

const FaqPage: NextPage = () => {
  const { t } = useTranslation("faq");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });

  return (
    <AppLayout pageId={"faq"} subtitle={t("faq")} variant='secondary'>
      <FaqView />
    </AppLayout>
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
