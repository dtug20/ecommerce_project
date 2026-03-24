import keycloak from "@/lib/keycloak";

const CheckoutLogin = () => {
  const handleLogin = () => {
    keycloak.login({ redirectUri: window.location.href });
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
