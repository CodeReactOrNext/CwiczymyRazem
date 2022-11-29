import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import SingupView from "../../feature/user/view/SingupView/SingupView";
const SignUpPage: NextPage = () => {
  return <SingupView />;
};

export default SignUpPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "signup"])),
    },
  };
}
