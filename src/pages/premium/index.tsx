import Head from "next/head";
import { UpgradeContent } from "feature/premium/components/UpgradeModal";

export default function PremiumPage() {
  return (
    <>
      <Head>
        <title>Choose your plan | Riff Quest</title>
      </Head>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <UpgradeContent />
        </div>
      </div>
    </>
  );
}
