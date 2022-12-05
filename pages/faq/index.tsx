import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import FaqView from "views/FaqView";


const FaqPage: NextPage = () => {
  return <FaqView />;
};

export default FaqPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "faq"])),
    },
  };
}
