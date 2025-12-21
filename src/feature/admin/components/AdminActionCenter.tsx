import { Search, RefreshCw, ShieldCheck, Plus } from "lucide-react";
import { Input } from "assets/components/ui/input";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";

interface AdminActionCenterProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterType: "all" | "unverified" | "no-cover";
  setFilterType: (type: "all" | "unverified" | "no-cover") => void;
  onSync: () => void;
  onMassVerify: () => void;
  onMassEnrich: () => void;
  onBulkAdd: () => void;
  isBulkProcessing: boolean;
  isLoading: boolean;
}

const AdminActionCenter = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  onSync,
  onMassVerify,
  onMassEnrich,
  onBulkAdd,
  isBulkProcessing,
  isLoading
}: AdminActionCenterProps) => {
  return (
    <div className="flex flex-col gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Search collection..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-11 border-white/5 bg-black/40 text-sm focus:border-cyan-500/30 transition-all rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl ring-1 ring-white/5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFilterType("all")}
            className={cn("h-9 rounded-lg text-[10px] font-black uppercase tracking-widest", filterType === "all" ? "bg-white/10 text-white" : "text-zinc-500")}
          >
            All
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFilterType("unverified")}
            className={cn("h-9 rounded-lg text-[10px] font-black uppercase tracking-widest", filterType === "unverified" ? "bg-red-500/10 text-red-500" : "text-zinc-500")}
          >
            Unverified
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFilterType("no-cover")}
            className={cn("h-9 rounded-lg text-[10px] font-black uppercase tracking-widest", filterType === "no-cover" ? "bg-amber-500/10 text-amber-500" : "text-zinc-500")}
          >
            No Cover
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
        <Button 
          variant="outline" 
          onClick={onSync} 
          disabled={isLoading}
          className="h-10 border-white/5 bg-zinc-900/60 hover:bg-white/5 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoading && "animate-spin")} />
          Sync Catalog
        </Button>
        <Button 
          onClick={onMassVerify} 
          disabled={isBulkProcessing}
          className="h-10 bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        >
          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
          Mass Verify
        </Button>
        <Button 
          onClick={onMassEnrich} 
          disabled={isBulkProcessing}
          className="h-10 bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        >
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isBulkProcessing && "animate-spin")} />
          Mass Enrich
        </Button>
        <Button 
          onClick={onBulkAdd} 
          disabled={isLoading}
          className="h-10 bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Bulk Add Songs
        </Button>
      </div>
    </div>
  );
};

export default AdminActionCenter;
