import AdminLayout from "feature/admin/layouts/AdminLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps } from "next";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminActivity } from "feature/admin/hooks/useAdminActivity";
import { ActivityFeed } from "feature/admin/components/ActivityFeed";
import { ActivityTrendChart } from "feature/admin/components/ActivityTrendChart";
import { FeatureUsageChart } from "feature/admin/components/FeatureUsageChart";
import { FeatureTrendsChart } from "feature/admin/components/FeatureTrendsChart";
import { SkillDistributionChart } from "feature/admin/components/SkillDistributionChart";
import AdminLogin from "feature/admin/components/AdminLogin";
import { User, Clock, MousePointer2 } from "lucide-react";

const AdminActivityPage = () => {
  const {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  } = useAdminAuth((pass) => fetchActivity(pass));

  const {
    logs,
    activityTrend,
    featureUsage,
    skillDistribution,
    isLoading,
    stats,
    fetchActivity
  } = useAdminActivity(password);

  if (!isAuth) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <AdminLogin 
            password={password}
            setPassword={setPassword}
            onLogin={handleLogin}
          />
        </div>
      </AdminLayout>
    );
  }

  const analytics = [
    { label: "Active Users (30d)", value: stats.activeUsers30d, icon: User, color: "text-link", bg: "bg-link/10" },
    { label: "Study Time (min)", value: stats.totalTimeMinutes.toLocaleString(), icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Daily Interactions", value: stats.totalEvents, icon: MousePointer2, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="p-8 space-y-8 animate-in fade-in duration-1000">
        <header className="flex flex-col gap-2">
           <div className="flex items-center gap-3">
             <div className="h-8 w-1.5 bg-cyan-500 rounded-full" />
             <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Advanced Ecosystem Analytics</h2>
           </div>
           <p className="text-zinc-500 font-medium text-sm ml-4 border-l border-white/5 pl-4">In-depth behavioral analysis of {stats.activeUsers30d} contributing guitarists.</p>
        </header>

        {/* Global Performance Matrix */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {analytics.map((item) => (
            <div key={item.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:bg-zinc-900/60 shadow-xl">
              <div className="flex items-center gap-6">
                <div className={`rounded-2xl ${item.bg} p-4 ${item.color} shadow-lg shadow-black/30 group-hover:scale-110 transition-all duration-300`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1">{item.label}</p>
                  <p className="text-3xl font-black text-white tracking-tight">{item.value}</p>
                </div>
              </div>
              <div className={`absolute -bottom-6 -right-6 h-20 w-20 rounded-full ${item.bg} opacity-10 blur-2xl transition-opacity group-hover:opacity-30`} />
            </div>
          ))}
        </div>

        {/* Analytical Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[450px]">
           <div className="lg:col-span-8">
              <ActivityTrendChart data={activityTrend} />
           </div>
           <div className="lg:col-span-4">
              <FeatureUsageChart data={featureUsage} />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[450px]">
           <div className="lg:col-span-12">
              <FeatureTrendsChart data={activityTrend} />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[450px]">
           <div className="lg:col-span-4">
              <SkillDistributionChart data={skillDistribution} />
           </div>
           <div className="lg:col-span-8">
              <ActivityFeed logs={logs} />
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return { notFound: true };
  }

  try {
    const userId = (session.user as any).id;
    if (!userId) return { notFound: true };

    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData || userData.role !== "admin") {
      return { notFound: true };
    }

    return { props: {} };
  } catch (error) {
    return { notFound: true };
  }
};

export default AdminActivityPage;
