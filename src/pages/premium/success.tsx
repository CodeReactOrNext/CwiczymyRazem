import Head from "next/head";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

export default function PremiumSuccessPage() {
  const userId = useAppSelector(selectUserAuth);
  const [confirmed, setConfirmed] = useState(false);

  // Poll Firestore until role === "premium" (webhook may be slightly delayed)
  useEffect(() => {
    if (!userId) return;

    let attempts = 0;
    const MAX = 12; // 12 × 2s = 24s max wait

    const poll = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.data()?.role === "premium") {
          setConfirmed(true);
          return;
        }
      } catch {}

      attempts++;
      if (attempts < MAX) setTimeout(poll, 2000);
      else setConfirmed(true); // show success anyway after timeout
    };

    poll();
  }, [userId]);

  return (
    <>
      <Head>
        <title>Premium aktywny | Riff Quest</title>
      </Head>

      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="relative h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                {confirmed
                  ? <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  : <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
                }
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-white italic">
              {confirmed
                ? <>Witaj w <span className="text-emerald-400">Premium!</span></>
                : <span className="text-zinc-300">Aktywowanie konta...</span>
              }
            </h1>
            <p className="text-zinc-400">
              {confirmed
                ? "Twoja płatność została zaakceptowana. Wszystkie funkcje AI są już odblokowane."
                : "Poczekaj chwilę — potwierdzamy Twoją płatność."
              }
            </p>
          </div>

          {confirmed && (
            <>
              {/* Features unlocked */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Odblokowane funkcje
                </div>
                {[
                  "AI Practice Summary (codzienny i tygodniowy)",
                  "AI Coach — spersonalizowany roadmap",
                  "Ocena sesji ćwiczeń przez AI",
                  "Szczegółowe wskazówki do każdego etapu nauki",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
              >
                Przejdź do dashboardu
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-xs text-zinc-600">
                Możesz zarządzać subskrypcją w{" "}
                <Link href="/settings" className="text-zinc-400 hover:text-white underline">
                  ustawieniach
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
