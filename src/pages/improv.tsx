import MainContainer from "components/MainContainer";
import { ImprovView } from "feature/improv/ImprovView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const ImprovPage: NextPageWithLayout = () => (
  <MainContainer noBorder>
    <Head>
      <title>Improv | RiffQuest</title>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
    <ImprovView />
  </MainContainer>
);

ImprovPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"improv"} subtitle='Improv' variant='primary' wide>
      {page}
    </AppLayout>
  );
};

export default ImprovPage;

ImprovPage.getInitialProps = withAuthInitialProps();
