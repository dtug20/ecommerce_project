import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "shofy",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "shofy-frontend",
});

export default keycloak;
