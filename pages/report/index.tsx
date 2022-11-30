import ReportView from "feature/user/view/ReportView";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const ReportPage: NextPage = () => {
  return <ReportView />;
};

export default ReportPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "report"])),
    },
  };
}
