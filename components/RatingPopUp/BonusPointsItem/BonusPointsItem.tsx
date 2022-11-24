interface Props {
  exerciseData: {
    multiplier?: number;
    additionalPoints?: number;
    streak?: number;
    habitsCount?: number;
    time?: string;
  };
}

export default function BonusPointsItem({
  exerciseData: { multiplier, additionalPoints, streak, habitsCount, time },
}: Props) {
  return (
    <li className='flex items-center gap-3 md:first:-translate-x-[5%] md:last:translate-x-[5%]'>
      {multiplier && (
        <p className='text-2xl text-main-500 sm:text-4xl'>x{multiplier}</p>
      )}
      {additionalPoints && (
        <p className='text-2xl text-main-500 sm:text-4xl'>
          +{additionalPoints}
        </p>
      )}
      {streak && (
        <>
          <p className='xs:text-xl md:text-2xl'>za systematyczność</p>
          <p className='text-base md:text-lg'>{streak} dni ćwiczeń pod rząd</p>
        </>
      )}
      {habitsCount && (
        <>
          <p className='xs:text-xl md:text-2xl'>za zdrowe nawyki</p>
          <p className='text-base md:text-lg'>
            zastosowałeś {habitsCount} zdrowe nawyki
          </p>
        </>
      )}
      {time && (
        <>
          <p className='xs:text-xl md:text-2xl'>za ilość czasu</p>
          <p className='text-base md:text-lg'>ćwiczyłeś łącznie {time}</p>
        </>
      )}
    </li>
  );
}
