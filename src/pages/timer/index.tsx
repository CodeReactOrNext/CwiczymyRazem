import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper/AuthLayoutWrapper";

const Timer: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  const router = useRouter();

  const handleModeSelect = (mode: "timer" | "plan" | "auto") => {
    switch (mode) {
      case "timer":
        router.push("/timer/practice");
        break;
      case "plan":
        router.push("/timer/plans");
        break;
      case "auto":
        router.push("/timer/auto");
        break;
    }
  };

  return (
    <AuthLayoutWrapper pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {!isLoggedIn ? (
        <PageLoadingLayout />
      ) : (
        <PracticeModeSelector onSelectMode={handleModeSelect} />
      )}
    </AuthLayoutWrapper>
  );
};

export default Timer;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "timer",
        "toast",
        "exercises",
      ])),
    },
  };
}
