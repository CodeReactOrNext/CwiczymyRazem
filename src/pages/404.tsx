/* eslint-disable @next/next/no-img-element */
import MainLayout from "layouts/MainLayout";
import NotFoundLayout from "layouts/NotFoundLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";

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
