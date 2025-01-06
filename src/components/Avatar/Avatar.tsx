/* eslint-disable @next/next/no-img-element */
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

interface AvatarProps {
  name: string;
  lvl?: number;
  avatarURL?: string;
  size?: "sm" ;
}

const Avatar = ({ name, lvl, avatarURL, size }: AvatarProps) => {
  const imgPath = getRankImgPath(lvl ?? 0);

  return (
    <div className='relative '>
      <div className={`flex h-20 w-20 items-center justify-center bg-tertiary-400 rounded-lg ${size === "sm" ? "h-10 w-10 rounded-full " : ""}`}>
        {avatarURL ? (
          <img
            referrerPolicy='no-referrer'
            className={`h-full w-full rounded-fullt ${size === "sm" ? "h-10 w-10 rounded-full " : ""}`}
            src={avatarURL}
            alt={name}
          />
        ) : (
          <p className={`font-openSans text-4xl font-bold uppercase text-main-opposed ${size === "sm" ? "text-[14px]" : ""}`}>
            {name?.[0]}
          </p>  
        )}
      </div>
      {lvl && (
        <img
          className='absolute bottom-[18px] left-[35px] -rotate-90'
          src={`/static/images/rank/${imgPath}.png`}
          alt={`gutiar rank image for level ${lvl ?? 0}`}
        />
      )}
    </div>
  );
};

export default Avatar;

const getRankImgPath = (lvl: number) => {
  if (lvl >= IMG_RANKS_NUMBER) {
    return IMG_RANKS_NUMBER;
  }
  return lvl;
};
