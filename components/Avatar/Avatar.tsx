/* eslint-disable @next/next/no-img-element */
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

interface AvatarProps {
  name: string;
  lvl?: number;
  avatarURL?: string;
}

const Avatar = ({ name, lvl, avatarURL }: AvatarProps) => {
  const getRankImgPath = (lvl: number) => {
    if (lvl >= IMG_RANKS_NUMBER) {
      return IMG_RANKS_NUMBER;
    }
    return lvl;
  };

  return (
    <div className='relative '>
      <div className='flex h-20 w-20 items-center justify-center bg-tertiary-400 radius-default'>
        {avatarURL ? (
          <img className='h-full w-full radius-default' src={avatarURL} alt={name} />
        ) : (
          <p className='font-openSans text-4xl font-bold uppercase text-main-opposed'>
            {name?.[0]}
          </p>
        )}
      </div>
      {lvl && (
        <img
          className='absolute bottom-[18px] left-[35px] -rotate-90'
          src={`/static/images/rank/${getRankImgPath(lvl)}.png`}
          alt='gutiar_rank'
        />
      )}
    </div>
  );
};

export default Avatar;
