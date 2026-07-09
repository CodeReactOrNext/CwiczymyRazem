/* eslint-disable @next/next/no-img-element */
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { useState } from "react";
import { FaGem } from "react-icons/fa";

const RARITY_COLORS: Record<string, string> = {
  Common: "#9ca3af",
  Uncommon: "#4ade80",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#fb923c",
  Mythic: "#f43f5e",
};

interface AvatarProps {
  name: string;
  lvl?: number;
  avatarURL?: string;
  size?: "sm" | "2xl";
  className?: string;
  selectedGuitar?: number | string;
  guitarYear?: number;
  guitarCountry?: string;
}

const getRankImgPath = (lvl: number) => {
  if (lvl >= IMG_RANKS_NUMBER) {
    return IMG_RANKS_NUMBER;
  }
  return lvl;
};

const Avatar = ({ name, lvl, avatarURL, size, className, selectedGuitar, guitarYear, guitarCountry }: AvatarProps) => {
  const [guitarError, setGuitarError] = useState(false);
  const imgPath = selectedGuitar ?? getRankImgPath(lvl ?? 0);

  let containerSizeClass = "h-20 w-20 rounded-xl";
  if (size === "sm") containerSizeClass = "h-10 w-10 rounded-full";
  if (size === "2xl") containerSizeClass = "h-32 w-32 rounded-2xl";

  const badgePosition = size === "2xl"
    ? { bottom: "28px", left: "58px" }
    : { bottom: "18px", left: "35px" };

  const isSpecialGuitar = typeof imgPath === "string" && imgPath.includes("special/");
  const specialGuitarDef = isSpecialGuitar ? GUITAR_DEFINITIONS.find((g) => g.imageId === imgPath) : null;
  const specialGuitarColor = specialGuitarDef ? (RARITY_COLORS[specialGuitarDef.rarity] ?? RARITY_COLORS.Common) : RARITY_COLORS.Common;
  const guitarGlow = `drop-shadow(0 0 4px ${specialGuitarColor}40) drop-shadow(0 8px 20px rgba(0,0,0,0.95))`;
  const specialGuitarImgStyle = size === "2xl"
    ? { bottom: "-40px", right: "-40px", width: 160, height: 160, transform: "rotate(-90deg)", filter: guitarGlow }
    : { bottom: "-28px", right: "-28px", width: 110, height: 110, transform: "rotate(-90deg)", filter: guitarGlow };

  return (
    <div className={`relative inline-block ${className || ""}`}>
      <div
        className={`relative z-10 flex items-center justify-center overflow-hidden bg-tertiary-400 ${containerSizeClass}`}>
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
      {imgPath !== 0 && isSpecialGuitar && size !== "sm" && !specialGuitarDef && !guitarError && (
        <img 
          className='absolute z-20 object-contain' 
          style={specialGuitarImgStyle} 
          src={getRankBadgeSrc(imgPath, "small")} 
          alt='' 
          onError={() => setGuitarError(true)}
        />
      )}
      {imgPath !== 0 && isSpecialGuitar && size !== "sm" && specialGuitarDef && !guitarError && (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <img 
                className='absolute z-20 object-contain cursor-pointer' 
                style={specialGuitarImgStyle} 
                src={getRankBadgeSrc(imgPath, "small")} 
                alt='' 
                onError={() => setGuitarError(true)}
              />
            </TooltipTrigger>
            <TooltipContent className="p-0 border-0 bg-transparent shadow-2xl" side="top">
              <div
                className="flex flex-col w-44 overflow-hidden rounded-2xl"
                style={{
                  border: `1px solid ${specialGuitarColor}40`,
                  background: "linear-gradient(160deg, #18181c 0%, #0b0b0d 100%)",
                  boxShadow: `0 16px 40px -12px ${specialGuitarColor}55, 0 4px 12px rgba(0,0,0,0.5)`,
                }}>
                <div className="px-3.5 pt-3 pb-1">
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em]" style={{ color: `${specialGuitarColor}cc` }}>{specialGuitarDef.brand}</p>
                  <p className="text-sm font-bold text-white leading-tight">{specialGuitarDef.name}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: `${specialGuitarColor}20`, color: specialGuitarColor, border: `1px solid ${specialGuitarColor}40` }}>
                    <FaGem size={7} />
                    {specialGuitarDef.rarity}
                  </span>
                </div>
                <div className="relative flex items-center justify-center px-2 py-3 mx-2 my-1.5 rounded-xl overflow-hidden">
                  {/* Subtle structural grid */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: [
                        `linear-gradient(${specialGuitarColor} 1px, transparent 1px)`,
                        `linear-gradient(90deg, ${specialGuitarColor} 1px, transparent 1px)`,
                      ].join(","),
                      backgroundSize: "22px 22px",
                      opacity: 0.04,
                    }}
                  />
                  {/* Neutral spotlight */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)` }}
                  />
                  {/* Rarity glow */}
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse at center, ${specialGuitarColor}30 0%, ${specialGuitarColor}0d 50%, transparent 72%)` }}
                  />
                  <img
                    src={getRankBadgeSrc(imgPath, "small")}
                    alt={specialGuitarDef.name}
                    className="relative object-contain h-64 w-auto -rotate-90 drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)] brightness-110"
                  />
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 text-[10px] text-gray-400" style={{ borderTop: `1px solid ${specialGuitarColor}20`, background: `${specialGuitarColor}08` }}>
                  <span className="font-semibold text-gray-300">{guitarYear ?? `${specialGuitarDef.yearFrom}–${specialGuitarDef.yearTo}`}</span>
                  <span className="text-gray-500 uppercase tracking-widest text-[9px]">{guitarCountry ?? specialGuitarDef.countries[0]}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {imgPath !== 0 && !isSpecialGuitar && !guitarError && (
        <img 
          className='absolute -rotate-90 z-20' 
          style={size === "sm" ? { display: "none" } : { ...badgePosition }} 
          src={getRankBadgeSrc(imgPath, "small")} 
          alt='' 
          onError={() => setGuitarError(true)}
        />
      )}
    </div>
  );
};

export default Avatar;
