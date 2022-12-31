/* eslint-disable @next/next/no-img-element */
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

interface AvatarProps {
  name: string;
  lvl: number;
  avatarURL?: string;
}

const Avatar = ({ name, lvl, avatarURL }: AvatarProps) => {
  const getRankImgPath = () => {
    if (lvl >= IMG_RANKS_NUMBER) {
      return IMG_RANKS_NUMBER;
    }
    return lvl;
  };
  return (
    <div className='relative'>
      <div className='flex h-20 w-20 items-center justify-center bg-tertiary-400'>
        {avatarURL ? (
          <img className='h-full w-full' src={avatarURL} alt='avatar' />
        ) : (
          <p className='text-5xl uppercase text-main-opposed'>{name?.[0]}</p>
        )}
      </div>
      <img
        className='absolute bottom-[18px] left-[35px] -rotate-90'
        src={`/static/images/rank/${getRankImgPath()}.png`}
        alt='gutiar_rank'
      />
    </div>
  );
};

export default Avatar;
