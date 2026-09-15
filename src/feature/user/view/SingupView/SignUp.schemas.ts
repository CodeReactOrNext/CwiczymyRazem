import * as yup from "yup";

export const signupSchema = yup.object().shape({
  login: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(28, "Username must be at most 28 characters")
    .matches(
      /^[^\s]+(\s+[^\s]+)*$/,
      "Username can't start or end with empty space",
    )
    .required("Required"),
  email: yup.string().email("Enter a valid email").required("Required"),
  // No `repeat_password`: the field has a show/hide toggle, so retyping the
  // password only added friction (and a second mobile keyboard round-trip).
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Required"),
});
