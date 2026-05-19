# Google Social Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép khách hàng đăng nhập storefront Shofy bằng tài khoản Google qua Keycloak Identity Provider, đồng thời ẩn nút Google khỏi CRM login page.

**Architecture:** Add Google as Identity Provider trong Keycloak realm `shofy`. Storefront `/login` page có thể tùy chọn thêm "Continue with Google" button gọi `keycloak.login({idpHint:'google'})` để skip Keycloak hosted login. Theme Keycloak render Google button có conditional ẩn cho client `shofy-crm`. Deploy idempotent qua `kcadm.sh` script chạy trong container Keycloak.

**Tech Stack:** Keycloak 26.4.4, FreeMarker theme, kcadm.sh, Next.js 13 (keycloak-js), Docker Compose, bash.

---

## Discovery context

- Storefront `/login` page (`frontend/src/pages/login.jsx`) hiện auto-redirect tới Keycloak hosted login — không render form local. Nên Google button **chủ yếu** hiển thị qua theme. Plan này thêm tùy chọn nút trên storefront để skip Keycloak login form (call `keycloak.login({idpHint:'google'})` trực tiếp).
- Keycloak client: `keycloak-js` v25+ (kiểm tra `frontend/src/lib/keycloak.js`), wrap qua context `useKeycloak()` từ `keycloak-provider.jsx`.
- Backend `verifyToken.js` đã auto-create MongoDB User từ Keycloak JWT — **không cần thay đổi backend**.
- Custom theme tại `keycloak/themes/shofy-theme/login/` đã có `login.ftl`, `messages/`, `resources/`.

## File structure

| Path | Purpose | Action |
|---|---|---|
| `keycloak/themes/shofy-theme/login/resources/img/google-logo.svg` | Google G logo SVG | Create |
| `keycloak/themes/shofy-theme/login/resources/css/login.css` | Add social button styles | Modify (append) |
| `keycloak/themes/shofy-theme/login/messages/messages_en.properties` | EN i18n for social section | Modify (append) |
| `keycloak/themes/shofy-theme/login/messages/messages_vi.properties` | VI i18n for social section | Modify (append) |
| `keycloak/themes/shofy-theme/login/login.ftl` | Render social providers with CRM gating | Modify |
| `keycloak/scripts/configure-google-idp.sh` | Idempotent kcadm deploy script | Create |
| `keycloak/realm-export.json` | Document IdP config | Modify |
| `docker-compose.prod.yml` | Mount scripts dir into keycloak container | Modify |
| `frontend/src/locales/en/common.json` | EN i18n keys for storefront button | Modify |
| `frontend/src/locales/vi/common.json` | VI i18n keys for storefront button | Modify |
| `frontend/src/pages/login.jsx` | Show login choice UI (email/password vs Google) | Modify |
| `docs/google-oauth-setup.md` | Step-by-step Google Cloud Console setup for ops | Create |

---

## Task 1: Manual prerequisite — Google Cloud OAuth Client

**Files:**
- Create: `docs/google-oauth-setup.md` (instructions for ops)

This task is largely outside the codebase but must complete before testing. Engineer + Ops do this together.

- [ ] **Step 1: Write Google Cloud Console setup doc**

Create `docs/google-oauth-setup.md`:

````markdown
# Google OAuth Client Setup for Shofy Keycloak

## Prerequisites
- Google account with billing-enabled project (free tier OK)
- Owner/Editor role on the project

## Steps

### 1. Create or select GCP project
1. Open https://console.cloud.google.com/
2. Project selector (top bar) → "New Project" → name: `shofy-prod` → Create

### 2. Configure OAuth consent screen
1. Left nav → APIs & Services → OAuth consent screen
2. User Type: **External** → Create
3. Fill app info:
   - App name: `Shofy`
   - User support email: `your-email@example.com`
   - App logo: upload Shofy logo (120x120 PNG)
   - Application home page: `https://tychicus.id.vn`
   - Privacy policy: `https://tychicus.id.vn/privacy`
   - Terms of service: `https://tychicus.id.vn/terms`
   - Authorized domains: `tychicus.id.vn`
   - Developer contact email: `your-email@example.com`
4. Scopes → Add: `openid`, `email`, `profile`
5. Test users (if app in Testing): add your test Gmail account
6. Save and continue → back to Dashboard

### 3. Create OAuth Client ID
1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Name: `shofy-keycloak-broker`
4. Authorized JavaScript origins:
   - `https://tychicus.id.vn`
5. Authorized redirect URIs:
   - `https://tychicus.id.vn/auth/realms/shofy/broker/google/endpoint`
6. Create → copy **Client ID** and **Client Secret**

### 4. Store secrets
- Store `Client ID` and `Client Secret` in:
  - GitHub Actions repo secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - VPS `.env` file (project root): same keys, `chmod 600 .env`

### 5. Publish app (when ready for prod)
- OAuth consent screen → Publishing status → **Publish App**
- Initial Google verification only required if requesting sensitive scopes; `openid email profile` is non-sensitive, no verification needed.
````

- [ ] **Step 2: Commit**

```bash
git add docs/google-oauth-setup.md
git commit -m "docs: add Google OAuth client setup guide for ops"
```

---

## Task 2: Add Google logo SVG asset to theme

**Files:**
- Create: `keycloak/themes/shofy-theme/login/resources/img/google-logo.svg`

- [ ] **Step 1: Create the SVG file**

Use the official Google G logo (single-color version is allowed per Google branding):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add keycloak/themes/shofy-theme/login/resources/img/google-logo.svg
git commit -m "feat(keycloak-theme): add Google G logo SVG"
```

---

## Task 3: Add CSS styles for social provider buttons

**Files:**
- Modify: `keycloak/themes/shofy-theme/login/resources/css/login.css`

- [ ] **Step 1: Read existing login.css to find a safe append location**

Run: `cat keycloak/themes/shofy-theme/login/resources/css/login.css | tail -20`

Expected: see end of file. Append after the last rule.

- [ ] **Step 2: Append social provider styles**

Append to `keycloak/themes/shofy-theme/login/resources/css/login.css`:

```css

/* ---- Social providers (Google, etc.) ---- */
.kc-social-providers {
  margin-top: 24px;
}
.kc-social-providers hr {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 0 0 16px 0;
}
.kc-social-providers h4 {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin: 0 0 16px 0;
  text-transform: none;
}
.kc-social-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kc-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: #fff;
  text-decoration: none;
  color: #3c4043;
  font-weight: 500;
  font-size: 14px;
  width: 100%;
  transition: background-color 0.15s ease;
}
.kc-social-link:hover {
  background-color: #f8f9fa;
  text-decoration: none;
  color: #3c4043;
}
.kc-social-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  vertical-align: middle;
}
.kc-social-icon-google {
  background-image: url('../img/google-logo.svg');
}
```

- [ ] **Step 3: Commit**

```bash
git add keycloak/themes/shofy-theme/login/resources/css/login.css
git commit -m "feat(keycloak-theme): add social provider button styles"
```

---

## Task 4: Add EN i18n messages for social section

**Files:**
- Modify: `keycloak/themes/shofy-theme/login/messages/messages_en.properties`

- [ ] **Step 1: Append messages**

Append to `keycloak/themes/shofy-theme/login/messages/messages_en.properties`:

```properties

# Social identity providers
identity-provider-login-label=Or sign in with
identity-provider-login-with=Continue with {0}
```

- [ ] **Step 2: Commit (combined with VI in next task)**

(skip commit here; combine with Task 5)

---

## Task 5: Add VI i18n messages for social section

**Files:**
- Modify: `keycloak/themes/shofy-theme/login/messages/messages_vi.properties`

- [ ] **Step 1: Append messages**

Append to `keycloak/themes/shofy-theme/login/messages/messages_vi.properties`:

```properties

# Social identity providers
identity-provider-login-label=Hoặc đăng nhập với
identity-provider-login-with=Tiếp tục với {0}
```

- [ ] **Step 2: Commit (EN + VI together)**

```bash
git add keycloak/themes/shofy-theme/login/messages/messages_en.properties \
        keycloak/themes/shofy-theme/login/messages/messages_vi.properties
git commit -m "feat(keycloak-theme): add EN/VI i18n for social login"
```

---

## Task 6: Update login.ftl to render social providers with CRM gating

**Files:**
- Modify: `keycloak/themes/shofy-theme/login/login.ftl`

- [ ] **Step 1: Read existing login.ftl structure**

Run: `grep -n "social\|kcSocialProviders" keycloak/themes/shofy-theme/login/login.ftl`

Expected: shows existing social provider rendering block (Keycloak default theme uses this pattern). Note the line number.

- [ ] **Step 2: Replace or wrap the social providers block**

Find the existing social providers block (often inside `<#if realm.password && social.providers??>` or similar). Replace it with the CRM-gated version:

```ftl
<#if realm.password && social.providers??>
  <#-- Hide social providers on CRM login page -->
  <#if !(client?? && client.clientId?? && client.clientId == 'shofy-crm')>
    <div id="kc-social-providers" class="kc-social-providers">
      <hr/>
      <h4>${msg("identity-provider-login-label")}</h4>
      <ul class="kc-social-links">
        <#list social.providers as p>
          <li>
            <a id="social-${p.alias}"
               class="kc-social-link kc-social-${p.alias}"
               href="${p.loginUrl}"
               aria-label="${msg('identity-provider-login-with', p.displayName!p.alias)}">
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

If no existing social block, insert this snippet inside the `<#section>` block immediately after the password form `</form>` closing tag.

- [ ] **Step 3: Commit**

```bash
git add keycloak/themes/shofy-theme/login/login.ftl
git commit -m "feat(keycloak-theme): render social providers with CRM client gating"
```

---

## Task 7: Create idempotent kcadm.sh deploy script

**Files:**
- Create: `keycloak/scripts/configure-google-idp.sh`

- [ ] **Step 1: Write the script**

Create `keycloak/scripts/configure-google-idp.sh`:

```bash
#!/usr/bin/env bash
# Idempotent: safe to run multiple times.
# Configures Google Identity Provider + custom first-broker-login flow on the
# Shofy Keycloak realm.
#
# Required env vars:
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   - From Google Cloud Console
#   KC_ADMIN, KC_ADMIN_PASSWORD              - Keycloak master admin credentials
# Optional env vars:
#   REALM   (default: shofy)
#   KC_URL  (default: http://localhost:8080)

set -euo pipefail

REALM="${REALM:-shofy}"
KC_URL="${KC_URL:-http://localhost:8080}"
ADMIN_USER="${KC_ADMIN:?KC_ADMIN env var required}"
ADMIN_PASS="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD env var required}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID env var required}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET env var required}"

KCADM="/opt/keycloak/bin/kcadm.sh"
FLOW_ALIAS="auto-link first broker login"
IDP_ALIAS="google"

echo "==> Authenticating with Keycloak at $KC_URL"
$KCADM config credentials \
  --server "$KC_URL" \
  --realm master \
  --user "$ADMIN_USER" \
  --password "$ADMIN_PASS"

# ----------------------------------------------------------------------------
# 1. Create custom first-broker-login flow (idempotent)
# ----------------------------------------------------------------------------
echo "==> Checking for existing flow: $FLOW_ALIAS"
FLOW_ID=$($KCADM get authentication/flows -r "$REALM" --format csv --fields id,alias --noquotes 2>/dev/null \
  | awk -F',' -v alias="$FLOW_ALIAS" '$2 == alias { print $1 }' | head -1 || true)

if [[ -z "$FLOW_ID" ]]; then
  echo "==> Copying built-in 'first broker login' flow to '$FLOW_ALIAS'"
  $KCADM create "authentication/flows/first broker login/copy" \
    -r "$REALM" \
    -s "newName=$FLOW_ALIAS"

  # Disable "Review Profile" step
  echo "==> Disabling 'Review Profile' step in $FLOW_ALIAS"
  REVIEW_PROFILE_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes \
    | awk -F',' '$2 == "idp-review-profile" { print $1 }' | head -1)
  if [[ -n "$REVIEW_PROFILE_ID" ]]; then
    $KCADM update "authentication/executions/$REVIEW_PROFILE_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  fi

  # Set "Automatically Set Existing User" to ALTERNATIVE in "Handle Existing Account"
  echo "==> Setting 'Automatically Set Existing User' to ALTERNATIVE"
  AUTO_SET_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes \
    | awk -F',' '$2 == "idp-auto-link" { print $1 }' | head -1)
  if [[ -n "$AUTO_SET_ID" ]]; then
    $KCADM update "authentication/executions/$AUTO_SET_ID" -r "$REALM" \
      -s 'requirement=ALTERNATIVE'
  fi

  # Disable "Verify existing account by Email" (Google already verified)
  VERIFY_EMAIL_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes \
    | awk -F',' '$2 == "idp-email-verification" { print $1 }' | head -1)
  if [[ -n "$VERIFY_EMAIL_ID" ]]; then
    $KCADM update "authentication/executions/$VERIFY_EMAIL_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  fi

  # Disable "Confirm link existing account" prompt
  CONFIRM_LINK_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes \
    | awk -F',' '$2 == "idp-confirm-link" { print $1 }' | head -1)
  if [[ -n "$CONFIRM_LINK_ID" ]]; then
    $KCADM update "authentication/executions/$CONFIRM_LINK_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  fi
else
  echo "==> Flow '$FLOW_ALIAS' already exists, skipping creation"
fi

# ----------------------------------------------------------------------------
# 2. Create or update Google Identity Provider
# ----------------------------------------------------------------------------
echo "==> Checking for existing IdP: $IDP_ALIAS"
EXISTING_IDP=$($KCADM get "identity-provider/instances/$IDP_ALIAS" -r "$REALM" 2>/dev/null || echo "")

IDP_PAYLOAD=$(cat <<EOF
{
  "alias": "$IDP_ALIAS",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "updateProfileFirstLoginMode": "on",
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
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

TMPFILE=$(mktemp)
echo "$IDP_PAYLOAD" > "$TMPFILE"

if [[ -z "$EXISTING_IDP" ]]; then
  echo "==> Creating Google IdP"
  $KCADM create identity-provider/instances -r "$REALM" -f "$TMPFILE"
else
  echo "==> Updating existing Google IdP"
  $KCADM update "identity-provider/instances/$IDP_ALIAS" -r "$REALM" -f "$TMPFILE"
fi
rm -f "$TMPFILE"

echo ""
echo "Google IdP configured successfully on realm '$REALM'"
echo "Test login: https://tychicus.id.vn/auth/realms/$REALM/account/"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x keycloak/scripts/configure-google-idp.sh
```

- [ ] **Step 3: Commit**

```bash
git add keycloak/scripts/configure-google-idp.sh
git commit -m "feat(keycloak): add idempotent kcadm script for Google IdP setup"
```

---

## Task 8: Mount scripts dir in docker-compose.prod.yml

**Files:**
- Modify: `docker-compose.prod.yml`

- [ ] **Step 1: Read existing keycloak service block**

Run: `grep -n "keycloak\|volumes:" docker-compose.prod.yml | head -30`

Expected: locate `shofy-keycloak` service and its `volumes:` array.

- [ ] **Step 2: Add scripts volume mount**

In the `shofy-keycloak` service `volumes:` section, add:

```yaml
      - ./keycloak/scripts:/opt/keycloak/scripts:ro
```

The full volumes section should end up like (verify alongside existing entries — do not duplicate):

```yaml
    volumes:
      - ./keycloak/themes/shofy-theme:/opt/keycloak/themes/shofy-theme:ro
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json:ro
      - ./keycloak/scripts:/opt/keycloak/scripts:ro
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat(docker): mount keycloak scripts volume for kcadm helpers"
```

---

## Task 9: Update realm-export.json (documentation)

**Files:**
- Modify: `keycloak/realm-export.json`

- [ ] **Step 1: Read current identityProviders entry**

Run: `grep -n "identityProviders\|identityProviderMappers" keycloak/realm-export.json`

Expected: `"identityProviders": [],` and `"identityProviderMappers": [],` at known lines.

- [ ] **Step 2: Replace empty array with Google IdP entry**

Replace `"identityProviders": [],` with:

```json
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
        "clientId": "PLACEHOLDER_SET_VIA_KCADM",
        "clientSecret": "PLACEHOLDER_SET_VIA_KCADM",
        "syncMode": "IMPORT",
        "useJwksUrl": "true",
        "defaultScope": "openid profile email"
      }
    }
  ],
```

Add a comment at top of the IdP block in commit message that these placeholders are populated by `keycloak/scripts/configure-google-idp.sh` at deploy time.

- [ ] **Step 3: Verify JSON is still valid**

Run: `python3 -m json.tool keycloak/realm-export.json > /dev/null && echo "OK"`

Expected: `OK` (no parse errors).

- [ ] **Step 4: Commit**

```bash
git add keycloak/realm-export.json
git commit -m "docs(keycloak): document Google IdP in realm-export (kcadm sets secrets)"
```

---

## Task 10: Add storefront i18n keys (EN)

**Files:**
- Modify: `frontend/src/locales/en/common.json`

- [ ] **Step 1: Read current `auth` namespace**

Run: `grep -A2 -B2 '"auth"' frontend/src/locales/en/common.json | head -40`

Expected: see the `auth: {...}` block. Note where to insert new keys.

- [ ] **Step 2: Add keys to `auth` namespace**

Inside the `auth: { ... }` block of `frontend/src/locales/en/common.json`, add:

```json
    "continueWithGoogle": "Continue with Google",
    "orContinueWith": "Or continue with",
    "signInWithEmail": "Sign in with email"
```

(Place these alongside existing auth keys — preserve trailing commas as needed.)

- [ ] **Step 3: Verify JSON is valid**

Run: `python3 -m json.tool frontend/src/locales/en/common.json > /dev/null && echo "OK"`

Expected: `OK`.

- [ ] **Step 4: Commit (combined with VI in next task)**

(skip commit here; combine with Task 11)

---

## Task 11: Add storefront i18n keys (VI)

**Files:**
- Modify: `frontend/src/locales/vi/common.json`

- [ ] **Step 1: Add keys to `auth` namespace**

Inside the `auth: { ... }` block of `frontend/src/locales/vi/common.json`, add:

```json
    "continueWithGoogle": "Tiếp tục với Google",
    "orContinueWith": "Hoặc tiếp tục với",
    "signInWithEmail": "Đăng nhập bằng email"
```

- [ ] **Step 2: Verify JSON is valid**

Run: `python3 -m json.tool frontend/src/locales/vi/common.json > /dev/null && echo "OK"`

Expected: `OK`.

- [ ] **Step 3: Commit (EN + VI together)**

```bash
git add frontend/src/locales/en/common.json frontend/src/locales/vi/common.json
git commit -m "feat(i18n): add EN/VI keys for Google social login button"
```

---

## Task 12: Update storefront login page to show choice UI

**Files:**
- Modify: `frontend/src/pages/login.jsx`

Current behavior: auto-redirects to Keycloak hosted login. New behavior: if not authenticated, show a small panel with two buttons — "Continue with Google" (calls `keycloak.login({idpHint:'google'})`) and "Sign in with email" (existing default `keycloak.login()`). If already authenticated, redirect.

- [ ] **Step 1: Replace login.jsx body**

Replace the contents of `frontend/src/pages/login.jsx` with:

```jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useKeycloak } from "@/components/providers/keycloak-provider";
import keycloak from "@/lib/keycloak";
import Loader from "@/components/loader/loader";

const LoginPage = () => {
  const router = useRouter();
  const kc = useKeycloak();
  const { t } = useTranslation("common");
  const [redirecting, setRedirecting] = useState(false);

  // Validate redirect param to prevent open redirect attacks
  const rawRedirect = router.query.redirect;
  const safeRedirect =
    typeof rawRedirect === "string" &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.includes("://")
      ? rawRedirect
      : "/";

  useEffect(() => {
    if (!kc?.initialized) return;
    if (keycloak.authenticated) {
      router.push(safeRedirect);
    }
  }, [kc?.initialized, router, safeRedirect]);

  const loginWithGoogle = () => {
    setRedirecting(true);
    keycloak.login({
      idpHint: "google",
      redirectUri: window.location.origin + safeRedirect,
    });
  };

  const loginWithEmail = () => {
    setRedirecting(true);
    keycloak.login({
      redirectUri: window.location.origin + safeRedirect,
    });
  };

  if (!kc?.initialized || redirecting) {
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
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", padding: "16px" }}
    >
      <div
        className="card shadow-sm"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="card-body p-4">
          <h3 className="text-center mb-4">{t("auth.signIn", "Sign in")}</h3>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="btn w-100 mb-3 d-flex align-items-center justify-content-center"
            style={{
              border: "1px solid #dadce0",
              background: "#fff",
              color: "#3c4043",
              fontWeight: 500,
              padding: "10px 16px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              style={{ marginRight: "12px" }}
              aria-hidden="true"
            >
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {t("auth.continueWithGoogle")}
          </button>

          <div className="text-center my-3 text-muted" style={{ fontSize: "13px" }}>
            {t("auth.orContinueWith")}
          </div>

          <button
            type="button"
            onClick={loginWithEmail}
            className="btn btn-outline-primary w-100"
            style={{ padding: "10px 16px", fontWeight: 500 }}
          >
            {t("auth.signInWithEmail")}
          </button>
        </div>
      </div>
    </div>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default LoginPage;
```

- [ ] **Step 2: Verify build doesn't break**

Run:
```bash
cd frontend && npm run lint -- --file src/pages/login.jsx 2>&1 | head -30
```

Expected: no errors related to login.jsx (existing project warnings OK). If `--file` flag not supported, just run `npm run lint`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/login.jsx
git commit -m "feat(frontend): add Continue with Google button to login page"
```

---

## Task 13: Local smoke test plan documentation

**Files:**
- Create: `docs/google-oauth-test-plan.md`

This task documents the manual test plan. It's a checklist, not executable code, but engineer must walk through it post-deploy.

- [ ] **Step 1: Write test plan doc**

Create `docs/google-oauth-test-plan.md`:

````markdown
# Google Social Login — Manual Test Plan

Run these tests after deploy to verify the integration works end-to-end.

## Prerequisites
- Google OAuth client created per `docs/google-oauth-setup.md`
- `kcadm.sh` script ran successfully on VPS (see Deploy section)
- Keycloak container restarted (to load updated theme)

## Test 1: New user registers via Google
1. Use a Gmail account NOT yet in Keycloak (check Admin Console → Users to confirm).
2. Open https://tychicus.id.vn/login
3. Click "Continue with Google"
4. Google consent screen → Allow
5. **Expected:** Redirect back to https://tychicus.id.vn/ as logged-in user
6. Verify in Keycloak Admin Console → Users → search by email → confirm:
   - User exists
   - Email is `verified`
   - Identity Provider Links shows `google`
7. Verify MongoDB:
   - Run on VPS: `docker exec shofy-mongodb mongosh shofy --eval 'db.users.findOne({email: "TEST_EMAIL"})'`
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
3. **Expected:** NO "Continue with Google" button on this login page.
4. URL trick check: navigate to `https://tychicus.id.vn/auth/realms/shofy/protocol/openid-connect/auth?client_id=shofy-crm&kc_idp_hint=google&...` directly.
5. **Expected:** Flow still proceeds (theme-only gating, not flow-override). Acceptable per design — admin Keycloak users need admin role anyway.

## Test 5: Sign in with email/password still works
1. From storefront login page, click "Sign in with email".
2. **Expected:** Redirect to Keycloak hosted login form with username/password.
3. Login normally — works as before.

## Test 6: Logout
1. After Google login, click logout in storefront.
2. **Expected:** Keycloak session ended. Re-visit https://tychicus.id.vn/login → not authenticated.
3. Google session NOT killed (intentional). Clicking "Continue with Google" again is instant.

## Test 7: Token refresh
1. After Google login, leave browser open for >5 minutes (default access token expiry).
2. Trigger an authenticated API call (e.g., visit `/profile`).
3. **Expected:** keycloak-js auto-refreshes via refresh token. No re-prompt. Console shows refresh log if Keycloak debug enabled.

## Failure modes to watch
- "Invalid redirect URI" → Google Cloud Console redirect URI list doesn't include the exact Keycloak broker endpoint
- "Could not link your account" → custom flow misconfigured, `Automatically Set Existing User` step not ALTERNATIVE
- CSS not loading → Keycloak container not restarted after theme changes
- Google button missing on storefront login UI → i18n keys missing or rebuild not done
````

- [ ] **Step 2: Commit**

```bash
git add docs/google-oauth-test-plan.md
git commit -m "docs: add manual test plan for Google social login"
```

---

## Task 14: Deploy to VPS

**Files:** (no code changes — execution steps)

- [ ] **Step 1: Push branch and verify CI**

```bash
git push origin main
```

Expected: CI workflow runs, builds 3 Docker images, deploy.yml triggers and `git fetch && git reset --hard origin/main` on VPS.

Verify in GitHub Actions UI that CI + Deploy workflows pass.

- [ ] **Step 2: SSH into VPS, set Google secrets**

```bash
ssh user@tychicus.id.vn
cd /path/to/ecommerce_website-main
# Edit .env, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
nano .env
chmod 600 .env
```

Verify:
```bash
grep "GOOGLE_" .env | head -2
```

Expected: both vars present.

- [ ] **Step 3: Recreate Keycloak container with new volume mount**

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate shofy-keycloak
```

Wait ~30 sec for Keycloak to be healthy:
```bash
docker compose -f docker-compose.prod.yml logs --tail 30 shofy-keycloak | grep -i "started\|listening"
```

Expected: log line `Listening on: http://0.0.0.0:8080`.

- [ ] **Step 4: Run kcadm script inside Keycloak container**

```bash
docker exec -i \
  -e GOOGLE_CLIENT_ID="$(grep ^GOOGLE_CLIENT_ID .env | cut -d= -f2-)" \
  -e GOOGLE_CLIENT_SECRET="$(grep ^GOOGLE_CLIENT_SECRET .env | cut -d= -f2-)" \
  -e KC_ADMIN="$(grep ^KC_ADMIN .env | cut -d= -f2- || echo admin)" \
  -e KC_ADMIN_PASSWORD="$(grep ^KC_ADMIN_PASSWORD .env | cut -d= -f2-)" \
  shofy-keycloak \
  bash /opt/keycloak/scripts/configure-google-idp.sh
```

Expected output:
```
==> Authenticating with Keycloak at http://localhost:8080
==> Checking for existing flow: auto-link first broker login
==> Copying built-in 'first broker login' flow to 'auto-link first broker login'
==> Disabling 'Review Profile' step in auto-link first broker login
==> Setting 'Automatically Set Existing User' to ALTERNATIVE
==> Checking for existing IdP: google
==> Creating Google IdP

Google IdP configured successfully on realm 'shofy'
```

- [ ] **Step 5: Verify IdP in Keycloak Admin Console**

Open https://tychicus.id.vn/auth/admin/ → realm `shofy` → Identity Providers → Google should appear, enabled.

Click into it → verify:
- Display Name: Google
- Trust Email: ON
- First Login Flow: `auto-link first broker login`
- Sync Mode: Import
- Client ID populated

- [ ] **Step 6: Restart frontend to pick up i18n changes**

```bash
docker compose -f docker-compose.prod.yml pull frontend
docker compose -f docker-compose.prod.yml up -d --force-recreate shofy-frontend
```

Wait for the new container to be ready:
```bash
docker compose -f docker-compose.prod.yml logs --tail 20 shofy-frontend | grep -i "ready"
```

- [ ] **Step 7: Run manual test plan**

Follow `docs/google-oauth-test-plan.md` Tests 1-7.

- [ ] **Step 8: Final commit if any docs updated during testing**

(only if updates needed)

```bash
git add -A
git commit -m "docs: capture lessons from Google login deploy"
git push origin main
```

---

## Rollback

If something breaks in production:

1. **Disable Google IdP** (immediate, no code change):
   ```bash
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh update identity-provider/instances/google \
     -r shofy -s enabled=false
   ```

2. **Revert storefront login page** to auto-redirect (if UI is the issue):
   ```bash
   git revert <commit-hash-of-task-12> --no-edit
   git push origin main
   ```

3. **Remove Google IdP entirely** (clean state):
   ```bash
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh delete identity-provider/instances/google -r shofy
   ```

Already-linked users keep their Keycloak account; they lose ability to log in via Google but can use password reset to set a password.

---

## Self-review checklist (post-implementation)

Engineer should run through these after Task 14:

- [ ] Google logo renders on Keycloak login page at https://tychicus.id.vn/auth/realms/shofy/account/
- [ ] Google logo does NOT render on CRM login (when accessed via `shofy-crm` client)
- [ ] EN i18n shows "Continue with Google" on storefront `/login`
- [ ] VI i18n shows "Tiếp tục với Google" when locale=vi
- [ ] kcadm script re-run is idempotent (no errors on second run)
- [ ] MongoDB User created automatically on first Google login
- [ ] No regression on email/password login flow
- [ ] CRM login still works (admin can sign in)
