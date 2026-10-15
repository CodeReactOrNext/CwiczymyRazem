import MainContainer from "components/MainContainer";
import { SupporterPanelView } from "feature/supporterPanel/SupporterPanelView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const SupporterPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Supporter panel | RiffQuest</title>
      <meta name='robots' content='noindex' />
    </Head>
    <SupporterPanelView />
  </MainContainer>
);

SupporterPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"supporter"}
      subtitle='Supporter panel'
      variant='primary'
      wide>
      {page}
    </AppLayout>
  );
};

export default SupporterPage;

SupporterPage.getInitialProps = withAuthInitialProps();
