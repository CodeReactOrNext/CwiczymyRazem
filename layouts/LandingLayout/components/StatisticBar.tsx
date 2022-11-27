export default function StatisticBar() {
  return (
    <div className='flex flex-col items-center '>
      <p className='text-sm'>76%</p>
      <div className='flex h-32 w-5 bg-main-opposed-50'>
        <div className=' h-[20%] w-5 self-end bg-main'></div>
      </div>
      <p className='my-2 w-full bg-main-opposed px-5'>21:34h</p>
      <p>Technika</p>
    </div>
  );
}
