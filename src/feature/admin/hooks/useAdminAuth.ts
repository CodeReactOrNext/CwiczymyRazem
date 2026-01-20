import axios from "axios";
import { useEffect,useState } from "react";
import { toast } from "sonner";

export const useAdminAuth = (onAuthSuccess: (pass: string) => void) => {
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const savedPass = sessionStorage.getItem("admin_session_pass");
    if (savedPass) {
      setPassword(savedPass);
      validateAndFetch(savedPass);
    }
  }, []);

  const validateAndFetch = async (pass: string) => {
    try {
      const res = await axios.post("/api/admin/auth", { password: pass });
      if (res.data.success) {
        setIsAuth(true);
        sessionStorage.setItem("admin_session_pass", pass);
        onAuthSuccess(pass);
      }
    } catch (error) {
      // toast.error("Session expired");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/admin/auth", { password });
      if (res.data.success) {
        setIsAuth(true);
        sessionStorage.setItem("admin_session_pass", password);
        onAuthSuccess(password);
        toast.success("Identity verified");
      }
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session_pass");
    setIsAuth(false);
    setPassword("");
    toast.info("Logged out from admin panel");
  };

  return {
    password,
    setPassword,
    isAuth,
    handleLogin,
    handleLogout
  };
};
