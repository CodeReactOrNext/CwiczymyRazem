import { cn } from "assets/lib/utils";
import { X } from "lucide-react";
import { FaMicrophone, FaPlug } from "react-icons/fa";

export type InputSource = "interface" | "microphone";

interface SourceStepProps {
  onSelect: (source: InputSource) => void;
  onCancel: () => void;
}

export const SourceStep = ({ onSelect, onCancel }: SourceStepProps) => {
  return (
    <div className="flex flex-col px-6 py-6 text-white h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">Guitar Calibration</h2>
        <button
          onClick={onCancel}
          className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="w-full h-32 rounded-lg overflow-hidden mb-6 relative shadow-2xl">
        <img src="/images/calibration/source.png" alt="Connection types" className="w-full h-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
      </div>

      <p className="text-zinc-400 text-sm mb-4 font-medium">How is your guitar connected to the computer?</p>

      <div className="grid grid-cols-2 gap-3">
        <SourceCard
          icon={<FaPlug className="text-4xl" />}
          title="Audio Interface"
          description={<>USB or Thunderbolt<br />audio interface</>}
          accentClass="hover:bg-cyan-500/5 group-hover:text-cyan-400"
          iconIdleClass="text-zinc-500"
          iconActiveClass="group-hover:text-cyan-400"
          onClick={() => onSelect("interface")}
        />
        <SourceCard
          icon={<FaMicrophone className="text-4xl" />}
          title="Microphone"
          description={<>Built-in laptop mic<br />or external USB mic</>}
          accentClass="hover:bg-emerald-500/5"
          iconIdleClass="text-zinc-500"
          iconActiveClass="group-hover:text-emerald-400"
          onClick={() => onSelect("microphone")}
        />
      </div>

      <button
        onClick={onCancel}
        className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-3 mt-6"
      >
        Skip calibration
      </button>
    </div>
  );
};

function SourceCard({
  icon, title, description, accentClass, iconIdleClass, iconActiveClass, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  accentClass: string;
  iconIdleClass: string;
  iconActiveClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center gap-5 p-6 rounded-lg bg-zinc-900/40 transition-all",
        accentClass
      )}
    >
      <div className={cn(
        "w-20 h-20 rounded-lg bg-zinc-800/80 flex items-center justify-center transition-all",
        accentClass
      )}>
        <span className={cn("transition-colors", iconIdleClass, iconActiveClass)}>
          {icon}
        </span>
      </div>
      <div className="text-center">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
