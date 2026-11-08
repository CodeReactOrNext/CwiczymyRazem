import { DesktopLoginView } from "feature/user/view/DesktopLoginView/DesktopLoginView";
import type { NextPage } from "next";
import Head from "next/head";

/**
 * Where the desktop app sends players to sign in with Google — in their own
 * browser, since Google refuses sign-in inside Electron. No app layout and no
 * server-side auth gate: being signed in on the website is optional here.
 */
const DesktopLoginPage: NextPage = () => (
  <>
    <Head>
      <title>Sign in to the desktop app — riff.quest</title>
      <meta name='robots' content='noindex' />
    </Head>
    <DesktopLoginView />
  </>
);

export default DesktopLoginPage;
