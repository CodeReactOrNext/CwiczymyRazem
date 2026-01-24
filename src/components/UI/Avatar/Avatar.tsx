/* eslint-disable @next/next/no-img-element */
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

interface AvatarProps {
  name: string;
  lvl?: number;
  avatarURL?: string;
  size?: "sm" | "2xl";
  className?: string;
  selectedFrame?: number;
  selectedGuitar?: number;
}

const getRankImgPath = (lvl: number) => {
  if (lvl >= IMG_RANKS_NUMBER) {
    return IMG_RANKS_NUMBER;
  }
  return lvl;
};

const getBorderStyles = (lvl: number) => {
  if (lvl >= 100)
    return "bg-[conic-gradient(from_var(--shimmer-angle),#6366f1_0%,#a855f7_20%,#ec4899_40%,#f59e0b_60%,#a855f7_80%,#6366f1_100%)] shadow-[0_0_15px_rgba(168,85,247,0.6),inset_0_0_10px_rgba(255,255,255,0.3)] animate-[shimmer_4s_linear_infinite] ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/40";
  if (lvl >= 95)
    return "bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b,#10b981,#3b82f6)] shadow-[0_0_12px_rgba(139,92,246,0.6)] ring-1 ring-offset-1 ring-offset-black/20 ring-purple-400/20";
  if (lvl >= 90)
    return "bg-gradient-to-tr from-indigo-900 via-purple-600 to-pink-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-white/10";
  if (lvl >= 85)
    return "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-yellow-200 to-orange-600 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse ring-1 ring-yellow-300/30";
  if (lvl >= 80)
    return "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 shadow-[0_0_10px_rgba(192,132,252,0.5)]";
  if (lvl >= 75)
    return "bg-gradient-to-tr from-orange-600 via-red-500 to-yellow-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse border border-orange-400/40";
  if (lvl >= 70)
    return "bg-gradient-to-tr from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]";
  if (lvl >= 65)
    return "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]";
  if (lvl >= 60)
    return "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_8px_rgba(34,211,238,0.4)]";
  if (lvl >= 55)
    return "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 shadow-[0_0_6px_rgba(100,116,139,0.4)] border border-slate-400/20";
  if (lvl >= 50)
    return "bg-gradient-to-b from-zinc-600 via-zinc-950 to-zinc-900 shadow-[0_0_6px_rgba(0,0,0,0.8),inset_0_0_5px_rgba(255,255,255,0.1)] border border-zinc-700/40";
  if (lvl >= 48)
    return "bg-gradient-to-br from-purple-900 via-black to-indigo-950 shadow-[0_0_6px_rgba(88,28,135,0.4)]";
  if (lvl >= 44)
    return "bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-purple-600 shadow-[0_0_6px_rgba(217,70,239,0.4)] animate-pulse";
  if (lvl >= 40)
    return "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-400 via-rose-600 to-pink-900 shadow-[0_0_6px_rgba(225,29,72,0.4)]";
  if (lvl >= 36)
    return "bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 shadow-[0_0_5px_rgba(192,132,252,0.3)]";
  if (lvl >= 33)
    return "bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 shadow-[0_0_5px_rgba(168,85,247,0.3)]";
  if (lvl >= 30)
    return "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-900 shadow-[0_0_5px_rgba(139,92,246,0.3)]";
  if (lvl >= 27)
    return "bg-gradient-to-br from-sky-300 via-blue-200 to-indigo-300 shadow-[0_0_5px_rgba(125,211,252,0.3)]";
  if (lvl >= 25)
    return "bg-gradient-to-br from-cyan-300 via-white to-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.3)]";
  if (lvl >= 23)
    return "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.3)]";
  if (lvl >= 21)
    return "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_4px_rgba(234,179,8,0.3)]";
  if (lvl >= 19)
    return "bg-gradient-to-br from-rose-500 via-red-600 to-rose-800 shadow-[0_0_4px_rgba(225,29,72,0.3)]";
  if (lvl >= 17)
    return "bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[0_0_4px_rgba(239,68,68,0.3)]";
  if (lvl >= 15)
    return "bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 shadow-[0_0_4px_rgba(79,70,229,0.3)]";
  if (lvl >= 13)
    return "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 shadow-[0_0_3px_rgba(59,130,246,0.3)]";
  if (lvl >= 11)
    return "bg-gradient-to-br from-teal-300 via-teal-500 to-cyan-600 shadow-[0_0_3px_rgba(20,184,166,0.3)]";
  if (lvl >= 9)
    return "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_0_3px_rgba(16,185,129,0.3)]";
  if (lvl >= 7)
    return "bg-gradient-to-br from-green-400 via-green-500 to-green-700 shadow-[0_0_3px_rgba(34,197,94,0.3)]";
  if (lvl >= 5)
    return "bg-gradient-to-br from-[#cd7f32] via-[#8b4513] to-[#5e300d] shadow-[0_0_3px_rgba(205,127,50,0.3)]";
  if (lvl >= 3)
    return "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 shadow-[0_0_2px_rgba(156,163,175,0.3)]";
  return "bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-sm";
};

const Avatar = ({ name, lvl, avatarURL, size, className, selectedFrame, selectedGuitar }: AvatarProps) => {
  const effectiveLvl = selectedFrame !== undefined ? selectedFrame : (lvl ?? 0);
  const imgPath = selectedGuitar !== undefined ? selectedGuitar : getRankImgPath(lvl ?? 0);
  const borderStyles = getBorderStyles(effectiveLvl);

  let containerSizeClass = "h-20 w-20 rounded-xl";
  if (size === "sm") containerSizeClass = "h-10 w-10 rounded-full";
  if (size === "2xl") containerSizeClass = "h-32 w-32 rounded-2xl";
  
  let innerRoundedClass = "rounded-[10px]";
  if (size === "sm") innerRoundedClass = "rounded-full";
  if (size === "2xl") innerRoundedClass = "rounded-[14px]";

  const badgePosition = size === "2xl" 
    ? { bottom: "28px", left: "58px" } 
    : { bottom: "18px", left: "35px" };

  const showEffects = size === "2xl";

  return (
    <div className={`relative inline-block ${className || ""}`}>
      {showEffects && effectiveLvl >= 100 && (
        <>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
            <div className="absolute inset-0 rounded-[2rem] border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-clip-padding opacity-40 blur-sm" />
          </div>
          <div className="absolute -inset-4 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
            <div className="h-full w-full rounded-full border border-purple-500/20" />
          </div>
          <div className="absolute -inset-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-purple-400 animate-pulse"
                style={{
                  top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
                  left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {showEffects && effectiveLvl >= 85 && effectiveLvl < 100 && (
        <>
          <div className="absolute -inset-3 animate-pulse" style={{ animationDuration: '2s' }}>
            <div className="h-full w-full rounded-[2rem] bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 blur-md" />
          </div>
          <div className="absolute -inset-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-0.5 w-0.5 rounded-full bg-yellow-300 animate-pulse"
                style={{
                  top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {showEffects && effectiveLvl >= 75 && effectiveLvl < 85 && (
        <div className="absolute -inset-3 animate-pulse" style={{ animationDuration: '1.5s' }}>
          <div className="h-full w-full rounded-[2rem] bg-gradient-to-r from-orange-600/20 via-red-500/20 to-yellow-400/20 blur-lg" />
        </div>
      )}

      {showEffects && effectiveLvl >= 65 && effectiveLvl < 75 && (
        <div className="absolute -inset-2 animate-pulse" style={{ animationDuration: '2s' }}>
          <div className="h-full w-full rounded-[2rem] bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 blur-md" />
        </div>
      )}

      {showEffects && effectiveLvl >= 50 && effectiveLvl < 65 && (
        <div className="absolute -inset-1.5">
          <div className="h-full w-full rounded-[2rem] bg-black/20 blur-md" />
        </div>
      )}

      <div
        className={`flex items-center justify-center p-[3px] relative z-10 ${containerSizeClass} ${borderStyles}`}>
        <div
          className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-tertiary-400 ${innerRoundedClass}`}>
          {avatarURL ? (
            <img
              referrerPolicy='no-referrer'
              className='h-full w-full object-cover'
              src={avatarURL}
              alt={name}
            />
          ) : (
            <p
              className={`font-openSans font-bold uppercase text-main-opposed ${
                size === "sm" ? "text-[14px]" : "text-4xl"
              }`}>
              {name?.[0]}
            </p>
          )}
        </div>
      </div>
      {imgPath !== 0 && (
        <img
          className='absolute -rotate-90 z-20'
          style={size === "sm" ? { display: "none" } : { ...badgePosition }}
          src={`/static/images/rank/${imgPath}.png`}
          alt={`gutiar rank image for level ${lvl ?? 0}`}
        />
      )}
    </div>
  );
};

export default Avatar;
