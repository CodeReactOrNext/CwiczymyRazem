export default function StatisticBar() {
  //Its placeholder. This need to be full dynamic.
  return (
    <div className='z-10 flex flex-col items-center sm:text-xl '>
      <p className='text-sm sm:text-lg'>76%</p>
      <div className='flex h-32 w-5 bg-main-opposed-50 sm:h-40 sm:w-8'>
        <div className=' h-[20%] w-5 self-end bg-main sm:w-8'></div>
      </div>
      <p className='my-2 w-full bg-main-opposed px-5 sm:px-10 md:px-5 lg:px-10'>
        21:34h
      </p>
      <p>Technika</p>
    </div>
  );
}
