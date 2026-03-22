import { LucideIcon } from "lucide-react";

interface EquipmentSlotProps {
  label: string;
  Icon: LucideIcon;
}

export const EquipmentSlot = ({ label, Icon }: EquipmentSlotProps) => {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-zinc-700/60 bg-zinc-900/40 p-6 min-h-[160px] justify-center">
      <Icon size={32} className="text-zinc-600" strokeWidth={1.5} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">Coming Soon</span>
      </div>
    </div>
  );
};
