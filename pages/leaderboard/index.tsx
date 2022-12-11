import LeadboardLayout from "layouts/LeadboardLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
const LeaderBoardPage: NextPage = () => {
  return <LeadboardLayout />;
};

export default LeaderBoardPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common"])),
    },
  };
}
