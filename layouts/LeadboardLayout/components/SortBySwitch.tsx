import { sortBy } from "feature/leadboard/view/LeadboardView";
import { Dispatch, SetStateAction } from "react";

interface SortBySwitchInterface {
  setSortBy: Dispatch<SetStateAction<sortBy>>;
}

function SortBySwitch({ setSortBy }: SortBySwitchInterface) {
  const selectChandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as sortBy);
  };

  return (
    <div className='absolute right-[5%] -top-6 flex items-center gap-2 text-main-opposed-500 lg:right-[10%] xl:right-[15%]'>
      <p className='text-tertiary-500'>Sort by</p>
      <select name='SortBySwitch' id='sort' onChange={selectChandler}>
        <option value='points'>points</option>
        <option value='time'>time</option>
        <option value='sessionCount'>session count</option>
      </select>
    </div>
  );
}
export default SortBySwitch;
