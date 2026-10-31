import { OAuthConsentView } from "feature/settings/components/OAuthConsentView";
import type { NextPage } from "next";
import Head from "next/head";

/**
 * The OAuth consent screen MCP clients send players to. No app layout and no
 * server-side auth gate: a player who isn't signed in is offered the login and
 * brought back here (see lib/mcp/oauth/postLoginRedirect).
 */
const OAuthAuthorizePage: NextPage = () => (
  <>
    <Head>
      <title>Connect an app — riff.quest</title>
      <meta name='robots' content='noindex' />
    </Head>
    <OAuthConsentView />
  </>
);

export default OAuthAuthorizePage;
