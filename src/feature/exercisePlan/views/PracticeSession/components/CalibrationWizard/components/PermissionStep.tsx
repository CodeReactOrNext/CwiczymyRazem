import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { FaMicrophone, FaTimes } from "react-icons/fa";

interface PermissionStepProps {
  isLoading: boolean;
  onGrant:   () => void;
  onBack:    () => void;
  onCancel:  () => void;
}

export const PermissionStep = ({ isLoading, onGrant, onBack, onCancel }: PermissionStepProps) => {
  return (
    <div className="flex h-full flex-col px-6 py-6 text-white">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="relative w-40 h-40 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <img src="/images/calibration/perm.png" alt="Microphone Permission" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 max-w-[280px]">
          <h2 className="text-xl font-bold tracking-tight">Microphone Access</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            To detect your guitar notes, we need permission to use your audio input. 
            No audio is ever recorded or sent to any server.
          </p>
        </div>

        <div className="w-full space-y-3 pt-4">
          <Button
            onClick={onGrant}
            disabled={isLoading}
            className="w-full h-12"
          >
            {isLoading ? "Allowing..." : "Allow Microphone Access"}
          </Button>
          <p className="text-[10px] text-zinc-600 font-bold tracking-widest">
            A browser prompt will appear
          </p>
        </div>
      </div>

      <button onClick={onCancel} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-2 mt-4">
        Skip for now
      </button>
    </div>
  );
};
