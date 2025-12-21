import { ShieldCheck } from "lucide-react";
import { Input } from "assets/components/ui/input";
import { Button } from "assets/components/ui/button";

interface AdminLoginProps {
  password: string;
  setPassword: (pass: string) => void;
  onLogin: (e: React.FormEvent) => void;
}

const AdminLogin = ({ password, setPassword, onLogin }: AdminLoginProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-center">
      <div className="w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/5 bg-zinc-950/50 p-12 backdrop-blur-3xl shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex h-16 w-16 items-center justify-center mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 shadow-inner">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">Administrator</h1>
          <p className="text-sm font-medium text-zinc-500">Verify your authority to proceed</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4 pt-4">
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 border-white/5 bg-black/40 text-center text-xl font-bold tracking-[0.3em] transition-all focus:border-cyan-500/50 focus:ring-0"
          />
          <Button type="submit" className="h-14 w-full bg-cyan-600 font-black uppercase tracking-widest text-white hover:bg-cyan-500 shadow-xl shadow-cyan-500/10">
            Unlock Terminal
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
