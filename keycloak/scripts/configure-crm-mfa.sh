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
# We dump the full executions list once and search it locally — that lets us
# match by either providerId (leaf authenticators) or displayName+level
# (sub-flows). Updates go through the /flows/{alias}/executions endpoint, which
# works for nested executions in Keycloak 26+ (the /executions/{id} endpoint
# returns 404 for executions inside copied sub-flows).

EXEC_CSV="/tmp/crm-mfa-execs.csv"
EXEC_BODY="/tmp/crm-mfa-body.json"

cleanup_tmp() { rm -f "$EXEC_CSV" "$EXEC_BODY"; }
trap cleanup_tmp EXIT

dump_executions() {
  $KCADM get "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    --fields id,displayName,providerId,authenticationFlow,level,index \
    --format csv --noquotes > "$EXEC_CSV" 2>/dev/null
}

# find_by — strategies: 'provider' (leaf), 'subflow' (displayName + authFlow=true)
# Output: execution id, or empty string
find_by() {
  local strategy="$1" needle="$2"
  while IFS=',' read -r id display provider authflow level index; do
    [[ -z "$id" ]] && continue
    case "$strategy" in
      provider)
        [[ "$provider" == "$needle" ]] && { echo "$id"; return 0; } ;;
      subflow)
        [[ "$authflow" == "true" && "$display" == "$needle" ]] && { echo "$id"; return 0; } ;;
    esac
  done < "$EXEC_CSV"
  return 0
}

# Pick the first sub-flow at the given level — used as fallback if displayName
# matching fails (e.g. theme/locale differences).
find_subflow_at_level() {
  local target_level="$1"
  while IFS=',' read -r id display provider authflow level index; do
    [[ -z "$id" ]] && continue
    [[ "$authflow" == "true" && "$level" == "$target_level" ]] && { echo "$id"; return 0; }
  done < "$EXEC_CSV"
  return 0
}

update_requirement() {
  local exec_id="$1" requirement="$2" label="$3"
  if [[ -z "$exec_id" ]]; then
    echo "    -> $label NOT FOUND, skipped"
    return 0
  fi
  echo "    -> $label = $requirement (id=$exec_id)"
  cat > "$EXEC_BODY" <<EOF
{"id":"$exec_id","requirement":"$requirement"}
EOF
  $KCADM update "authentication/flows/$FLOW_ALIAS/executions" -r "$REALM" \
    -f "$EXEC_BODY"
}

echo "==> Dumping executions for flow '$FLOW_ALIAS'"
dump_executions
if [[ ! -s "$EXEC_CSV" ]]; then
  echo "ERROR: executions list is empty for '$FLOW_ALIAS'"
  exit 1
fi

echo "==> Configuring flow executions to enforce OTP"
# Promote the conditional 2FA sub-flow to always run.
SUBFLOW_ID=$(find_by subflow "Browser - Conditional 2FA")
if [[ -z "$SUBFLOW_ID" ]]; then
  echo "    (sub-flow name not matched, falling back to level=1 lookup)"
  SUBFLOW_ID=$(find_subflow_at_level 1)
fi
update_requirement "$SUBFLOW_ID" "REQUIRED" "Conditional 2FA sub-flow"

# Disable the "is user OTP configured?" gate so OTP is no longer optional.
COND_ID=$(find_by provider "conditional-user-configured")
update_requirement "$COND_ID" "DISABLED" "conditional-user-configured"

# Belt-and-braces: ensure the OTP form itself stays REQUIRED.
OTP_ID=$(find_by provider "auth-otp-form")
update_requirement "$OTP_ID" "REQUIRED" "auth-otp-form"

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
