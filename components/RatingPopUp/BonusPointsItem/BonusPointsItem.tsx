interface Props {
  multiplier?: number;
  additionalPoints?: number;
}

export default function BonusPointsItem({
  multiplier,
  additionalPoints,
}: Props) {
  return (
    <li className='flex items-center gap-3 md:first:-translate-x-[12%] md:last:translate-x-[12%]'>
      {multiplier && (
        <p className='text-2xl text-main-500 sm:text-4xl'>x{multiplier}</p>
      )}
      {additionalPoints && (
        <p className='text-2xl text-main-500 sm:text-3xl'>
          +{additionalPoints}
        </p>
      )}
      <p className='xs:text-xl md:text-2xl'>za systematyczność</p>
      <p className='text-base'>5 dni ćwiczeń pod rząd</p>
    </li>
  );
}
