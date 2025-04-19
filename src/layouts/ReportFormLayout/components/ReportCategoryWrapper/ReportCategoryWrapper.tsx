import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { motion } from "framer-motion";

interface ReportCategoryWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isOptional?: boolean;
}

const ReportCategoryWrapper = ({
  children,
  title,
  subtitle,
  isOptional = false,
}: ReportCategoryWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>
      <Card className=' bg-second shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md'>
        <CardHeader className='pb-2'>
          <div className='flex flex-col'>
            <CardTitle className='mb-1  text-lg font-medium tracking-wide text-white sm:text-xl'>
              {title}
              {isOptional && (
                <span className='ml-2 rounded-full border border-gray-800/50 bg-gray-900/50 px-2 py-0.5 text-xs font-normal text-gray-400'>
                  opcjonalne
                </span>
              )}
            </CardTitle>
            {subtitle && (
              <p className='mt-1 font-openSans text-sm text-gray-400'>
                {subtitle}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2 sm:px-6'>{children}</CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportCategoryWrapper;
