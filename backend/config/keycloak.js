const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const keycloakConfig = {
  jwksUri: process.env.KEYCLOAK_JWKS_URI || '',
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
  realm: process.env.KEYCLOAK_REALM || '',
  authority: process.env.KEYCLOAK_AUTHORITY || '',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  adminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || '',
  adminClientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
};

module.exports = { keycloakConfig };
