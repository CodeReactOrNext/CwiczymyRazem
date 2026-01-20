import { Input } from "assets/components/ui/input";
import { format } from "date-fns";
import { Calendar, ExternalLink, Loader2, Mail, Search } from "lucide-react";

interface UserManagementTableProps {
  users: any[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export const UserManagementTable = ({ users, isLoading, searchTerm, setSearchTerm }: UserManagementTableProps) => {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 border-white/5 bg-zinc-900/40 text-sm focus:border-cyan-500/30 transition-all rounded-2xl backdrop-blur-md"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <div className="col-span-1">Avatar</div>
          <div className="col-span-4">User Details</div>
          <div className="col-span-4">Authentication</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-1 text-right">Profile</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin scrollbar-track-zinc-900/40 scrollbar-thumb-zinc-700">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-500 opacity-20" />
              <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Fetching users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 font-medium">No users found.</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-1">
                  <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/5 shadow-inner">
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-bold text-white leading-tight">{user.displayName || "Anonymous"}</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{user.role || "user"}</p>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <Mail className="h-3 w-3 text-zinc-600" />
                  <span className="text-xs text-zinc-400 font-medium truncate">{user.userAuth}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-zinc-600" />
                  <span className="text-xs text-zinc-400">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "N/A"}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <a 
                    href={`/user/${user.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
