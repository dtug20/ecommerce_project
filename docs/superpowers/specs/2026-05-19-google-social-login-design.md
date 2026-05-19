# Google Social Login via Keycloak — Design

**Date:** 2026-05-19
**Status:** Approved, ready for implementation plan
**Owner:** tychicus

## Goal

Cho phép khách hàng đăng nhập storefront Shofy bằng tài khoản Google, sử dụng Keycloak Identity Provider. Admin/staff CRM tiếp tục dùng email/password (không hiện nút Google trên CRM login). Facebook và các provider khác để pha sau (cùng pattern).

## Non-goals

- Facebook / GitHub / Apple login (deferred).
- Đăng nhập Google trực tiếp từ CRM admin panel.
- Migration của các user MongoDB legacy (đã đăng ký từ trước phase Keycloak) — flow auto-link sẽ tự xử khi user click Google lần đầu.
- Backend API changes — middleware `verifyToken.js` đã handle case Keycloak user mới.

## Architecture

```
[Storefront login page]
   │  user clicks "Continue with Google"
   ▼
keycloak-js: keycloak.login({ idpHint: 'google' })
   │
   ▼
GET /auth/realms/shofy/protocol/openid-connect/auth
    ?client_id=shofy-frontend
    &kc_idp_hint=google
    &redirect_uri=https://tychicus.id.vn/auth-callback
   │
   ▼
Keycloak → 302 → Google OAuth consent
   │
   ▼
User consents → Google → /auth/realms/shofy/broker/google/endpoint
   │
   ▼
Keycloak runs first-broker-login flow:
   • Detect Existing Broker User (by email)
   • If existing user found AND email_verified=true (trustEmail) → auto-link to existing Keycloak user
   • Else → create new Keycloak user from Google claims
   │
   ▼
Redirect back to storefront with auth code
   │
   ▼
keycloak-js exchanges code → Keycloak issues JWT
   │
   ▼
Storefront stores JWT, calls backend with Authorization: Bearer <token>
   │
   ▼
backend/middleware/verifyToken.js (already exists):
   • verify JWT signature via JWKS
   • lookup MongoDB User by keycloakId (payload.sub)
   • if not found, lookup by email and link
   • if still not found, create new User document
```

Zero changes to backend. All work in: Google Cloud Console + Keycloak realm config + storefront UI + theme.

## Components

### 1. Google Cloud Console OAuth Client

Manual step done once per environment:

- Project: shofy-prod (create if not exists)
- OAuth consent screen: External, app name "Shofy", support email, logo, privacy policy URL, terms URL
- OAuth Client ID:
  - Type: Web application
  - Name: `shofy-keycloak-broker`
  - Authorized JavaScript origins: `https://tychicus.id.vn`
  - Authorized redirect URIs: `https://tychicus.id.vn/auth/realms/shofy/broker/google/endpoint`
- Output: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → save to `.env` and to GitHub Actions secrets

### 2. Keycloak realm config (documentation only)

Update `keycloak/realm-export.json` to document the desired state. **Note:** Keycloak does NOT re-apply `realm-export.json` to an existing realm — this is only used on fresh-realm bootstrap. The authoritative deploy mechanism is the `kcadm.sh` script in section 6. The realm-export update is purely for documentation + future fresh-environment provisioning.

```json
{
  "identityProviders": [
    { "alias": "google", ... }
  ]
}
```

Placeholder `${env.GOOGLE_CLIENT_ID}` is not literal substitution — fresh-realm bootstrap will need to manually patch secrets, OR set `clientId`/`clientSecret` to empty strings in the file and let the kcadm script populate them.

Full expected JSON shape:

```json
{
  "identityProviders": [
    {
      "alias": "google",
      "displayName": "Google",
      "providerId": "google",
      "enabled": true,
      "updateProfileFirstLoginMode": "on",
      "trustEmail": true,
      "storeToken": false,
      "addReadTokenRoleOnCreate": false,
      "authenticateByDefault": false,
      "linkOnly": false,
      "firstBrokerLoginFlowAlias": "auto-link first broker login",
      "config": {
        "clientId": "${env.GOOGLE_CLIENT_ID}",
        "clientSecret": "${env.GOOGLE_CLIENT_SECRET}",
        "syncMode": "IMPORT",
        "useJwksUrl": "true",
        "defaultScope": "openid profile email"
      }
    }
  ]
}
```

Key flag explanation:

| Field | Value | Why |
|---|---|---|
| `trustEmail` | `true` | Google đã verify email rồi — bỏ qua Keycloak email verification step |
| `syncMode` | `IMPORT` | Chỉ sync name/picture/email lần đầu, sau đó user có thể edit local |
| `linkOnly` | `false` | Cho phép tạo user mới (không chỉ link với existing) |
| `firstBrokerLoginFlowAlias` | custom flow name | Skip "Review Profile" step |

### 3. Custom flow "auto-link first broker login"

Copy built-in flow `first broker login`, modify steps:

| Step | Built-in | Custom |
|---|---|---|
| Review Profile | REQUIRED | **DISABLED** (skip — yêu cầu UX nhanh) |
| Create User If Unique | ALTERNATIVE | ALTERNATIVE |
| Handle Existing Account → Confirm link existing account | REQUIRED | **DISABLED** |
| Handle Existing Account → Verify existing account by Email | ALTERNATIVE | **DISABLED** (Google đã verify) |
| Handle Existing Account → Automatically Set Existing User | DISABLED | **ALTERNATIVE** (auto-link nếu email match) |

Effect: nếu email Google match existing Keycloak user → auto-link, no prompt. Nếu chưa có → tạo user mới ngay, no Review Profile form.

### 4. CRM gating (theme conditional)

Update `keycloak/themes/shofy-theme/login/login.ftl`:

```ftl
<#if realm.password && social.providers??>
  <#-- Hide Google button on CRM login -->
  <#if client.clientId?? && client.clientId != 'shofy-crm'>
    <div id="kc-social-providers" class="kc-social-providers">
      <hr/>
      <h4>${msg("identity-provider-login-label")}</h4>
      <ul class="kc-social-links">
        <#list social.providers as p>
          <li>
            <a id="social-${p.alias}"
               class="kc-social-link kc-social-${p.alias}"
               href="${p.loginUrl}">
              <span class="kc-social-icon kc-social-icon-${p.alias}"></span>
              <span>${msg("identity-provider-login-with", p.displayName!p.alias)}</span>
            </a>
          </li>
        </#list>
      </ul>
    </div>
  </#if>
</#if>
```

Add messages to `keycloak/themes/shofy-theme/login/messages/messages_en.properties` + `messages_vi.properties`:

```
identity-provider-login-label=Or sign in with
identity-provider-login-with=Continue with {0}
```

```
identity-provider-login-label=Hoặc đăng nhập với
identity-provider-login-with=Tiếp tục với {0}
```

Add Google logo CSS in `keycloak/themes/shofy-theme/login/resources/css/login.css`:

```css
.kc-social-icon-google {
  background-image: url('../img/google-logo.svg');
  width: 20px;
  height: 20px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
  margin-right: 8px;
}
.kc-social-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  text-decoration: none;
  color: #3c4043;
  font-weight: 500;
  width: 100%;
  justify-content: center;
}
.kc-social-link:hover { background-color: #f8f9fa; }
```

Place `google-logo.svg` at `keycloak/themes/shofy-theme/login/resources/img/google-logo.svg`.

### 5. Storefront UI button

Add to login form (file likely at `frontend/src/components/login-register/login-form.jsx` — verify in implementation):

```jsx
import { useKeycloak } from '@react-keycloak/web';
// or whatever wrapper is used in this codebase

const { keycloak } = useKeycloak();

<button
  type="button"
  className="tp-btn-google w-100 mb-3"
  onClick={() => keycloak.login({ idpHint: 'google' })}
>
  <GoogleIcon /> {t('auth.continueWithGoogle')}
</button>
```

Style as Google-recommended button (white bg + Google logo + #3c4043 text).

i18n keys (add to `frontend/src/locales/{en,vi}/common.json`):

```json
{
  "auth": {
    "continueWithGoogle": "Continue with Google",  // EN
    "orContinueWith": "Or continue with"
  }
}
```

```json
{
  "auth": {
    "continueWithGoogle": "Tiếp tục với Google",   // VI
    "orContinueWith": "Hoặc tiếp tục với"
  }
}
```

Same button cũng đặt ở register page (`register-form.jsx`) — Google login flow tự xử cả register lẫn login.

### 6. Idempotent kcadm.sh deploy script

New file: `keycloak/scripts/configure-google-idp.sh`

```bash
#!/usr/bin/env bash
# Idempotent: an toàn chạy nhiều lần. Tạo Google IdP + custom flow nếu chưa có,
# cập nhật config nếu đã có.
set -euo pipefail

REALM="${REALM:-shofy}"
KC_URL="${KC_URL:-http://localhost:8080}"
ADMIN_USER="${KC_ADMIN:?KC_ADMIN required}"
ADMIN_PASS="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD required}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID required}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET required}"

KCADM="/opt/keycloak/bin/kcadm.sh"

# Authenticate
$KCADM config credentials --server "$KC_URL" --realm master \
  --user "$ADMIN_USER" --password "$ADMIN_PASS"

# 1. Create or update custom first-broker-login flow
FLOW_ALIAS="auto-link first broker login"
EXISTING_FLOW=$($KCADM get authentication/flows -r "$REALM" --fields alias --format csv --noquotes \
  | grep -F "$FLOW_ALIAS" || true)

if [[ -z "$EXISTING_FLOW" ]]; then
  # Copy built-in flow
  $KCADM create "authentication/flows/first broker login/copy" -r "$REALM" \
    -s "newName=$FLOW_ALIAS"
  # Disable Review Profile execution
  # (more detailed step config in implementation plan)
fi

# 2. Create or update Google IdP
IDP_ALIAS="google"
EXISTING_IDP=$($KCADM get "identity-provider/instances/$IDP_ALIAS" -r "$REALM" 2>/dev/null || true)

IDP_PAYLOAD=$(cat <<EOF
{
  "alias": "$IDP_ALIAS",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "firstBrokerLoginFlowAlias": "$FLOW_ALIAS",
  "config": {
    "clientId": "$GOOGLE_CLIENT_ID",
    "clientSecret": "$GOOGLE_CLIENT_SECRET",
    "syncMode": "IMPORT",
    "useJwksUrl": "true",
    "defaultScope": "openid profile email"
  }
}
EOF
)

if [[ -z "$EXISTING_IDP" ]]; then
  echo "$IDP_PAYLOAD" | $KCADM create identity-provider/instances -r "$REALM" -f -
else
  echo "$IDP_PAYLOAD" | $KCADM update "identity-provider/instances/$IDP_ALIAS" -r "$REALM" -f -
fi

echo "Done: Google IdP configured on realm $REALM"
```

Run via `docker exec`:

```bash
docker exec -i shofy-keycloak \
  -e GOOGLE_CLIENT_ID="..." \
  -e GOOGLE_CLIENT_SECRET="..." \
  -e KC_ADMIN="admin" \
  -e KC_ADMIN_PASSWORD="..." \
  bash /opt/keycloak/scripts/configure-google-idp.sh
```

Mount script via `docker-compose.prod.yml` keycloak volume:
```yaml
volumes:
  - ./keycloak/scripts:/opt/keycloak/scripts:ro
```

## Data flow — user account states

### State A: New user, never registered

1. Click "Continue with Google" → consent on Google → callback to Keycloak.
2. Keycloak: no existing user with this email → flow creates Keycloak user (email, firstName, lastName, email_verified=true).
3. Keycloak issues JWT, redirects to storefront.
4. Storefront calls backend with JWT.
5. `verifyToken.js` finds no User with `keycloakId=payload.sub` → creates MongoDB User (existing logic at backend/middleware/verifyToken.js).

### State B: Existing email/password user, first time clicking Google

1. Click "Continue with Google" → callback to Keycloak.
2. Keycloak detects existing user with same email.
3. `trustEmail=true` + custom flow's "Automatically Set Existing User" → links Google identity to existing Keycloak user, no password prompt.
4. JWT issued (with `sub` = existing Keycloak user ID).
5. Backend `verifyToken.js` finds MongoDB User by `keycloakId` → updates `name`/`image` from new claims.

### State C: Returning Google user

1. Click "Continue with Google" → Google session active → instant redirect.
2. Keycloak finds linked Google identity → issues JWT for existing user.
3. Backend `verifyToken.js` finds MongoDB User → returns auth context.

### State D (edge case): Email mismatch / Google email not verified

- `trustEmail=true` only auto-links if Google says `email_verified=true`. Google practically always returns true for personal Gmail. If false (rare, e.g., Workspace alias), Keycloak falls back to "Verify existing account by Email" — but we disabled that step. Result: flow fails with error. Acceptable for rare edge; user can sign in via email/password instead.

## Testing plan

Manual tests (no automated E2E for this — pure auth flow):

1. **New user signup via Google**:
   - Use brand new Gmail not in Keycloak.
   - Click Continue with Google → consent → land on storefront, logged in.
   - Verify Keycloak Admin Console → Users → see new user with `Identity Provider Links: google`.
   - Verify MongoDB `users` collection → new User document with `keycloakId` matching Keycloak user `id`.

2. **Existing user links Google**:
   - User A registered with email/password before.
   - User A clicks Continue with Google with same email → no password prompt → logged in.
   - Verify Keycloak User A now shows `Identity Provider Links: google`.
   - Verify MongoDB User A: `keycloakId` unchanged, `image` updated if Google has profile picture.

3. **Returning Google user**:
   - Logout → click Continue with Google → instant login (no consent needed second time).

4. **CRM gating**:
   - Navigate to `/admin/login` → verify NO Google button visible.
   - Navigate to `/admin/login?kc_idp_hint=google` directly → button hidden in UI but URL trick might work depending on flow override. Accept this trade-off per yêu cầu.

5. **Logout**:
   - Logout from storefront → Keycloak session ended → Google session NOT killed (intentional, single-sign-out optional).

6. **Token refresh**:
   - Wait for access token expiry (default 5 min) → keycloak-js auto-refreshes via refresh token → no re-prompt.

## Error handling

| Failure | User-facing message | Where surfaced |
|---|---|---|
| Google OAuth declined | Generic Keycloak error page | Keycloak (theme-styled) |
| Google API down | "Login failed. Try again." | Keycloak |
| Email mismatch + flow can't auto-link | "Could not link your account" | Keycloak (rare, see State D) |
| Backend `verifyToken` rejects token | 401 → storefront re-redirects to login | Frontend interceptor |
| Network failure during code exchange | keycloak-js error → frontend shows toast | Frontend |

## Migration / rollback

- **Rollback Google IdP**: delete via Admin Console or `kcadm.sh delete identity-provider/instances/google`. Linked users retain Keycloak account, lose ability to login via Google but can use password reset.
- **Migration**: nothing to migrate. Existing users continue to use email/password; if they choose to use Google later, auto-link happens transparently.

## Security considerations

- `clientSecret` stored as env var, NOT committed. GitHub Actions secret + VPS `.env` file with `chmod 600`.
- `redirect_uri` whitelist in Google Cloud Console = production URL only. Dev local testing requires separate OAuth client with `http://localhost:8180/...` redirect.
- `trustEmail=true` is safe ONLY because Google strictly enforces email verification. Do NOT set `trustEmail=true` for providers like GitHub which allow unverified emails.
- Custom flow disables "Verify existing account by Email" step — acceptable here because `trustEmail` already gates email trust. Don't reuse this flow for less-strict providers without re-enabling.
- Rate limiting at Keycloak realm level (brute force protection) already applies to broker callbacks.

## Implementation order

1. Google Cloud OAuth Client (manual, get credentials)
2. Add SVG logo + CSS to theme
3. Update `realm-export.json` (for documentation, not auto-applied)
4. Write `configure-google-idp.sh` kcadm script
5. Mount script in `docker-compose.prod.yml`
6. Update `login.ftl` with conditional + i18n keys + messages_{en,vi}.properties
7. Add i18n keys to `frontend/src/locales/{en,vi}/common.json`
8. Add storefront button to `login-form.jsx` + `register-form.jsx`
9. Push branch → CI builds images → deploy.yml pushes to VPS
10. SSH to VPS, run `kcadm` script with secrets
11. Restart `shofy-keycloak` container (to load updated theme)
12. Manual smoke test per Testing plan

## Open questions

None — all design decisions confirmed:
- Approach: Keycloak Identity Providers
- Providers: Google only (Facebook deferred)
- Email collision: auto-link if Google email_verified
- Login UI scope: storefront only (CRM gated via theme conditional)
- First login: auto-create (no review profile)
- Deployment: idempotent kcadm.sh script
