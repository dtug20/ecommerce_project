Build the REDESIGN_PLAN.md document using Agent Teams for parallel execution.

## Step 1: Research Phase
First, thoroughly analyze the existing codebase:
- Read ALL Mongoose model files in the backend
- Read ALL API route files and controllers
- Read the sync service (syncService.js)
- Read ALL frontend pages to understand current data flow
- Read ALL CRM pages to understand current admin capabilities
- Map every existing endpoint

## Step 2: Parallel Draft Phase
Create /tmp/redesign-sections/ directory, then spawn an Agent Team:

**Agent 1 (schema-architect):** Write sections to /tmp/redesign-sections/:
- `section-3.3-database-schemas.md` — All 24 model schemas with full field detail
- `section-7.1-database-migration.md` — Two DBs → one migration plan

**Agent 2 (api-planner):** Write sections to /tmp/redesign-sections/:
- `section-3.2-unified-api.md` — API architecture design
- `section-4-api-endpoints.md` — Complete endpoint specification (all routes)
- `section-3.4-auth-rbac.md` — Keycloak RBAC design

**Agent 3 (cms-planner):** Write sections to /tmp/redesign-sections/:
- `section-3.5-cms-flow.md` — CMS content management flow
- `section-5-crm-pages.md` — CRM admin panel page inventory
- `section-6-storefront-pages.md` — Storefront page inventory with data requirements

**Main thread (you):** Write:
- `section-1-executive-summary.md`
- `section-2-current-state.md` (based on research from Step 1)
- `section-3.1-architecture-diagram.md` (Mermaid diagram)
- `section-8-implementation-phases.md`
- `section-9-risks.md`
- `section-10-tech-stack.md`

## Step 3: Assembly Phase
Use the doc-assembler agent to:
1. Read all section files from /tmp/redesign-sections/
2. Assemble into single REDESIGN_PLAN.md at project root
3. Add table of contents
4. Verify completeness (all 10 sections, ~81K chars)
5. Fix cross-reference inconsistencies

## Step 4: Verification
Verify the final document:
- [ ] File exists at project root
- [ ] All 10 sections present
- [ ] Database schemas have full field-level detail
- [ ] All API endpoints listed with method, path, auth, purpose
- [ ] CRM pages describe functionality in detail
- [ ] Implementation phases are practical (5 phases, 28 weeks)
- [ ] Mermaid diagram renders correctly
- [ ] ~81K characters, ~1900 lines
