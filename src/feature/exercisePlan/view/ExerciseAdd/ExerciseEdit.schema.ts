import * as yup from "yup";

export const exerciseSchema = yup.object().shape({
  title: yup.string().max(60).required("yup_errors:required"),
  isPrivate: yup.boolean().required(),
  exercise: yup.array().of(
    yup.object().shape({
      title: yup.string().max(50).required(),
      category: yup
        .string()
        .oneOf(["technique", "hearing", "theory", "creativity"])
        .required(),
      time: yup.number().required().min(1),
      done: yup.boolean(),
    })
  ),
});
