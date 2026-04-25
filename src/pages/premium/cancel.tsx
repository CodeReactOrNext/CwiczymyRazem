import { ArrowLeft, XCircle, Zap } from "lucide-react";
import Head from "next/head";
import Link from "next/link";

export default function PremiumCancelPage() {
  return (
    <>
      <Head>
        <title>Payment cancelled | Riff Quest</title>
      </Head>

      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-zinc-500" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-white italic">
              Payment <span className="text-zinc-400">cancelled</span>
            </h1>
            <p className="text-zinc-400">
              You haven't been charged. You can try again whenever you're ready.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/premium"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Try again
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
