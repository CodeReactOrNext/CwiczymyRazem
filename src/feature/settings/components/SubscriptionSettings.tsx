import { selectUserInfo } from "feature/user/store/userSlice";
import { auth } from "utils/firebase/client/firebase.utils";
import { CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { toast } from "sonner";

const SubscriptionSettings = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const [loading, setLoading] = useState(false);

  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const planName = userInfo?.role === "master" ? "Practice Master" : userInfo?.role === "pro" ? "Practice Pro" : null;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const idToken = await user.getIdToken();

      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-100">Subscription</h3>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your premium plan and billing.</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPremium ? "bg-emerald-500/10" : "bg-zinc-800"}`}>
            <Sparkles className={`h-5 w-5 ${isPremium ? "text-emerald-400" : "text-zinc-500"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {planName ?? (isPremium ? "Premium" : "Free plan")}
            </p>
            {isPremium && userInfo?.premiumUntil && (
              <p className="text-xs text-zinc-500">
                Renews {new Date(userInfo.premiumUntil).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {!isPremium && (
              <p className="text-xs text-zinc-500">Upgrade to unlock Roadmap and practice summaries.</p>
            )}
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isPremium ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-zinc-800 text-zinc-400"}`}>
              {isPremium ? "Active" : "Free"}
            </span>
          </div>
        </div>

        <div className="h-px bg-zinc-800" />

        {isPremium ? (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage subscription
            {!loading && <ExternalLink className="h-3.5 w-3.5 ml-1 text-zinc-500" />}
          </button>
        ) : (
          <a
            href="/premium"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium
          </a>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSettings;
