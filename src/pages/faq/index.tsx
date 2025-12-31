import FaqView from "feature/faq/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import nextI18nextConfig from "../../../next-i18next.config";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const FaqPage: NextPageWithLayout = () => {
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
      <FaqView />
    </>
  );
};

FaqPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="faq" subtitle="FAQ" variant="secondary">
      {page}
    </AppLayout>
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
