import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LeadboardView from "feature/leadboard/view/LeadboardView";

const LeaderBoardPage: NextPage = () => {
  return <LeadboardView />;
};

export default LeaderBoardPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "leadboard",
        "achievements",
        "toast",
      ])),
    },
  };
}
