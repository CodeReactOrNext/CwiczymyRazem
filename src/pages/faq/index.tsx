import FaqView from "feature/faq/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import nextI18nextConfig from "../../../next-i18next.config";

const FaqPage: NextPage = () => {
  const { t } = useTranslation("faq");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });

  const siteUrl = "https://riff.quest/faq";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <AppLayout pageId={"faq"} subtitle={t("faq")} variant='secondary'>
        <FaqView />
      </AppLayout>
    </>
  );
};

export default FaqPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "faq", "toast"],
        nextI18nextConfig
      )),
    },
  };
}
