import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface PracticeCommentProps {
  comment: string;
}

export function PracticeComment({ comment }: PracticeCommentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}>
      <Card className='border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent backdrop-blur-sm'>
        <div className='flex items-start gap-3 p-3'>
          <div className='rounded-full bg-cyan-500/10 p-1.5'>
            <Lightbulb className='h-4 w-4 text-cyan-400' />
          </div>
          <p className='flex-1 text-sm leading-relaxed text-gray-300'>
            {comment}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
