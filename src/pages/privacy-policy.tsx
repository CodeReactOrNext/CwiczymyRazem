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
        <title>Privacy Policy - Riff Quest</title>
        <meta name="description" content="Privacy Policy for Riff Quest. We value your privacy and are transparent about how we handle your data. Learn how we protect your guitar practice information and personal details." />
        <link rel='canonical' href='https://riff.quest/privacy-policy' />
        <meta property="og:title" content="Privacy Policy - Riff Quest" />
        <meta property="og:description" content="Privacy Policy for Riff Quest. We value your privacy and are transparent about how we handle your data." />
        <meta property="og:url" content="https://riff.quest/privacy-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - Riff Quest" />
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
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing</h2>
              <p>
                 We do not sell your personal data. We only share data with trusted third parties necessary for app operation (e.g., Firebase for authentication and database, Sentry for error tracking).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
              <p>
                You have full control over your data. You can export your data or delete your account at any time within the settings menu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, feel free to reach out on our <Link href="https://discord.gg/6yJmsZW2Ne" className="text-cyan-400 hover:underline">Discord server</Link>.
              </p>
            </section>

            <p className="pt-8 text-sm italic">
              Last updated: January 27, 2026
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
