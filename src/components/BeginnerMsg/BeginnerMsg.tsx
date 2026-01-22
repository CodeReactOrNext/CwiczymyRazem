import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";
import { FaArrowRight, FaInfoCircle } from "react-icons/fa";

export const BeginnerMsg = () => {
  const { t } = useTranslation("toast");

  return (
    <div
      className='mx-auto my-4 max-w-3xl overflow-hidden rounded-lg border border-blue-800 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 font-openSans shadow-sm transition-all duration-300 hover:shadow-md'
      data-testid='beginner-message'>
      <div className='flex items-center p-4'>
        <div className='mr-3 flex-shrink-0 text-blue-400'>
          <FaInfoCircle className='h-5 w-5' />
        </div>
        <div className='flex-grow'>
          <p className='text-xs font-medium text-gray-300 sm:text-sm'>
            {t("info.new_user_tip")}
          </p>
        </div>
        <div className='ml-2 flex-shrink-0'>
          <Link
            href='/faq'
            className='group inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors focus:outline-none hover:bg-blue-900/30 sm:text-sm'
            tabIndex={0}>
            FAQ
            <FaArrowRight className='ml-1.5 h-3 w-3' />
          </Link>
        </div>
      </div>
    </div>
  );
};
