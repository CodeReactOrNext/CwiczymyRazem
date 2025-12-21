import AdminLayout from "feature/admin/layouts/AdminLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps } from "next";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminUsers } from "feature/admin/hooks/useAdminUsers";
import { UserManagementTable } from "feature/admin/components/UserManagementTable";
import { UserAnalytics } from "feature/admin/components/UserAnalytics";
import { UserGrowthChart } from "feature/admin/components/UserGrowthChart";
import AdminLogin from "feature/admin/components/AdminLogin";
import { useEffect } from "react";
import { TrendingUp } from "lucide-react";

const AdminUsersPage = () => {
  const {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  } = useAdminAuth((pass) => fetchUsers(pass));

  const {
    filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm,
    userStats,
    fetchUsers
  } = useAdminUsers(password);

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

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="p-8 space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col gap-2">
           <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">User Community</h2>
           <p className="text-zinc-500 font-medium text-sm">Managing the ecosystem of {userStats.totalUsers} registered guitarists.</p>
        </header>

        <UserAnalytics 
          totalUsers={userStats.totalUsers} 
          recentUsers={userStats.recentUsers} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <UserGrowthChart data={userStats.registrationTrend} />
           </div>
           <div className="lg:col-span-1 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-6 flex flex-col justify-center items-center text-center gap-4">
              <div className="h-16 w-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                 <TrendingUp className="h-8 w-8 text-black" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase">Growth Active</h4>
                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Community expanding consistently</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 w-full">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500">
                  <span>Growth Velocity</span>
                  <span className="text-cyan-500">+12%</span>
                </div>
              </div>
           </div>
        </div>
        
        <UserManagementTable 
          users={filteredUsers} 
          isLoading={isLoading} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
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

export default AdminUsersPage;
