import FaqView from "feature/faq/FaqView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";



const FaqPage: NextPageWithLayout = () => {
  const {  } = useAutoLogIn({
    redirects: {
      loggedOut: "/faq",
    },
  });

  const siteUrl = "https://riff.quest/faq";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <FaqView />
    </>
  );
};

FaqPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="faq" subtitle="FAQ" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default FaqPage;


