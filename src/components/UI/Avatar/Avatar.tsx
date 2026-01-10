/* eslint-disable @next/next/no-img-element */
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

interface AvatarProps {
  name: string;
  lvl?: number;
  avatarURL?: string;
  size?: "sm";
}

const getRankImgPath = (lvl: number) => {
  if (lvl >= IMG_RANKS_NUMBER) {
    return IMG_RANKS_NUMBER;
  }
  return lvl;
};

const getBorderStyles = (lvl: number) => {
  if (lvl >= 25)
    return "bg-gradient-to-br from-cyan-300 via-white to-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]";
  if (lvl >= 21)
    return "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_6px_rgba(234,179,8,0.3)]";
  if (lvl >= 17)
    return "bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[0_0_5px_rgba(239,68,68,0.3)]";
  if (lvl >= 13)
    return "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 shadow-[0_0_5px_rgba(59,130,246,0.3)]";
  if (lvl >= 9)
    return "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_0_5px_rgba(16,185,129,0.3)]";
  if (lvl >= 5)
    return "bg-gradient-to-br from-[#cd7f32] via-[#8b4513] to-[#5e300d] shadow-[0_0_4px_rgba(139,69,19,0.3)]";
  return "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600";
};

const Avatar = ({ name, lvl, avatarURL, size }: AvatarProps) => {
  const imgPath = getRankImgPath(lvl ?? 0);
  const borderStyles = getBorderStyles(lvl ?? 0);

  // Styles for the outer wrapper (border)
  const containerSizeClass = size === "sm" ? "h-10 w-10 rounded-full" : "h-20 w-20 rounded-xl";
  
  // Styles for the inner content (image or text)
  // We need slightly smaller rounding for the inner part to look nested perfectly if it's a square/rect, 
  // but for circle/full it matches.
  // For 'rounded-xl' outer, inner should be roughly 'rounded-lg'.
  const innerRoundedClass = size === "sm" ? "rounded-full" : "rounded-[10px]";

  return (
    <div className='relative inline-block'>
      <div
        className={`flex items-center justify-center p-[3px] ${containerSizeClass} ${borderStyles}`}>
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
      {lvl !== undefined && (
        <img
          className='absolute bottom-[18px] left-[35px] -rotate-90 '
          style={size === "sm" ? { display: "none" } : {}}
          src={`/static/images/rank/${imgPath}.png`}
          alt={`gutiar rank image for level ${lvl ?? 0}`}
        />
      )}
    </div>
  );
};

export default Avatar;
