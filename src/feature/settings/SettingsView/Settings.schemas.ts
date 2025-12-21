import * as yup from "yup";

export const updateCredsSchema = yup.object().shape({
  login: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(28, "Username must be at most 28 characters")
    .matches(/^[^\s]+(\s+[^\s]+)*$/, "Username can't start or end with empty space"),

  email: yup.string().email("Enter a valid email"),
  password: yup.string().min(8, "Password must be at least 8 characters"),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must be the same"),
});

export const mediaSchema = yup.object().shape({
  youtube: yup
    .string()
    .matches(
      /(https?:\/\/)?(www\.)?youtu((\.be)|(be\..{2,5}))\/((user)|(channel|@))\/?([a-zA-Z0-9\-_]{1,})/,
      "It is not correct YouTube channel link"
    ),
  soundcloud: yup
    .string()
    .matches(
      /^((https?:\/\/)?(www\.)?soundcloud\.com\/)([\w\-]+)(\/)?$/i,
      "It is not correct SoundCloud link"
    ),
  bands: yup
    .string()
    .min(2, "Can't be less than 2 characters")
    .max(60, "Can't be more than 60 characters")
    .matches(/^(?!\s*$).+/, "Can't be empty"),
});
