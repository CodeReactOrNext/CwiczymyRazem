import { UpgradeContent } from "./UpgradeModal";
import Image from "next/image";
import { Zap, Crown } from "lucide-react";

interface FeatureItem {
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface PremiumFeaturePreviewProps {
  eyebrow: string;
  title: string;
  description: string;
  features: FeatureItem[];
  previewImagePath?: string;
  previewImageAlt?: string;
  availableIn?: "pro" | "master" | "both";
}

export function PremiumFeaturePreview({
  eyebrow,
  title,
  description,
  features,
  previewImagePath,
  previewImageAlt,
  availableIn = "pro",
}: PremiumFeaturePreviewProps) {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 relative z-10">
        {/* Intro section */}
        <div className="text-center mb-20">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${
              availableIn === "master" 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-orange-500/10 border-orange-500/20 text-orange-500"
            }`}>
              {availableIn === "master" ? <Crown size={12} fill="currentColor" /> : <Zap size={12} fill="currentColor" />}
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {availableIn === "master" ? "Practice Master" : availableIn === "pro" ? "Practice Pro" : "Pro & Master"}
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-semibold text-white leading-[1.1] mb-6 tracking-tighter">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-medium">
            {description}
          </p>
        </div>

        {/* Preview Image with Glow */}
        {previewImagePath && (
          <div className="mb-24 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-orange-500/20 to-cyan-500/20 rounded-md blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-md overflow-hidden bg-zinc-900 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent pointer-events-none z-10" />
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={previewImagePath}
                  alt={previewImageAlt || "Feature preview"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-6 rounded-md bg-white/5 hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
            >
              <div className="mb-6 h-12 w-12 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.label}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="rounded-md bg-zinc-900/40 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <UpgradeContent />
        </div>
      </div>
    </div>
  );
}
