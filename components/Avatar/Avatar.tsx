const Avatar = () => {
  return (
    <div className='relative'>
      <div className='h-20  w-20 bg-white'></div>
      <img
        className='absolute bottom-[18px] left-[35px] -rotate-90'
        src='/static/images/rangi/3.png'
        alt='gutiar_rank'
      />
    </div>
  );
};

export default Avatar;
