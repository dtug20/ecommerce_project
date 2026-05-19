# Google Social Login — Manual Test Plan

Run these tests after deploy to verify the integration works end-to-end.

## Prerequisites
- Google OAuth client created per `docs/google-oauth-setup.md`
- `kcadm.sh` script ran successfully on VPS (see Deploy section below)
- Keycloak container restarted (to load updated theme)
- Frontend container restarted (to pick up i18n changes + new login.jsx)

## Deploy steps on VPS

```bash
# 1. SSH into VPS
ssh user@tychicus.id.vn
cd /path/to/ecommerce_website-main

# 2. Pull latest code (CI/CD should have done this already after push)
git pull origin main

# 3. Add Google secrets to .env (project root)
nano .env
# Append:
#   GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
#   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
chmod 600 .env

# 4. Recreate keycloak container (new volume mount for scripts)
docker compose -f docker-compose.prod.yml up -d --force-recreate keycloak

# 5. Wait for Keycloak healthy
docker compose -f docker-compose.prod.yml logs --tail 30 keycloak | grep -i "listening"

# 6. Run kcadm script inside container
docker exec -i \
  -e GOOGLE_CLIENT_ID="$(grep ^GOOGLE_CLIENT_ID .env | cut -d= -f2-)" \
  -e GOOGLE_CLIENT_SECRET="$(grep ^GOOGLE_CLIENT_SECRET .env | cut -d= -f2-)" \
  -e KC_ADMIN="$(grep ^KEYCLOAK_ADMIN_USER .env | cut -d= -f2- || echo admin)" \
  -e KC_ADMIN_PASSWORD="$(grep ^KEYCLOAK_ADMIN_PASSWORD .env | cut -d= -f2-)" \
  shofy-keycloak \
  bash /opt/keycloak/scripts/configure-google-idp.sh

# 7. Recreate frontend container
docker compose -f docker-compose.prod.yml pull frontend
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

## Test 1: New user registers via Google
1. Use a Gmail account NOT yet in Keycloak (check Admin Console → Users to confirm).
2. Open https://tychicus.id.vn/login
3. **Expected:** See "Sign in" card with "Continue with Google" button + "Or continue with" + "Sign in with email" button.
4. Click "Continue with Google"
5. Google consent screen → Allow
6. **Expected:** Redirect back to https://tychicus.id.vn/ as logged-in user
7. Verify in Keycloak Admin Console → Users → search by email → confirm:
   - User exists
   - Email is `verified`
   - Identity Provider Links shows `google`
8. Verify MongoDB:
   ```bash
   docker exec shofy-mongodb mongosh shofy --eval 'db.users.findOne({email: "TEST_EMAIL"})'
   ```
   - Confirm `keycloakId` is populated and matches Keycloak user `id`

## Test 2: Existing email/password user links Google
1. Pre-create user in Keycloak with email/password (e.g., `test-existing@gmail.com`).
2. Logout from storefront.
3. Click "Continue with Google" using same Gmail account.
4. **Expected:** No password prompt, no "Account already exists" form. Direct login.
5. Verify Keycloak Admin Console → same user now shows `google` in Identity Provider Links.
6. Verify MongoDB user: same `_id`, `keycloakId` unchanged.

## Test 3: Returning Google user (already linked)
1. Logout from storefront.
2. Click "Continue with Google" again.
3. **Expected:** Instant redirect, no Google consent re-prompt (Google remembers).

## Test 4: CRM gating — Google button hidden
1. Open https://tychicus.id.vn/admin/ (CRM)
2. Should redirect to Keycloak login for `shofy-crm` client.
3. **Expected:** NO Google button on this login page.
4. URL trick check: navigate to `https://tychicus.id.vn/auth/realms/shofy/protocol/openid-connect/auth?client_id=shofy-crm&kc_idp_hint=google&...` directly.
5. **Expected:** Flow still proceeds (theme-only gating, not flow-override). Acceptable per design — admin Keycloak users need admin role anyway.

## Test 5: Sign in with email/password still works
1. From storefront login page (https://tychicus.id.vn/login), click "Sign in with email".
2. **Expected:** Redirect to Keycloak hosted login form with username/password.
3. Login normally — works as before.

## Test 6: Logout
1. After Google login, click logout in storefront.
2. **Expected:** Keycloak session ended. Re-visit https://tychicus.id.vn/login → not authenticated.
3. Google session NOT killed (intentional). Clicking "Continue with Google" again is instant.

## Test 7: Token refresh
1. After Google login, leave browser open for >5 minutes (default access token expiry).
2. Trigger an authenticated API call (e.g., visit `/profile`).
3. **Expected:** keycloak-js auto-refreshes via refresh token. No re-prompt.

## Test 8: i18n switching
1. Open storefront login page in EN locale → button shows "Continue with Google".
2. Switch to VI → button shows "Tiếp tục với Google".
3. Repeat on Keycloak hosted login page (via "Sign in with email" path) → button labels also translate.

## Failure modes to watch
| Symptom | Likely cause |
|---|---|
| "Invalid redirect URI" on Google consent | Google Cloud Console redirect URI list missing `/auth/realms/shofy/broker/google/endpoint` |
| "Could not link your account" error in Keycloak | Custom flow misconfigured — `Automatically Set Existing User` step not ALTERNATIVE. Re-run `configure-google-idp.sh` |
| Google button missing on Keycloak login page | Theme not reloaded — restart Keycloak container |
| Google button missing on storefront `/login` UI | i18n keys missing or frontend not rebuilt — check `frontend/src/locales/en/common.json` has `continueWithGoogle` |
| Backend rejects token after Google login | `verifyToken.js` failed to sync user — check backend logs for `[Auth]` messages |
| CRM login shows Google button | `client.clientId == 'shofy-crm'` check not matching — verify CRM client ID in realm matches |

## Rollback

If something breaks in production:

1. **Disable Google IdP** (immediate, no code change):
   ```bash
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh \
     config credentials --server http://localhost:8080 --realm master \
     --user "$KC_ADMIN" --password "$KC_ADMIN_PASSWORD"
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh \
     update identity-provider/instances/google -r shofy -s enabled=false
   ```

2. **Revert storefront login page** (if UI is the issue):
   ```bash
   git revert <commit-hash-for-login.jsx> --no-edit
   git push origin main
   ```

3. **Remove Google IdP entirely** (clean state):
   ```bash
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh \
     delete identity-provider/instances/google -r shofy
   ```

Already-linked users keep their Keycloak account; they lose ability to log in via Google but can use password reset to set a password.
