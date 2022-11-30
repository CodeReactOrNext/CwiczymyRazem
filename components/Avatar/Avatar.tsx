interface AvatarProps {
  user: {
    name: string;
    avatar?: string;
  };
}
const Avatar = ({ user }: AvatarProps) => {
  return (
    <div className='relative'>
      <div className='flex  h-20 w-20 items-center justify-center bg-tertiary-400'>
        <p className='text-5xl uppercase text-main-opposed'>{user.name[0]}</p>
      </div>
      <img
        className='absolute bottom-[18px] left-[35px] -rotate-90'
        src='/static/images/rank/3.png'
        alt='gutiar_rank'
      />
    </div>
  );
};

export default Avatar;
