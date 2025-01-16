import * as yup from "yup";

export const updateCredsSchema = yup.object().shape({
  login: yup
    .string()
    .min(3, "yup_errors:username_char_number")
    .max(28, "yup_errors:username_char_max_number")
    .matches(/^[^\s]+(\s+[^\s]+)*$/, "yup_errors:no_ends_whitespace"),

  email: yup.string().email("yup_errors:valid_email"),
  password: yup.string().min(8, "yup_errors:password_char_number"),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "yup_errors:same_passwords"),
});

export const mediaSchema = yup.object().shape({
  youtube: yup
    .string()
    .matches(
      /(https?:\/\/)?(www\.)?youtu((\.be)|(be\..{2,5}))\/((user)|(channel|@))\/?([a-zA-Z0-9\-_]{1,})/,
      "yup_errors:not_yt_link"
    ),
  soundcloud: yup
    .string()
    .matches(
      /^((https?:\/\/)?(www\.)?soundcloud\.com\/)([\w\-]+)(\/)?$/i,
      "yup_errors:not_sc_link"
    ),
  bands: yup
    .string()
    .min(2, "yup_errors:min_bands")
    .max(60, "yup_errors:max_bands")
    .matches(/^(?!\s*$).+/, "yup_errors:empty"),
});
