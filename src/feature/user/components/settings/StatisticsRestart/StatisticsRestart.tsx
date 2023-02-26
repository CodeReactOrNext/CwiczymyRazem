import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";

import Button from "components/UI/Button";

import { restartUserStats } from "feature/user/store/userSlice.asyncThunk";
import { selectIsFetching } from "feature/user/store/userSlice";

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
          <Button variant='small' onClick={() => setRestartConfirmShow(true)}>
            {t("settings:reset")}
          </Button>
        </>
      )}
      {restartConfirmShow && (
        <>
          <p className=' text-lg'>{t("settings:reset_approve_info")}</p>
          <div className='flex flex-row justify-center gap-3'>
            <Button
              variant='small'
              loading={isFetching}
              onClick={() => dispatch(restartUserStats())}>
              {t("settings:reset")}
            </Button>
            <Button
              variant='small'
              onClick={() => setRestartConfirmShow(false)}>
              {t("settings:back")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsRestart;
