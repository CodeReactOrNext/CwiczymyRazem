import { useState } from "react";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { DashboardStats } from "feature/admin/components/DashboardStats";
import { SongManagementTable } from "feature/admin/components/SongManagementTable";
import AdminLogin from "feature/admin/components/AdminLogin";
import AdminActionCenter from "feature/admin/components/AdminActionCenter";
import MassActionProgress from "feature/admin/components/MassActionProgress";
import CoverPickerModal from "feature/admin/components/CoverPickerModal";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminSongs } from "feature/admin/hooks/useAdminSongs";
import { useAdminBulkActions } from "feature/admin/hooks/useAdminBulkActions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps } from "next";

const AdminDashboard = () => {
  const [selectedSongForCover, setSelectedSongForCover] = useState<{ id: string; artist: string; title: string } | null>(null);

  const {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  } = useAdminAuth((pass) => fetchSongs(pass));

  const {
    songs,
    setSongs,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    fetchSongs,
    handleSave,
    handleManualVerify,
    handleUpdateCover,
    filteredSongs,
    stats
  } = useAdminSongs(password);

  const {
    isBulkProcessing,
    progress,
    isEnrichingBySong,
    handleEnrich,
    verifyAll,
    handleMassEnrich
  } = useAdminBulkActions(songs, password, setSongs, fetchSongs);

  if (!isAuth) {
    return <AdminLogin password={password} setPassword={setPassword} onLogin={handleLogin} />;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-10 p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-[900] tracking-tight text-white">Song Catalog</h2>
          <p className="text-sm font-medium text-zinc-500">Manage library metadata and enrichment verification</p>
        </div>

        <DashboardStats 
          totalSongs={stats.total} 
          missingCovers={stats.missing} 
          unverifiedCount={stats.unverified} 
        />

        <div className="space-y-6">
          <AdminActionCenter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            onSync={() => fetchSongs()}
            onMassVerify={verifyAll}
            onMassEnrich={handleMassEnrich}
            isBulkProcessing={isBulkProcessing}
            isLoading={isLoading}
          />

          {isBulkProcessing && <MassActionProgress progress={progress} />}

          <SongManagementTable 
            songs={filteredSongs}
            editingId={editingId}
            editForm={editForm}
            onEdit={(song) => {
              setEditingId(song.id);
              setEditForm({ title: song.title, artist: song.artist });
            }}
            onSave={handleSave}
            onManualVerify={handleManualVerify}
            onEnrich={handleEnrich}
            onOpenCoverPicker={(song) => setSelectedSongForCover({ id: song.id, artist: song.artist, title: song.title })}
            isEnrichingBySong={isEnrichingBySong}
            onCancel={() => setEditingId(null)}
            onFieldChange={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <CoverPickerModal 
        isOpen={!!selectedSongForCover}
        onClose={() => setSelectedSongForCover(null)}
        song={selectedSongForCover}
        password={password}
        onSelect={(url) => {
          if (selectedSongForCover) {
            handleUpdateCover(selectedSongForCover.id, url);
            setSelectedSongForCover(null);
          }
        }}
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      notFound: true,
    };
  }

  try {
    const userId = (session.user as any).id;
    if (!userId) {
       console.error("No user ID in session");
       return { notFound: true };
    }
    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData || userData.role !== "admin") {
      return {
        notFound: true,
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    console.error("Admin check error:", error);
    return {
      notFound: true,
    };
  }
};

export default AdminDashboard;
