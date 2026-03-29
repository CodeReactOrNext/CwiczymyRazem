import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const TermsOfServicePage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Terms of Service - Riff Quest</title>
        <meta name="description" content="Terms of Service for Riff Quest. Read our terms and conditions for using the guitar practice tracking platform." />
        <link rel="canonical" href="https://riff.quest/terms-of-service" />
        <meta property="og:title" content="Terms of Service - Riff Quest" />
        <meta property="og:description" content="Terms of Service for Riff Quest. Read our terms and conditions for using the guitar practice tracking platform." />
        <meta property="og:url" content="https://riff.quest/terms-of-service" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - Riff Quest" />
        <meta name="twitter:description" content="Terms of Service for Riff Quest." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>

      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/longlightlogo.svg"
                  alt="Riff Quest"
                  width={120}
                  height={32}
                  className="h-6 w-auto"
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
          <h1 className="text-4xl font-black text-white mb-8">Terms of Service</h1>
          <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-zinc-400">
            <p className="text-lg">
              By using Riff Quest, you agree to the following terms. Please read them carefully.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Riff Quest (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use of the Service</h2>
              <p>You agree to use Riff Quest only for lawful purposes. You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service to harass, abuse, or harm other users.</li>
                <li>Attempt to gain unauthorized access to any part of the Service.</li>
                <li>Use automated tools to scrape, crawl, or extract data from the Service.</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the security of your account and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. User-Generated Content</h2>
              <p>
                By submitting content to Riff Quest (including song ratings, practice data, and community contributions), you grant us a non-exclusive, royalty-free license to use, display, and distribute that content within the Service.
              </p>
              <p>
                You retain ownership of your content. We do not claim any intellectual property rights over your personal practice data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
              <p>
                All content, features, and functionality of Riff Quest — including but not limited to the design, code, and trademarks — are the exclusive property of Riff Quest and protected by applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer of Warranties</h2>
              <p>
                Riff Quest is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Riff Quest shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may also delete your account at any time from the settings menu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the Service after changes constitutes your acceptance of the new Terms. We will notify users of significant changes via our{" "}
                <Link href="https://discord.gg/6yJmsZW2Ne" className="text-cyan-400 hover:underline">Discord server</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
              <p>
                If you have any questions about these Terms, please{" "}
                <Link href="/contact" className="text-cyan-400 hover:underline">contact us</Link>.
              </p>
            </section>

            <p className="pt-8 text-sm italic">
              Last updated: March 29, 2026
            </p>
          </div>
        </div>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

TermsOfServicePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="terms-of-service" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default TermsOfServicePage;
