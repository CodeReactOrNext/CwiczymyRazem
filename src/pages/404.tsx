/* eslint-disable @next/next/no-img-element */
import { useTranslation } from "hooks/useTranslation";
import MainLayout from "layouts/MainLayout";
import NotFoundLayout from "layouts/NotFoundLayout";
import type { NextPage } from "next";



const NotFoundPage: NextPage = () => {
  const { t } = useTranslation("404");

  return (
    <MainLayout variant='primary' subtitle={t("subtitle_text")}>
      <NotFoundLayout />
    </MainLayout>
  );
};

export default NotFoundPage;


