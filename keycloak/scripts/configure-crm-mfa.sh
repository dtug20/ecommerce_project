#!/usr/bin/env bash
# Idempotent: safe to run multiple times.
# Enforces mandatory TOTP (Google Authenticator / Authy / 1Password) on the
# shofy-crm client only. Storefront (shofy-frontend) and backend clients are
# untouched — they keep using the realm's default browser flow.
#
# How it works:
#   1. Clones the built-in `browser` flow into `browser-crm-mfa`.
#   2. In the clone, promotes the "Browser - Conditional 2FA" sub-flow from
#      CONDITIONAL to REQUIRED and disables the "user has OTP configured" check,
#      so the OTP step always runs.
#   3. Binds `browser-crm-mfa` as the browser-flow override for `shofy-crm`.
#   4. Enables the CONFIGURE_TOTP required action so first-time users are
#      prompted to scan the QR with their authenticator app.
#
# Required env vars:
#   KC_ADMIN, KC_ADMIN_PASSWORD   - Keycloak master admin credentials
# Optional env vars:
#   REALM        (default: shofy)
#   KC_URL       (default: http://localhost:8180  — matches KC_HTTP_PORT in compose)
#   CRM_CLIENT   (default: shofy-crm)

set -euo pipefail

REALM="${REALM:-shofy}"
KC_URL="${KC_URL:-http://localhost:8180}"
ADMIN_USER="${KC_ADMIN:?KC_ADMIN env var required}"
ADMIN_PASS="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD env var required}"
CRM_CLIENT="${CRM_CLIENT:-shofy-crm}"

KCADM="/opt/keycloak/bin/kcadm.sh"
FLOW_ALIAS="browser-crm-mfa"
BUILTIN_FLOW_ENC="browser"

# Helper: pick the id (column 1) of the CSV row whose later column equals $1.
# Avoids awk (not present in the Keycloak container image).
find_id_by_field() {
  local needle="$1"
  grep -F ",${needle}" | cut -d',' -f1 | head -1 || true
}

echo "==> Authenticating with Keycloak at $KC_URL"
$KCADM config credentials \
  --server "$KC_URL" \
  --realm master \
  --user "$ADMIN_USER" \
  --password "$ADMIN_PASS"

# ----------------------------------------------------------------------------
# 1. Create the CRM-only browser flow (idempotent clone of built-in browser)
# ----------------------------------------------------------------------------
echo "==> Checking for existing flow: $FLOW_ALIAS"
FLOW_ID=$($KCADM get authentication/flows -r "$REALM" --format csv --fields id,alias --noquotes 2>/dev/null \
  | find_id_by_field "$FLOW_ALIAS")

if [[ -z "$FLOW_ID" ]]; then
  echo "==> Copying built-in 'browser' flow to '$FLOW_ALIAS'"
  $KCADM create "authentication/flows/${BUILTIN_FLOW_ENC}/copy" \
    -r "$REALM" \
    -s "newName=$FLOW_ALIAS"
  FLOW_ID=$($KCADM get authentication/flows -r "$REALM" --format csv --fields id,alias --noquotes \
    | find_id_by_field "$FLOW_ALIAS")
else
  echo "==> Flow '$FLOW_ALIAS' already exists, reusing"
fi

if [[ -z "$FLOW_ID" ]]; then
  echo "ERROR: failed to resolve id for flow '$FLOW_ALIAS'"
  exit 1
fi

# ----------------------------------------------------------------------------
# 2. Force OTP in the cloned flow (self-healing on each run)
# ----------------------------------------------------------------------------

set_execution_requirement() {
  local match_field="$1"   # 'providerId' or 'displayName'
  local match_value="$2"
  local requirement="$3"
  local exec_id
  exec_id=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields "id,$match_field" --noquotes 2>/dev/null \
    | find_id_by_field "$match_value")
  if [[ -n "$exec_id" ]]; then
    echo "    -> $match_value = $requirement"
    $KCADM update "authentication/executions/$exec_id" -r "$REALM" \
      -s "requirement=$requirement"
  else
    echo "    -> $match_value execution not found, skipped"
  fi
}

echo "==> Configuring flow executions to enforce OTP"
# Promote the conditional 2FA sub-flow to always run.
set_execution_requirement "displayName" "Browser - Conditional 2FA" "REQUIRED"
# Disable the "is user OTP configured?" gate so OTP is no longer optional.
set_execution_requirement "providerId" "conditional-user-configured" "DISABLED"
# Belt-and-braces: ensure the OTP form itself stays REQUIRED.
set_execution_requirement "providerId" "auth-otp-form" "REQUIRED"

# ----------------------------------------------------------------------------
# 3. Bind the new flow only to the shofy-crm client
# ----------------------------------------------------------------------------
echo "==> Looking up client: $CRM_CLIENT"
CLIENT_ID=$($KCADM get clients -r "$REALM" -q "clientId=$CRM_CLIENT" \
  --format csv --fields id --noquotes 2>/dev/null | tail -1 | tr -d '\r')
if [[ -z "$CLIENT_ID" ]]; then
  echo "ERROR: client '$CRM_CLIENT' not found in realm '$REALM'"
  exit 1
fi

echo "==> Binding '$FLOW_ALIAS' as browser-flow override for $CRM_CLIENT"
$KCADM update "clients/$CLIENT_ID" -r "$REALM" \
  -s "authenticationFlowBindingOverrides.browser=$FLOW_ID"

# ----------------------------------------------------------------------------
# 4. Enable the CONFIGURE_TOTP required action (shows QR on first login)
# ----------------------------------------------------------------------------
echo "==> Enabling 'Configure OTP' required action"
$KCADM update "authentication/required-actions/CONFIGURE_TOTP" -r "$REALM" \
  -s enabled=true \
  -s defaultAction=false

echo ""
echo "TOTP enforcement configured for client '$CRM_CLIENT' on realm '$REALM'."
echo "  First login : user scans QR with their authenticator app to enroll."
echo "  Next logins : user types the 6-digit code from the app."
echo "Verify in Admin Console: ${KC_URL}/admin/master/console/#/$REALM/authentication"
