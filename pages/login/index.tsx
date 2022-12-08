import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { selectUserAuth } from "../../feature/user/store/userSlice";
import LoginView from "../../feature/user/view/LoginView/LoginView";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../store/hooks";

const LoginPage: NextPage = (props) => {
  // const isLoggedIn = useAppSelector(selectUserAuth);
  return <LoginView />;
};

export default LoginPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "login",
        "yup_errors",
      ])),
    },
  };
}
