import keycloak from "@/lib/keycloak";

const CheckoutLogin = () => {
  const handleLogin = () => {
    keycloak.login({ redirectUri: window.location.href });
  };

  if (keycloak.authenticated) return null;

  return (
    <div className="tp-checkout-verify-item">
      <p className="tp-checkout-verify-reveal">
        Returning customer?{" "}
        <button
          onClick={handleLogin}
          type="button"
          className="tp-checkout-login-form-reveal-btn"
        >
          Click here to login
        </button>
      </p>
    </div>
  );
};

export default CheckoutLogin;
