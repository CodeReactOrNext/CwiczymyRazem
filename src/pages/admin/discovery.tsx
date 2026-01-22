import { ArtistSongSelector } from "feature/admin/components/ArtistSongSelector";
import MassActionProgress from "feature/admin/components/MassActionProgress";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminBulkActions } from "feature/admin/hooks/useAdminBulkActions";
import { useAdminSongs } from "feature/admin/hooks/useAdminSongs";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { Loader2,Sparkles } from "lucide-react";

const AdminDiscoveryPage = () => {
  const { password, handleLogout } = useAdminAuth((_pass: string) => {});
  
  const {
    handleBulkAdd,
  } = useAdminSongs(password);

  const { 
    handleBulkEnrich,
    isBulkProcessing,
    progress
  } = useAdminBulkActions([], password, () => {}, () => {});

  if (!password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="min-h-[calc(100vh-80px)] p-6 lg:p-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
         <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Advanced Tools</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Artist Discovery</h2>
                <p className="text-zinc-500 font-medium text-sm">Expand your library by discovering and importing full artist catalogs from Spotify.</p>
            </div>
         </header>

         {isBulkProcessing && (
            <div className="mb-10">
                <MassActionProgress progress={progress} />
            </div>
         )}

         <div className="relative rounded-[2.5rem] border border-white/5 bg-zinc-900/30 backdrop-blur-3xl overflow-hidden min-h-[85vh]">
            <ArtistSongSelector 
                isOpen={true} 
                isEmbedded={true}
                onClose={() => {}} 
                onSongsSelected={async (songs, artistName, autoEnrich) => {
                    const res = await handleBulkAdd(songs.map(song => ({
                        title: song.title,
                        artist: song.artist || artistName,
                        difficulty: song.difficulty,
                        coverUrl: song.coverUrl
                    })));

                    if (res?.success && autoEnrich && res.results?.length > 0) {
                        await handleBulkEnrich(res.results.map((s: any) => ({
                            id: s.id,
                            artist: s.artist,
                            title: s.title
                        })));
                    }
                }}
            />
         </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDiscoveryPage;
