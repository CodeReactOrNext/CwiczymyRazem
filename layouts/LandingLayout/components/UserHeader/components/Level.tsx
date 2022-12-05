export const Level = () => (
  <div className=' flex flex-col items-center lg:w-64 lg:justify-self-end xl:w-80'>
    <p>
      Twój poziom <span className='text-4xl text-mainText'>35</span>
    </p>
    <div className=' flex w-full'>
      <p className=' relative left-3 z-10 text-sm'>
        lvl
        <span className='text-xl text-mainText'>35</span>
      </p>
      <div className='relative flex h-4 w-full items-center bg-main-opposed'>
        <div className='relative h-5 w-[20%] bg-main'></div>
      </div>
      <p className='relative right-3 text-sm'>
        lvl
        <span className='text-xl  text-mainText'>36</span>
      </p>
    </div>
    <p>340/550pkt</p>
  </div>
);
