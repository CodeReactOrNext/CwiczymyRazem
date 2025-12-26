import { useState } from "react";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { DashboardStats } from "feature/admin/components/DashboardStats";
import { SongManagementTable } from "feature/admin/components/SongManagementTable";
import AdminLogin from "feature/admin/components/AdminLogin";
import AdminActionCenter from "feature/admin/components/AdminActionCenter";
import MassActionProgress from "feature/admin/components/MassActionProgress";
import CoverPickerModal from "feature/admin/components/CoverPickerModal";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { toast } from "sonner";
import { useAdminSongs } from "feature/admin/hooks/useAdminSongs";
import { useAdminBulkActions } from "feature/admin/hooks/useAdminBulkActions";
import { useDuplicateDetector } from "feature/admin/hooks/useDuplicateDetector";
import { BulkAddSongsModal } from "feature/admin/components/BulkAddSongsModal";
import { DuplicateSongsModal } from "feature/admin/components/DuplicateSongsModal";
import { ArtistSongSelector } from "feature/admin/components/ArtistSongSelector";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { db } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps } from "next";

const AdminDashboard = () => {
  const [selectedSongForCover, setSelectedSongForCover] = useState<{ id: string; artist: string; title: string } | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isArtistSelectorOpen, setIsArtistSelectorOpen] = useState(false);

  const {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  } = useAdminAuth(() => fetchSongs());

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
    handleBulkAdd,
    handleQuickRate,
    handleDelete,
    filteredSongs,
    stats,
    page,
    setPage,
    totalCount
  } = useAdminSongs(password);

  const {
    duplicates,
    isModalOpen: isDuplicateModalOpen,
    setIsModalOpen: setIsDuplicateModalOpen,
    isScanning: isDuplicateScanning,
    scanProgress: duplicateScanProgress,
    handleDeepScan,
    scannedCount
  } = useDuplicateDetector(songs, password);

  const {
    isBulkProcessing,
    progress,
    isEnrichingBySong,
    handleEnrich,
    verifyAll,
    handleMassEnrich,
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
          noRatingCount={stats.noRating}
          onArtistSelector={() => setIsArtistSelectorOpen(true)}
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
            onBulkAdd={() => setIsBulkAddOpen(true)}
            onFindDuplicates={handleDeepScan}
            isBulkProcessing={isBulkProcessing || isDuplicateScanning}
            isLoading={isLoading || isDuplicateScanning}
          />

          {(isBulkProcessing || isDuplicateScanning) && (
            <MassActionProgress 
              progress={isDuplicateScanning 
                ? { current: scannedCount, total: stats.total } 
                : progress
              } 
            />
          )}

          <SongManagementTable 
            songs={filteredSongs}
            editingId={editingId}
            editForm={editForm}
            onEdit={(song) => {
              setEditingId(song.id);
              setEditForm({ title: song.title, artist: song.artist, avgDifficulty: song.avgDifficulty || 0 });
            }}
            onSave={handleSave}
            onManualVerify={handleManualVerify}
            onEnrich={handleEnrich}
            onOpenCoverPicker={(song) => setSelectedSongForCover({ id: song.id, artist: song.artist, title: song.title })}
            isEnrichingBySong={isEnrichingBySong}
            onCancel={() => setEditingId(null)}
            onFieldChange={(field, value) => {
              setEditForm(prev => ({ 
                ...prev, 
                [field]: field === "avgDifficulty" ? parseFloat(value) || 0 : value 
              }))
            }}
            onQuickRate={handleQuickRate}
            onDelete={handleDelete}
            isLoading={isLoading}
            page={page}
            totalCount={totalCount}
            onPageChange={setPage}
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

      <BulkAddSongsModal 
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
        isLoading={isLoading}
        onConfirm={async (songs) => {
          await handleBulkAdd(songs);
          setIsBulkAddOpen(false);
        }}
      />
      
      <DuplicateSongsModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={duplicates}
        onDelete={handleDelete}
        scannedCount={scannedCount}
      />

      <ArtistSongSelector
        isOpen={isArtistSelectorOpen}
        onClose={() => setIsArtistSelectorOpen(false)}
        onSongsSelected={async (songs, artistName, autoEnrich) => {
          const res = await handleBulkAdd(songs.map(song => ({
            title: song.title,
            artist: song.artist || artistName,
            difficulty: song.difficulty
          })));

          if (res?.success && autoEnrich && res.results?.length > 0) {
            toast.promise(
               async () => {
                for (const addedSong of res.results) {
                  await handleEnrich(addedSong.id, addedSong.artist, addedSong.title, true);
                }
               },
               {
                 loading: `Enriching ${res.results.length} songs...`,
                 success: "Discovery & Enrichment complete!",
                 error: "Discovery failed"
               }
            );
          }

          setIsArtistSelectorOpen(false);
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
