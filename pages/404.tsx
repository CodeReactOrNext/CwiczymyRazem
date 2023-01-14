/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import NotFoundLayout from "layouts/NotFoundLayout";

const NotFoundPage: NextPage = () => {
  const { t } = useTranslation("404");

  return (
    <MainLayout variant='primary' subtitle={t("subtitle_text")}>
      <NotFoundLayout />
    </MainLayout>
  );
};

export default NotFoundPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "404",
        "toast",
      ])),
    },
  };
}
