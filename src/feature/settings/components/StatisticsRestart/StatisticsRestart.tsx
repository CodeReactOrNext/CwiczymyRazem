import { Button } from "assets/components/ui/button";
import { selectIsFetching } from "feature/user/store/userSlice";
import { restartUserStats } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const StatisticsRestart = () => {
  const { t } = useTranslation(["common", "toast", "settings"]);

  const [restartConfirmShow, setRestartConfirmShow] = useState(false);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();

  return (
    <div className='flex flex-col gap-2  p-4 text-2xl'>
      <p className='text-tertiary'>{t("settings:reset_stats")}</p>

      {!restartConfirmShow && (
        <>
          <p className='font-openSans text-sm font-bold '>
            {t("settings:reset_warning")}
          </p>
          <Button
            variant='destructive'
            onClick={() => setRestartConfirmShow(true)}>
            {t("settings:reset")}
          </Button>
        </>
      )}
      {restartConfirmShow && (
        <>
          <p className=' text-lg'>{t("settings:reset_approve_info")}</p>
          <div className='flex flex-row justify-center gap-3'>
            <Button
              variant={"destructive"}
              onClick={() => dispatch(restartUserStats())}>
              {isFetching && <Loader2 className='animate-spin' />}

              {t("settings:reset")}
            </Button>
            <Button onClick={() => setRestartConfirmShow(false)}>
              {t("settings:back")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsRestart;
