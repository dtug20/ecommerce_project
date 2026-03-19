# Shofy Dual-to-Single Database Migration

This directory contains Node.js scripts that migrate data from the existing
two-database setup (`shofy` + `shofy_ecommerce`) into a single unified
database (`shofy`).

The scripts are numbered and must be run in order.  Every script is
**idempotent** — safe to run more than once without duplicating or corrupting
data.

---

## Prerequisites

- Node.js >= 16
- MongoDB running and accessible from the migration host
- `mongoose` ^7.0.1 installed in either `backend/` or globally
  (scripts use `require('mongoose')` — run from a directory that has it
  available, or run `npm install` in `backend/` first)
- Enough disk space on the unified MongoDB host to hold the merged data

---

## Environment Variables

All scripts read connection strings from environment variables.

| Variable               | Default                                  | Used by                       |
|------------------------|------------------------------------------|-------------------------------|
| `SHOFY_URI`            | `mongodb://127.0.0.1:27017/shofy`        | 00, 02, 03, 05, 06, 07, 08, 09, 10 |
| `SHOFY_ECOMMERCE_URI`  | `mongodb://127.0.0.1:27017/shofy_ecommerce` | 00, 03, 04, 06, 07, 10, 11 |
| `UNIFIED_URI`          | `mongodb://127.0.0.1:27017/shofy`        | 01 – 12 (all target writes)   |

Set them before running each script:

```bash
export SHOFY_URI="mongodb://user:pass@host:27017/shofy?authSource=admin"
export SHOFY_ECOMMERCE_URI="mongodb://user:pass@host:27017/shofy_ecommerce?authSource=admin"
export UNIFIED_URI="mongodb://user:pass@host:27017/shofy_unified?authSource=admin"
```

> **Tip:** if `UNIFIED_URI` points to the same host/db as `SHOFY_URI`
> (i.e. you are migrating in-place), the scripts will still work correctly
> because they use separate mongoose connections and all writes are
> `replaceOne` with `upsert:true`.

---

## Run Order

Run the scripts from the project root (or from `backend/` where `mongoose`
is installed):

```bash
cd /path/to/ecommerce_website-main/backend
```

### Step 0 — Audit existing data (read-only, no changes)

```bash
node ../migration/00-audit-diff.js
```

Prints a document-count comparison table between `shofy` and
`shofy_ecommerce`.  Review the output to understand what will be merged.

---

### Step 1 — Create collections and indexes in unified DB

```bash
node ../migration/01-setup-unified.js
```

Creates all 16 collections with their production indexes.  Safe to re-run.

---

### Steps 2–9 — Migrate entity data

Run in the order shown.  Each step depends on the collections created
by earlier steps (e.g. product migration needs categories and brands to
already be present for cross-reference checking).

```bash
node ../migration/02-migrate-admins.js
node ../migration/03-migrate-users.js
node ../migration/04-migrate-categories.js
node ../migration/05-migrate-brands.js
node ../migration/06-migrate-products.js
node ../migration/07-migrate-orders.js
node ../migration/08-migrate-reviews.js
node ../migration/09-migrate-coupons.js
```

---

### Step 10 — Post-migration reference fixes

```bash
node ../migration/10-post-migration-fixes.js
```

Removes orphaned ObjectId references from `category.products[]` and
`brand.products[]`.  Also audits `orders.user`, `reviews.userId`, and
`reviews.productId` and prints any broken references that need manual
attention.

---

### Step 11 — Validate migration

```bash
node ../migration/11-validate-migration.js
```

Runs PASS/FAIL checks:
- Document counts in unified >= source counts
- No duplicate values on unique-indexed fields
- Spot-check of 5 random documents per collection for required fields
- Cross-reference field presence checks

The script exits with code 1 if any check fails.  **Do not switch
application traffic to the unified database until this step passes.**

---

### Step 12 — Seed default CMS data

```bash
node ../migration/12-seed-defaults.js
```

Inserts the SiteSetting singleton, the default header navigation menu, and
the Home page into the unified database.  All three inserts are skipped if
the documents already exist.

---

## Full one-liner (for scripting)

```bash
cd /path/to/ecommerce_website-main/backend

for script in \
  ../migration/00-audit-diff.js \
  ../migration/01-setup-unified.js \
  ../migration/02-migrate-admins.js \
  ../migration/03-migrate-users.js \
  ../migration/04-migrate-categories.js \
  ../migration/05-migrate-brands.js \
  ../migration/06-migrate-products.js \
  ../migration/07-migrate-orders.js \
  ../migration/08-migrate-reviews.js \
  ../migration/09-migrate-coupons.js \
  ../migration/10-post-migration-fixes.js \
  ../migration/11-validate-migration.js \
  ../migration/12-seed-defaults.js
do
  echo ""
  echo ">>> Running $script"
  node "$script" || { echo "FAILED: $script"; exit 1; }
done
```

---

## Rollback

If anything goes wrong, rollback by dropping the unified database and
re-running from step 01:

```bash
# Connect to MongoDB and drop the unified database
mongosh "$UNIFIED_URI" --eval "db.dropDatabase()"

# Then re-run from step 01
node ../migration/01-setup-unified.js
# ... continue from step 02
```

The source databases (`shofy` and `shofy_ecommerce`) are **never modified**
by any migration script — they remain intact as the rollback baseline.

---

## Production Warning

These scripts were designed for a **planned maintenance window**.  Before
running in production:

1. Take a full `mongodump` backup of both source databases.
2. Stop all application services that write to the source databases.
3. Run the migration scripts.
4. Run step 11 (validate) and confirm all checks pass.
5. Update application environment variables to point to the unified DB.
6. Restart application services.
7. Monitor for 24 hours before decommissioning the source databases.

```
PRODUCTION CHECKLIST
[ ] mongodump backups taken and verified restorable
[ ] All write traffic to source DBs stopped
[ ] 00-audit-diff reviewed and counts noted
[ ] 01 through 09 completed without errors
[ ] 10-post-migration-fixes shows 0 orphaned refs (or reviewed manually)
[ ] 11-validate-migration exits with code 0 (all PASS)
[ ] 12-seed-defaults completed
[ ] Application env vars updated to UNIFIED_URI
[ ] Application smoke-tested (login, browse products, place test order)
[ ] Monitoring dashboards healthy for 24 h
[ ] Source databases archived (not dropped — keep for 30 days)
```

---

## Architecture Reference

```
shofy (backend DB)          shofy_ecommerce (CRM DB)
   users (primary)    ──┐      users (secondary / backfill)
   admins             ──┤      categories (authoritative)
   brands             ──┤      products (authoritative)
   orders (primary)   ──┤      orders (gap-fill)
   reviews            ──┤
   coupons            ──┘
                            unified DB (shofy or shofy_unified)
                               users, admins, products, categories,
                               brands, orders, reviews, coupons,
                               sitesettings, pages, menus, banners,
                               blogposts, wishlists, emailtemplates,
                               activitylogs
```
