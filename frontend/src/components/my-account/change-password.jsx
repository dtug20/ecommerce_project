import React from "react";
import keycloak from "@/lib/keycloak";

const ChangePassword = () => {
  const handleChangePassword = () => {
    // Redirect to Keycloak account management for password change
    const accountUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/account/#/security/signingin`;
    window.open(accountUrl, "_blank");
  };

  return (
    <div className="profile__password">
      <div className="row">
        <div className="col-xxl-12">
          <p className="mb-3">
            Password management is handled through your Keycloak account.
            Click the button below to change your password.
          </p>
          <div className="profile__btn">
            <button
              type="button"
              className="tp-btn"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
