const { keycloakConfig } = require('../config/keycloak');

const VALIDATION_CACHE_TTL = 30_000;
const ADMIN_TOKEN_TTL = 50_000;
const VALIDATION_CACHE_MAX_SIZE = 200;

const validationCache = new Map();
let adminTokenExpiresAt = 0;

// Lazy-loaded admin client (ESM-only package)
let kcAdminClient = null;

async function getOrCreateAdminClient() {
  if (kcAdminClient) return kcAdminClient;
  const { default: KcAdminClient } = await import('@keycloak/keycloak-admin-client');
  const baseUrl = keycloakConfig.authority.replace(/\/realms\/.*/, '');
  kcAdminClient = new KcAdminClient({
    baseUrl,
    realmName: keycloakConfig.realm,
  });
  return kcAdminClient;
}

// ─── Admin Authentication (cached) ─────────────────────────────

async function authenticateAdmin() {
  if (Date.now() < adminTokenExpiresAt) return;
  const client = await getOrCreateAdminClient();

  try {
    await client.auth({
      grantType: 'client_credentials',
      clientId: keycloakConfig.adminClientId || keycloakConfig.clientId,
      clientSecret: keycloakConfig.adminClientSecret || keycloakConfig.clientSecret,
    });
    adminTokenExpiresAt = Date.now() + ADMIN_TOKEN_TTL;
  } catch (error) {
    console.error(`[Keycloak] Admin authentication failed: ${error.message}`);
    throw new Error('Keycloak admin authentication failed');
  }
}

// ─── Token Validation (via userinfo endpoint, cached) ───────────

async function validateToken(token) {
  const cached = validationCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const userInfoUrl = `${keycloakConfig.authority}/protocol/openid-connect/userinfo`;
    const response = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Userinfo returned ${response.status}`);
    }

    const data = await response.json();

    validationCache.set(token, {
      data,
      expiresAt: Date.now() + VALIDATION_CACHE_TTL,
    });

    if (validationCache.size > VALIDATION_CACHE_MAX_SIZE) {
      cleanupValidationCache();
    }

    return data;
  } catch (error) {
    validationCache.delete(token);
    console.error(`[Keycloak] Token validation failed: ${error.message}`);
    throw new Error('Invalid access token');
  }
}

// ─── User Queries ───────────────────────────────────────────────

async function findUserById(keycloakUserId) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const user = await client.users.findOne({ id: keycloakUserId });
    if (!user) throw new Error('User not found');
    return user;
  } catch (error) {
    console.error(`[Keycloak] Failed to find user ${keycloakUserId}: ${error.message}`);
    throw error;
  }
}

async function findUserByEmail(email) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const users = await client.users.find({ email, exact: true });
    return users?.[0] ?? null;
  } catch (error) {
    console.error(`[Keycloak] Failed to search user by email: ${error.message}`);
    throw error;
  }
}

async function findUserByUsername(username) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const users = await client.users.find({ username, exact: true });
    return users?.[0] ?? null;
  } catch (error) {
    console.error(`[Keycloak] Failed to search user by username: ${error.message}`);
    throw error;
  }
}

// ─── User Mutations ─────────────────────────────────────────────

async function createUser(data) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const user = await client.users.create({
      ...data,
      enabled: data.enabled !== undefined ? data.enabled : true,
    });
    console.log(`[Keycloak] Created user: ${data.username || data.email}`);
    return user.id;
  } catch (error) {
    console.error(`[Keycloak] Failed to create user: ${error.message}`);
    throw error;
  }
}

async function updateUser(keycloakUserId, data) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    await client.users.update({ id: keycloakUserId }, data);
    console.log(`[Keycloak] Updated user ${keycloakUserId}`);
  } catch (error) {
    console.error(`[Keycloak] Failed to update user ${keycloakUserId}: ${error.message}`);
    throw error;
  }
}

async function updateUserAttributes(keycloakUserId, attributes) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const user = await client.users.findOne({ id: keycloakUserId });
    if (!user) throw new Error('User not found');
    const mergedAttributes = { ...user.attributes, ...attributes };
    await client.users.update(
      { id: keycloakUserId },
      { username: user.username, email: user.email, attributes: mergedAttributes }
    );
    console.log(`[Keycloak] Updated attributes for user ${keycloakUserId}`);
  } catch (error) {
    console.error(`[Keycloak] Failed to update attributes: ${error.message}`);
    throw error;
  }
}

async function setUserEnabled(keycloakUserId, enabled) {
  await updateUser(keycloakUserId, { enabled });
}

async function resetUserPassword(keycloakUserId, newPassword, temporary = false) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    await client.users.resetPassword({
      id: keycloakUserId,
      credential: { type: 'password', value: newPassword, temporary },
    });
    console.log(`[Keycloak] Reset password for user ${keycloakUserId}`);
  } catch (error) {
    console.error(`[Keycloak] Failed to reset password: ${error.message}`);
    throw error;
  }
}

async function getUserAttributes(keycloakUserId) {
  const user = await findUserById(keycloakUserId);
  return user.attributes ?? {};
}

async function assignRealmRole(keycloakUserId, roleName) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    const roles = await client.roles.findOneByName({ name: roleName });
    if (!roles) throw new Error(`Role '${roleName}' not found`);
    await client.users.addRealmRoleMappings({
      id: keycloakUserId,
      roles: [{ id: roles.id, name: roles.name }],
    });
    console.log(`[Keycloak] Assigned role '${roleName}' to user ${keycloakUserId}`);
  } catch (error) {
    console.error(`[Keycloak] Failed to assign role: ${error.message}`);
    throw error;
  }
}

async function deleteUser(keycloakUserId) {
  await authenticateAdmin();
  const client = await getOrCreateAdminClient();
  try {
    await client.users.del({ id: keycloakUserId });
    console.log(`[Keycloak] Deleted user ${keycloakUserId}`);
  } catch (error) {
    console.error(`[Keycloak] Failed to delete user ${keycloakUserId}: ${error.message}`);
    throw error;
  }
}

async function getAdminClient() {
  return getOrCreateAdminClient();
}

// ─── Helpers ────────────────────────────────────────────────────

function cleanupValidationCache() {
  const now = Date.now();
  validationCache.forEach((value, key) => {
    if (value.expiresAt <= now) {
      validationCache.delete(key);
    }
  });
}

module.exports = {
  validateToken,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  updateUser,
  updateUserAttributes,
  setUserEnabled,
  resetUserPassword,
  getUserAttributes,
  assignRealmRole,
  deleteUser,
  getAdminClient,
  authenticateAdmin,
};
