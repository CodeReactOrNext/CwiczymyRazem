interface StatisticBarProps {
  title: string;
  value: string;
  percent: number;
}
const StatisticBar = ({ title, value, percent }: StatisticBarProps) => {
  const percentValue = percent ? percent : 0;

  return (
    <div className=' m-1 flex  flex-col items-center font-openSans sm:text-xl'>
      <p className='m-2 text-[14px]'>{percentValue}%</p>
      <div className='flex h-32 w-2 bg-main-opposed/30 radius-default sm:h-56 sm:w-6 '>
        <div
          className='w-3 self-end  bg-gradient-to-t from-main-700 to-main-300 radius-default sm:w-6'
          style={{ height: percentValue + "%" }}
        />
      </div>
      <p className='my-2 w-full border-b border-white/20 px-3  pb-2  text-center text-[0.6rem] tracking-wider xs:text-xs sm:px-10 sm:text-sm md:px-9 lg:px-6 xl:px-8 '>
        {value}
      </p>
      <p className='text-center text-[0.6rem]  text-secondText xs:text-xs sm:text-sm'>
        {title}
      </p>
    </div>
  );
};

export default StatisticBar;
