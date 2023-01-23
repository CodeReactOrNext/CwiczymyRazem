interface StatisticBarProps {
  title: string;
  value: string;
  percent: number;
}
const StatisticBar = ({ title, value, percent }: StatisticBarProps) => {
  const percentValue = percent ? percent : 0;

  return (
    <div className='z-10 flex flex-col items-center sm:text-xl '>
      <p className='text-sm sm:text-lg'>{percentValue}%</p>
      <div className='flex h-32 w-5 bg-main-opposed-50 bg-opacity-50 radius-default sm:h-56 sm:w-10 '>
        <div
          className='w-5 self-end  bg-gradient-to-t from-main-700 to-main-300 radius-default sm:w-10'
          style={{ height: percentValue + "%" }}
        />
      </div>
      <p className='my-2 w-full bg-main-opposed bg-opacity-80 p-1 px-3 font-openSans text-sm font-bold   sm:px-10 md:px-5 xl:px-8 '>
        {value}h
      </p>
      <p className='text-center font-openSans text-sm font-bold'>{title}</p>
    </div>
  );
};

export default StatisticBar;
