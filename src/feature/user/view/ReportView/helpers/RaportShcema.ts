import { MAX_DAYS_BACK } from "constants/gameSettings";
import * as yup from "yup";

export const RaportSchema = yup.object().shape({
  techniqueHours: yup.number().max(23).min(0),
  techniqueMinutes: yup.number().max(59).min(0),
  theoryHours: yup.number().max(23).min(0),
  theoryMinutes: yup.number().max(59).min(0),
  hearingHours: yup.number().max(23).min(0),
  hearingMinutes: yup.number().max(59).min(0),
  creativityHours: yup.number().max(23).min(0),
  creativityMinutes: yup.number().max(59).min(0),
  countBackDays: yup.number().max(MAX_DAYS_BACK).min(0),
  reportTitle: yup.string().max(60).min(0),
});
