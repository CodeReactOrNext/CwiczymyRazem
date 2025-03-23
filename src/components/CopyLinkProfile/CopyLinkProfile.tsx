import { Button } from "assets/components/ui/button";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MdCheck, MdCopyAll } from "react-icons/md";
import { useAppSelector } from "store/hooks";

export const CopyLinkProfile = () => {
  const { t } = useTranslation(["common", "toast"]);
  const profilePath = useAppSelector(selectUserAuth);
  const [isCopied, setIsCopied] = React.useState(false);

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

  return (
    <Button
      variant='outline'
      onClick={handleCopyLink}
      className='z-40 m-auto flex max-w-[220px] flex-row items-center gap-2 border-dashed text-center text-[0.7rem] click-behavior xs:text-xs'>
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
            <MdCheck className='text-[1rem] text-green-600' />
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
            <MdCopyAll className='text-[1rem]' />
          </motion.div>
        )}
      </AnimatePresence>
      {t("common:button.link_copy_profile")}
    </Button>
  );
};
