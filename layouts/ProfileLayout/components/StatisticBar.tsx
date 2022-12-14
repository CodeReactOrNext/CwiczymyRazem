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
      <div className='flex h-32 w-5 bg-main-opposed-50 bg-opacity-50 sm:h-40 sm:w-8 '>
        <div
          className='w-5  self-end  bg-gradient-to-t from-main-700 to-main-300 sm:w-8'
          style={{ height: percentValue + "%" }}
        />
      </div>
      <p className='my-2 w-full bg-main-opposed bg-opacity-80  px-5 sm:px-10 md:px-5 xl:px-8'>
        {value}h
      </p>
      <p>{title}</p>
    </div>
  );
};

export default StatisticBar;
