import { Button } from "assets/components/ui/button";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Link2, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MdCheck } from "react-icons/md";
import { useAppSelector } from "store/hooks";

export const CopyLinkProfile = ({ mode = "default" }: { mode?: "default" | "icon" }) => {
  const { t } = useTranslation(["common", "toast"]);
  const profilePath = useAppSelector(selectUserAuth);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    if (isCopied) return;

    navigator.clipboard.writeText(
      window.location.host + "/user/" + profilePath
    );

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  if (mode === "default") {
    return (
      <Link href={`/user/${profilePath}`}>
        <Button
          variant="outline"
          className="z-40 click-behavior m-auto flex max-w-[220px] flex-row items-center gap-2 border-dashed text-center text-[0.7rem] xs:text-xs"
        >
          <User className="text-[1rem]" />
          See your profile
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopyLink}
      className="z-40 click-behavior h-8 w-8"
    >
      <AnimatePresence mode='wait'>
        {isCopied ? (
          <motion.div
            key='check'
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}>
            <MdCheck className="text-green-500 text-sm" />
          </motion.div>
        ) : (
          <motion.div
            key='copy'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}>
            <Link2 size={14} />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};
