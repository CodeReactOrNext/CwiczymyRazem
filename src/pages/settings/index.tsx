import SettingsView from "feature/settings/SettingsView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const Settings: NextPageWithLayout = () => {

  return (
    <>
      <Head>
        <title>Settings | Riff Quest</title>
        <meta name='robots' content='noindex' />
      </Head>
      <SettingsView />
    </>
  );
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={null}
      subtitle="Settings"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default Settings;

Settings.getInitialProps = withAuthInitialProps();
