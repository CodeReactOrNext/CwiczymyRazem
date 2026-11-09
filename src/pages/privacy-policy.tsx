import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const PrivacyPolicyPage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Privacy Policy — How Riff Quest Handles Your Practice Data</title>
        <meta name="description" content="How Riff Quest collects, stores and protects your guitar practice data and account details, and how to export or delete them." />
        <link rel='canonical' href='https://riff.quest/privacy-policy' />
        <meta property="og:title" content="Privacy Policy — How Riff Quest Handles Your Practice Data" />
        <meta property="og:description" content="Privacy Policy for Riff Quest. We value your privacy and are transparent about how we handle your data." />
        <meta property="og:url" content="https://riff.quest/privacy-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy — How Riff Quest Handles Your Practice Data" />
        <meta name="twitter:description" content="Privacy Policy for Riff Quest. We value your privacy and are transparent about how we handle your data." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>
      
      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
               <Link href="/" className="flex items-center gap-2">
                  <Image
                    src='/images/longlightlogo.svg'
                    alt='Riff Quest'
                    width={120}
                    height={32}
                    className='h-6 w-auto'
                    priority
                  />
               </Link>
               <div className="flex items-center gap-4">
                 <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                   Login
                 </Link>
                 <Link href="/signup" className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">
                   Start Free
                 </Link>
               </div>
            </div>
          </nav>
        )}

        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-4xl font-black text-white mb-8">Privacy Policy</h1>
          <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-zinc-400">
            <p className="text-lg">
              At Riff Quest, we are committed to protecting your privacy and being transparent about how we collect and use your data.
            </p>
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p>
                To provide you with the best experience, we collect basic information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name and email address when you sign up using Google OAuth or email.</li>
                <li><strong>Practice Data:</strong> Your logged practice sessions, skill progression, and repertoire management.</li>
                <li><strong>Usage Data:</strong> Anonymous technical data to help us improve the app and fix bugs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Data</h2>
              <p>
                Your data is used solely to power the Riff Quest experience:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To synchronize your practice history across devices.</li>
                <li>To calculate your stats, levels, and achievements.</li>
                <li>To provide community-rated difficulty for songs based on user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Emails</h2>
              <p>
                We send two kinds of email to the address on your account:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account emails:</strong> a welcome message when you sign up, password resets and email address changes. These are part of running your account and are always sent.</li>
                <li><strong>Optional emails:</strong> streak reminders, season updates (a season starting, ending soon and your results) and an occasional roundup of what&apos;s new at Riff Quest. We only send these if you agree &mdash; on the sign-up form, when the app asks you, or in Settings.</li>
              </ul>
              <p className="mt-4">
                You can withdraw your consent at any time: turn the emails off in Settings &rarr; Notifications, use the &ldquo;Manage email preferences&rdquo; link at the bottom of every email, or press &ldquo;Unsubscribe&rdquo; in your mail app. We keep a record of when and how you answered.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
              <p>
                 We do not sell your personal data. We only share data with trusted third parties necessary for app operation (e.g., Firebase for authentication and database, Sentry for error tracking, Resend for delivering emails).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. AI Assistants (MCP Connections)</h2>
              <p>
                You can connect an AI assistant you use, such as Claude, ChatGPT or Cursor, to your account through our MCP server. It is a supporter perk, and it is off until you set it up yourself, either by signing in from the assistant and pressing &ldquo;Allow&rdquo;, or by creating a personal token in Settings &rarr; AI assistants.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>What the assistant can read:</strong> your profile summary (display name, level, points, streak), practice history and calendar (including the days you planned), skills, tempo goals, practice plans, songs on your lists, your own exercises and scored runs, plus the public exercise library and wiki. It never receives your password, email address or payment details, and it can&apos;t see other players&apos; private data.</li>
                <li><strong>What it can change:</strong> only if you allow changes, it can save practice plans, days on your practice calendar, tempo goals, songs on your lists and private exercises, and log practice sessions you played outside the app, up to 35 changes a day. It can&apos;t change your points directly, publish anything or change your account settings.</li>
                <li><strong>Who receives the data:</strong> the data goes only to the assistant you connected, and only when it asks for it during your conversation. We don&apos;t run any AI model for this and don&apos;t send your data to AI providers on our own. Once the assistant has received data, it is part of your conversation there and is handled under that provider&apos;s privacy policy (for example Anthropic&apos;s for Claude or OpenAI&apos;s for ChatGPT).</li>
                <li><strong>What we store:</strong> for each connection, the app&apos;s name and address, what you allowed it to do, and when it was connected and last used; for personal tokens, the name you gave them. Tokens are stored only as one-way hashes, never in readable form. We also keep a daily count of changes per account and, to stop abuse of the sign-in pages, an hourly request count keyed by a one-way hash of the IP address.</li>
                <li><strong>How long:</strong> access tokens from signing in expire after 1 hour and are renewed automatically; the connection itself lapses after 90 days without use. Personal tokens last until you revoke them. Connection records are kept until you disconnect, and are deleted together with the rest of your data if you ask us to delete your account (see Your Rights).</li>
                <li><strong>Disconnecting:</strong> in Settings &rarr; AI assistants, &ldquo;Disconnect&rdquo; (for apps you signed in to) or &ldquo;Revoke&rdquo; (for personal tokens) ends access immediately. Removing the connector inside the AI app doesn&apos;t delete what that app already received; ask its provider for that.</li>
              </ul>
              <p className="mt-4">
                More about how it works: <Link href="/wiki/ai-assistants" className="text-cyan-400 hover:underline">Connect Claude or another AI assistant</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p>
                You can ask us at any time for a copy of your data or for your account to be deleted. Email <a href="mailto:mjablonskidev@gmail.com" className="text-cyan-400 hover:underline">mjablonskidev@gmail.com</a> from the address on your account, or message us on Discord, and we&apos;ll handle it within 30 days.
              </p>
              <p className="mt-4">
                Deleting your account removes your sign-in, profile, practice history, statistics, plans, goals, songs, files, recordings and AI assistant connections. Things other players rely on are anonymized instead of removed, so their plans and conversations don&apos;t break: your chat messages and published community exercises stay under &ldquo;Deleted player&rdquo;, your marketplace listings are taken down, and leadership of a guild you run passes to another member.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or want your data deleted, email us at <a href="mailto:mjablonskidev@gmail.com" className="text-cyan-400 hover:underline">mjablonskidev@gmail.com</a> or reach out on our <Link href="https://discord.gg/6yJmsZW2Ne" className="text-cyan-400 hover:underline">Discord server</Link>.
              </p>
            </section>

            <p className="pt-8 text-sm italic">
              Last updated: November 5, 2026
            </p>
          </div>
        </div>
        
        {!isLogged && <Footer />}
      </div>
    </>
  );
};

PrivacyPolicyPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="privacy-policy" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default PrivacyPolicyPage;
