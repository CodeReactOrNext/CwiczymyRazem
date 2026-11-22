import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Chip } from "assets/components/ui/chip";
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
      <Card className=' bg-second shadow-sm backdrop-blur-sm transition-shadow duration-base hover:shadow-md'>
        <CardHeader className='pb-2'>
          <div className='flex flex-col'>
            <CardTitle className='mb-1  text-lg font-medium text-white sm:text-xl'>
              {title}
              {isOptional && (
                <Chip color='gray' size='sm' className='ml-2 font-normal'>
                  opcjonalne
                </Chip>
              )}
            </CardTitle>
            {subtitle && (
              <p className='mt-1 text-sm text-gray-400'>
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
