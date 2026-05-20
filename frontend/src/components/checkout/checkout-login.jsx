import { useTranslation } from "react-i18next";
import keycloak from "@/lib/keycloak";

const CheckoutLogin = () => {
  const { i18n } = useTranslation();
  const handleLogin = () => {
    const locale = (i18n.language || "en").startsWith("vi") ? "vi" : "en";
    keycloak.login({ redirectUri: window.location.href, locale });
  };

  if (keycloak.authenticated) return null;

  return (
    <div className="cl-checkout__login-prompt">
      Returning customer?{" "}
      <button onClick={handleLogin} type="button">
        Click here to login
      </button>
    </div>
  );
};

export default CheckoutLogin;
