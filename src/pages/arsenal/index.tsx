import { ArsenalView } from "feature/arsenal/ArsenalView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ArsenalPage: NextPageWithLayout = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <>
      <Head>
        <title>Guitar Arsenal | Riff Quest</title>
        <meta name="description" content="Collect and equip guitars with your Fame Points." />
      </Head>
      {isLoggedIn ? <ArsenalView /> : <PageLoadingLayout />}
    </>
  );
};

ArsenalPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="arsenal" subtitle="Guitar Arsenal" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default ArsenalPage;
