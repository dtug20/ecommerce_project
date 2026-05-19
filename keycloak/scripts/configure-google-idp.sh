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
#   KC_URL  (default: http://localhost:8180  — matches KC_HTTP_PORT in compose)

set -euo pipefail

REALM="${REALM:-shofy}"
KC_URL="${KC_URL:-http://localhost:8180}"
ADMIN_USER="${KC_ADMIN:?KC_ADMIN env var required}"
ADMIN_PASS="${KC_ADMIN_PASSWORD:?KC_ADMIN_PASSWORD env var required}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID env var required}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET env var required}"

KCADM="/opt/keycloak/bin/kcadm.sh"
FLOW_ALIAS="auto-link first broker login"
# URL-encoded built-in flow name (kcadm passes the path directly into the REST URL)
BUILTIN_FLOW_ENC="first%20broker%20login"
IDP_ALIAS="google"

# Helper: find the id of the row in CSV stdin whose second column equals $1.
# Avoids awk (not present in the Keycloak container image).
find_id_by_provider() {
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
# 1. Create custom first-broker-login flow (idempotent)
# ----------------------------------------------------------------------------
echo "==> Checking for existing flow: $FLOW_ALIAS"
FLOW_ID=$($KCADM get authentication/flows -r "$REALM" --format csv --fields id,alias --noquotes 2>/dev/null \
  | find_id_by_provider "$FLOW_ALIAS")

if [[ -z "$FLOW_ID" ]]; then
  echo "==> Copying built-in 'first broker login' flow to '$FLOW_ALIAS'"
  $KCADM create "authentication/flows/${BUILTIN_FLOW_ENC}/copy" \
    -r "$REALM" \
    -s "newName=$FLOW_ALIAS"
else
  echo "==> Flow '$FLOW_ALIAS' already exists, reusing"
fi

# Always (re)configure executions to enforce the desired state. This makes the
# script self-healing if a previous run crashed mid-configuration.

set_execution_requirement() {
  local provider_id="$1"
  local requirement="$2"
  local exec_id
  exec_id=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes 2>/dev/null \
    | find_id_by_provider "$provider_id")
  if [[ -n "$exec_id" ]]; then
    echo "    -> $provider_id = $requirement"
    $KCADM update "authentication/executions/$exec_id" -r "$REALM" \
      -s "requirement=$requirement"
  else
    echo "    -> $provider_id execution not found, skipped"
  fi
}

echo "==> Configuring flow executions"
set_execution_requirement "idp-review-profile"     "DISABLED"     # skip review-profile form (auto-create)
set_execution_requirement "idp-auto-link"          "ALTERNATIVE"  # auto-link if email matches existing user
set_execution_requirement "idp-email-verification" "DISABLED"     # Google already verified
set_execution_requirement "idp-confirm-link"       "DISABLED"     # no prompt to confirm link

# ----------------------------------------------------------------------------
# 2. Create or update Google Identity Provider
# ----------------------------------------------------------------------------
echo "==> Checking for existing IdP: $IDP_ALIAS"
EXISTING_IDP=$($KCADM get "identity-provider/instances/$IDP_ALIAS" -r "$REALM" 2>/dev/null || echo "")

TMPFILE=$(mktemp)
cat > "$TMPFILE" <<EOF
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
echo "Verify in Admin Console: ${KC_URL}/admin/master/console/#/$REALM/identity-providers"
