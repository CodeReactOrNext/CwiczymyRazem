import { SerializedError } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const loginViaEmailErrorHandler = (error: SerializedError) => {
  if (error.code === "auth/wrong-password") {
    toast.error("Błędne hasło");
    return;
  }
  if (error.code === "auth/user-not-found") {
    toast.error("Błędny adres e-mail");
    return;
  }
  if (error.code === "auth/timeout") {
    toast.error("Nie udało się zalogować - błąd połączenia");
    return;
  }
  toast.error("Nie udało się zalogować");
};

export const loginViaGoogleErrorHandler = (error: SerializedError) => {if (error.code === "auth/popup-closed-by-user") {
  toast.error("Nie udało się zalogować - zamknięto okno logowania ");
  return;
}
if (error.code === "auth/timeout") {
  toast.error("Nie udało się zalogować - błąd połączenia");
  return;
}
toast.error("Nie udało się zalogować");}