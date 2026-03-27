import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import keycloak from "@/lib/keycloak";
import { userLoggedIn, userLoggedOut } from "@/redux/features/auth/authSlice";
import { authApi } from "@/redux/features/auth/authApi";
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
        enablePkce: true,
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        if (authenticated) {
          syncUserToRedux();
          // Fetch MongoDB profile to populate _id for orders, reviews, etc.
          try {
            const profileResult = await dispatch(authApi.endpoints.getUserProfile.initiate());
            if (profileResult?.error) {
              console.error("[Auth] Failed to fetch user profile:", profileResult.error);
            }
          } catch (err) {
            console.error("[Auth] getUserProfile exception:", err);
          }
        }
        setInitialized(true);
      })
      .catch((err) => {
        // Keycloak init failed — app will still render for anonymous users
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
          // Token refresh failed — log user out
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

  // Render children immediately — don't block the entire app while Keycloak
  // initializes. Protected pages handle their own auth checks.
  return (
    <KeycloakContext.Provider value={{ ...keycloak, initialized }}>
      {children}
    </KeycloakContext.Provider>
  );
};

export default KeycloakProvider;
