interface StatisticBarProps {
  title: string;
  value: string;
  percent: number;
}
const StatisticBar = ({ title, value, percent }: StatisticBarProps) => {
  const percentValue = percent ? percent : 0;

  return (
    <div className=' m-1 flex flex-col  items-center font-openSans sm:text-xl'>
      <p className='m-2  text-xs '>{percentValue}%</p>
      <div className='flex h-32 w-5 bg-main-opposed/30 radius-default sm:h-56 sm:w-10 '>
        <div
          className='w-5 self-end  bg-gradient-to-t from-main-700 to-main-300 radius-default sm:w-10'
          style={{ height: percentValue + "%" }}
        />
      </div>
      <p className='my-2 w-full border-2 border-main-opposed-400/80 bg-main-opposed p-1 px-3  text-center text-[0.6rem] tracking-wider radius-default xs:text-xs sm:px-10 md:px-9 lg:px-6 sm:text-sm xl:px-8 '>
        {value}
      </p>
      <p className='text-center text-[0.6rem] font-bold  xs:text-xs sm:text-sm'>
        {title}
      </p>
    </div>
  );
};

export default StatisticBar;
