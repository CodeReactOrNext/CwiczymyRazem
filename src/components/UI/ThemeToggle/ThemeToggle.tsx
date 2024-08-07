import { useAppDispatch, useAppSelector } from "store/hooks";
import { changeTheme, selectLayoutMode } from "feature/user/store/userSlice";
import { FaMoon, FaSun } from "react-icons/fa";
import { useEffect } from "react";

const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectLayoutMode);

  useEffect(() => {
    if (theme === "dark-theme") {
      document?.querySelector("html")?.setAttribute("data-theme", "dark");
    }

    if (theme === "default-theme") {
      document?.querySelector("html")?.setAttribute("data-theme", "light");
    }
  }, [theme]);

  return (
    <div className='flex w-fit flex-col'>
      <label
        aria-hidden
        className='relative inline-flex cursor-pointer items-center'>
        <input
          tabIndex={-1}
          type='checkbox'
          className='peer sr-only'
          checked={theme === "dark-theme"}
          readOnly
        />
        <div
          onClick={() => {
            dispatch(changeTheme());
          }}
          className=" z-1 peer h-6 w-11 rounded-full bg-gray-200 text-sm  after:absolute  after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-main-bg peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-green-300">
          <FaMoon className='absolute right-1 m-auto h-full   text-main-opposed-bg' />
          <FaSun className='absolute left-1 m-auto h-full text-mainText ' />
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;
