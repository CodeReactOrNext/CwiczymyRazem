import { Button } from "assets/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "assets/components/ui/sheet";
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

export const ActivitySheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasNewMessages: hasNewLogs } = useUnreadMessages("logs");
  const { hasNewMessages: hasNewChats } = useUnreadMessages("chats");
  
  const hasAnyNew = hasNewLogs || hasNewChats;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative text-zinc-400 hover:bg-white/5 hover:text-white'
          title='Activity & Chat'>
          <MessageSquare size={20} />
          {hasAnyNew && (
            <span className='absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-orange-500 ring-2 ring-zinc-950' />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='w-full border-l border-white/10 bg-zinc-950 p-0 sm:max-w-lg'>
        <div className='sr-only'>
          <SheetTitle>Activity Feed & Chat</SheetTitle>
        </div>
        
        <div className='flex h-full flex-col pt-10 pb-20 sm:pb-0'>
          {isOpen && (
             <LogsBoxView className='h-full border-none bg-transparent shadow-none [&_.bg-main-opposed-bg]:bg-zinc-900/50 [&_.bg-main-opposed-bg]:border-white/5' />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
