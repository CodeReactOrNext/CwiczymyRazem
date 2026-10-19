import MainContainer from "components/MainContainer";
import { BossesView } from "feature/bosses/BossesView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const BossesPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Boss Fights | RiffQuest</title>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
    <BossesView />
  </MainContainer>
);

BossesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"bosses"} subtitle='Boss Fights' variant='primary' wide>
      {page}
    </AppLayout>
  );
};

export default BossesPage;

BossesPage.getInitialProps = withAuthInitialProps();
