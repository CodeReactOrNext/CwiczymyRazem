import AdminLayout from "feature/admin/layouts/AdminLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps } from "next";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminUsers } from "feature/admin/hooks/useAdminUsers";
import AdminLogin from "feature/admin/components/AdminLogin";
import { useEffect } from "react";
import { TrendingUp, Users } from "lucide-react";

const AdminUsersPage = () => {
  const {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  } = useAdminAuth((pass) => fetchUsers(pass));

  const {
    isLoading,
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
           <p className="text-zinc-500 font-medium text-sm">Managing the ecosystem of registered guitarists.</p>
        </header>

        <div className="flex justify-center">
           <div className="w-full max-w-md rounded-3xl border border-white/5 bg-zinc-950/50 p-12 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-xl">
              <div className="h-20 w-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
                 <Users className="h-10 w-10 text-cyan-500" />
              </div>
              <div>
                <div className="text-6xl font-black text-white tracking-tight tabular-nums">
                  {isLoading ? "..." : userStats.totalUsers}
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-3">Total Registered Players</p>
              </div>
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

export default AdminUsersPage;
