import { UpgradeContent } from "feature/premium/components/UpgradeModal";
import { selectUserInfo } from "feature/user/store/userSlice";
import Head from "next/head";
import Link from "next/link";
import { useAppSelector } from "store/hooks";

export default function PremiumPage() {
  const userInfo = useAppSelector(selectUserInfo);
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";

  return (
    <>
      <Head>
        <title>Choose your plan | Riff Quest</title>
        <meta name="description" content="Compare Riff Quest plans and upgrade to Practice Master for AI-powered practice insights, custom plans, and premium guitar tracking features." />
        <link rel='canonical' href='https://riff.quest/premium' />
        <meta property="og:title" content="Choose your plan | Riff Quest" />
        <meta property="og:description" content="Compare Riff Quest plans and upgrade to Practice Master for AI-powered practice insights, custom plans, and premium guitar tracking features." />
        <meta property="og:url" content="https://riff.quest/premium" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Choose your plan | Riff Quest" />
        <meta name="twitter:description" content="Compare Riff Quest plans and upgrade to Practice Master for AI-powered practice insights, custom plans, and premium guitar tracking features." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        {isMaster ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">You&apos;re on Practice Master</p>
            <p className="text-zinc-400 mb-6">You already have access to all features.</p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-white hover:bg-zinc-100 px-6 py-3 text-sm font-bold text-black transition-colors"
            >
              Go to app →
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <UpgradeContent />
          </div>
        )}
      </div>
    </>
  );
}
