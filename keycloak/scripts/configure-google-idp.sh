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

  # Disable "Review Profile" step (yêu cầu UX nhanh — bỏ form review)
  echo "==> Disabling 'Review Profile' step"
  REVIEW_PROFILE_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes 2>/dev/null \
    | awk -F',' '$2 == "idp-review-profile" { print $1 }' | head -1 || true)
  if [[ -n "$REVIEW_PROFILE_ID" ]]; then
    $KCADM update "authentication/executions/$REVIEW_PROFILE_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  else
    echo "    (idp-review-profile execution not found — skipped)"
  fi

  # Auto-link existing user (no password prompt) — set ALTERNATIVE
  echo "==> Setting 'Automatically Set Existing User' to ALTERNATIVE"
  AUTO_SET_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes 2>/dev/null \
    | awk -F',' '$2 == "idp-auto-link" { print $1 }' | head -1 || true)
  if [[ -n "$AUTO_SET_ID" ]]; then
    $KCADM update "authentication/executions/$AUTO_SET_ID" -r "$REALM" \
      -s 'requirement=ALTERNATIVE'
  else
    echo "    (idp-auto-link execution not found — skipped)"
  fi

  # Disable "Verify existing account by Email" (Google already verified)
  echo "==> Disabling 'Verify existing account by Email'"
  VERIFY_EMAIL_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes 2>/dev/null \
    | awk -F',' '$2 == "idp-email-verification" { print $1 }' | head -1 || true)
  if [[ -n "$VERIFY_EMAIL_ID" ]]; then
    $KCADM update "authentication/executions/$VERIFY_EMAIL_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  else
    echo "    (idp-email-verification execution not found — skipped)"
  fi

  # Disable "Confirm link existing account" prompt
  echo "==> Disabling 'Confirm link existing account'"
  CONFIRM_LINK_ID=$($KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --format csv --fields id,providerId --noquotes 2>/dev/null \
    | awk -F',' '$2 == "idp-confirm-link" { print $1 }' | head -1 || true)
  if [[ -n "$CONFIRM_LINK_ID" ]]; then
    $KCADM update "authentication/executions/$CONFIRM_LINK_ID" -r "$REALM" \
      -s 'requirement=DISABLED'
  else
    echo "    (idp-confirm-link execution not found — skipped)"
  fi
else
  echo "==> Flow '$FLOW_ALIAS' already exists, skipping flow creation"
fi

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
