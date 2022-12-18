import * as yup from "yup";

export const RaportSchema = yup.object().shape({
  techniqueHours: yup.number().max(23).min(0),
  techniqueMinutes: yup.number().max(59).min(0),
  theoryHours: yup.number().max(23).min(0),
  theoryMinutes: yup.number().max(59).min(0),
  hearingHours: yup.number().max(23).min(0),
  hearingMinutes: yup.number().max(59).min(0),
  creativeHours: yup.number().max(23).min(0),
  creativeMinutes: yup.number().max(59).min(0),
});