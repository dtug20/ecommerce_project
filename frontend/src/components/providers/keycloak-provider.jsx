import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import keycloak from "@/lib/keycloak";
import { userLoggedIn, userLoggedOut } from "@/redux/features/auth/authSlice";
import Loader from "@/components/loader/loader";

const KeycloakContext = createContext(null);

export const useKeycloak = () => useContext(KeycloakContext);

const KeycloakProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const initRef = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    keycloak
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          typeof window !== "undefined"
            ? `${window.location.origin}/silent-check-sso.html`
            : undefined,
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (authenticated) {
          syncUserToRedux();
        }
        setInitialized(true);
      })
      .catch((err) => {
        console.error("[Keycloak] Init failed:", err);
        setInitialized(true);
      });

    // Auto-refresh token before expiry
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            syncUserToRedux();
          }
        })
        .catch(() => {
          console.error("[Keycloak] Token refresh failed");
          dispatch(userLoggedOut());
        });
    };

    keycloak.onAuthLogout = () => {
      dispatch(userLoggedOut());
    };
  }, [dispatch]);

  const syncUserToRedux = () => {
    if (keycloak.tokenParsed) {
      dispatch(
        userLoggedIn({
          user: {
            keycloakId: keycloak.tokenParsed.sub,
            name:
              keycloak.tokenParsed.name ||
              keycloak.tokenParsed.preferred_username,
            email: keycloak.tokenParsed.email,
            roles: keycloak.tokenParsed.realm_access?.roles || [],
          },
          authenticated: true,
        })
      );
    }
  };

  if (!initialized) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        <Loader spinner="fade" loading={true} />
      </div>
    );
  }

  return (
    <KeycloakContext.Provider value={keycloak}>
      {children}
    </KeycloakContext.Provider>
  );
};

export default KeycloakProvider;
