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
      <div className='flex h-32 w-5 bg-main-opposed-50 sm:h-40 sm:w-8'>
        <div
          className='w-5 self-end bg-main sm:w-8'
          style={{ height: percentValue + "%" }}
        />
      </div>
      <p className='my-2 w-full bg-main-opposed px-5 sm:px-10 md:px-5 lg:px-10'>
        {value}h
      </p>
      <p>{title}</p>
    </div>
  );
};

export default StatisticBar;
