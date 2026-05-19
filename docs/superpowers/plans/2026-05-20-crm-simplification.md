# CRM Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the Shofy CRM from 28 pages to 13 by deleting unused CMS Pages/Menus modules, Theme + Email Templates settings, and Reviews moderation. Auto-approve reviews; switch email templates to file-based.

**Architecture:** Delete UI page folders and corresponding backend controllers/routes. Keep Mongoose models in place (rollback safety). Hardcode theme CSS variables and email templates. Storefront homepage rewritten to a fixed layout that does not depend on the CMS block renderer.

**Tech Stack:** React 19 + Vite + Ant Design 6 (CRM UI), Express.js (CRM proxy + backend), Next.js 13 (storefront), MongoDB/Mongoose.

**Spec:** `docs/superpowers/specs/2026-05-19-crm-simplification-design.md`

---

## File Map

**Storefront (`frontend/`) — edit:**
- `src/pages/index.jsx` — rewrite homepage to fixed layout
- `src/components/layout/headers/DynamicMenu.jsx` — drop CMS branch
- `src/redux/features/cms/cmsApi.js` — remove `getPageBySlug`, `getMenuByLocation`
- `public/assets/scss/utils/_variables.scss` — hardcode brand colors
- `src/pages/_app.jsx` (or wherever theme application lives) — drop runtime CSS-var injection

**CRM UI (`crm/crm-ui/src/`) — delete:**
- `features/cms/pages/` folder
- `features/cms/menus/` folder
- `features/settings/ThemeSettingsPage.tsx`
- `features/settings/EmailTemplatesPage.tsx`
- `features/reviews/` folder

**CRM UI — edit:**
- `App.tsx` — remove deleted routes
- `components/commons/MainLayout.tsx` — remove sidebar entries

**CRM proxy (`crm/`) — edit:**
- `server.js` — remove `/api/cms/pages`, `/api/cms/menus`, `/api/email-templates`, `/api/reviews` proxy groups
- `routes/cms.routes.js` — strip pages + menus handlers
- `routes/review.routes.js` — DELETE file

**Backend (`backend/`) — edit:**
- `controller/v1/cms.controller.js` — remove 12 functions (7 page + 5 menu)
- `controller/v1/store-cms.controller.js` — remove `getPageBySlug`, `getMenuByLocation`
- `controller/v1/review.controller.js` — remove moderation funcs; change new-review default `status: 'pending'` → `'approved'`
- `routes/v1/admin.js` — remove deleted routes
- `routes/v1/store.js` — remove deleted routes
- `utils/emailService.js` — switch from DB lookup to file-based template lookup

**Backend — delete:**
- `controller/v1/email-template.controller.js`

**Backend — create:**
- `utils/emailTemplates/index.js` — registry mapping slug → template module
- `utils/emailTemplates/orderConfirmation.js`
- `utils/emailTemplates/orderShipped.js`
- `utils/emailTemplates/orderDelivered.js`
- `utils/emailTemplates/orderCancelled.js`
- `utils/emailTemplates/welcome.js`
- `utils/emailTemplates/passwordReset.js`
- `utils/emailTemplates/vendorApplication.js`
- `utils/emailTemplates/vendorApproved.js`
- `utils/emailTemplates/lowStockAlert.js`

**Data migration:** one-time `mongosh` command to bulk-approve pending reviews.

---

## Pre-Flight

### Task 0: Baseline & branch

**Files:** none (git operations only)

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: empty output (no uncommitted changes). If not clean, ask user before continuing.

- [ ] **Step 2: Verify spec is committed**

Run: `git log --oneline -1 docs/superpowers/specs/2026-05-19-crm-simplification-design.md`
Expected: one commit line — `docs(spec): CRM simplification design …`

- [ ] **Step 3: Create working branch**

Run: `git checkout -b refactor/crm-simplification`
Expected: `Switched to a new branch 'refactor/crm-simplification'`

---

## Phase 1 — Storefront homepage rewrite

The storefront must keep working after we remove CMS Pages from the backend. This phase replaces the dynamic block-rendered homepage with a fixed layout that depends only on still-supported endpoints (banners, categories, products, blog).

### Task 1: Inspect current homepage data flow

**Files:**
- Read: `frontend/src/pages/index.jsx`
- Read: `frontend/src/redux/features/cms/cmsApi.js`
- Read: `frontend/src/components/cms/BlockRenderer.jsx` (if exists)

- [ ] **Step 1: Read the homepage file**

Read `frontend/src/pages/index.jsx`. Identify:
- The `getServerSideProps` (or `getStaticProps`) function — what does it fetch?
- Where `BlockRenderer` is used and what props it receives.
- Any fallback hardcoded layout.

- [ ] **Step 2: Read the CMS API slice**

Read `frontend/src/redux/features/cms/cmsApi.js`. Note the `getPageBySlug` and `getMenuByLocation` endpoint definitions — these will be removed in Phase 2.

- [ ] **Step 3: List existing block components**

Run: `ls frontend/src/components/cms/blocks/ 2>/dev/null || find frontend/src/components -type d -name "blocks"`
Expected: list of 6–7 block component files (HeroSlider, FeaturedProducts, CategoryShowcase, BannerGrid, TextBlock, ProductCarousel, Newsletter)

This is read-only — no commit.

### Task 2: Rewrite homepage with fixed layout

**Files:**
- Modify: `frontend/src/pages/index.jsx`

- [ ] **Step 1: Plan the data dependencies**

The new homepage needs four API calls in `getServerSideProps`:
1. Active hero banners — `GET /api/v1/store/banners?location=hero&limit=5`
2. Featured categories tree — `GET /api/v1/store/categories/tree`
3. Featured products — `GET /api/v1/store/products?featured=true&limit=8`
4. Recent blog posts — `GET /api/v1/store/blog?limit=3`

If any of these fails, render the section with an empty state — never error the whole page.

- [ ] **Step 2: Write the new index.jsx**

Replace the body of `frontend/src/pages/index.jsx` with a fixed layout. Use the same block components that already exist — only the assembly changes. Pseudocode skeleton (engineer fills in import paths matching their codebase):

```jsx
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import HeroSlider from '@/components/cms/blocks/HeroSlider';
import CategoryShowcase from '@/components/cms/blocks/CategoryShowcase';
import FeaturedProducts from '@/components/cms/blocks/FeaturedProducts';
import BlogArea from '@/components/blog/blog-area';
import Newsletter from '@/components/cms/blocks/Newsletter';
import Footer from '@/layout/footers/footer';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';

async function safeFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function getServerSideProps() {
  const [banners, categories, featured, blog] = await Promise.all([
    safeFetch(`${API}/api/v1/store/banners?location=hero&limit=5`),
    safeFetch(`${API}/api/v1/store/categories/tree`),
    safeFetch(`${API}/api/v1/store/products?featured=true&limit=8`),
    safeFetch(`${API}/api/v1/store/blog?limit=3`),
  ]);
  return {
    props: {
      banners: banners?.data ?? [],
      categories: categories?.data ?? [],
      featured: featured?.data ?? [],
      blog: blog?.data ?? [],
    },
  };
}

export default function Home({ banners, categories, featured, blog }) {
  return (
    <Wrapper>
      <HeaderTwo />
      <main>
        <HeroSlider items={banners} />
        <CategoryShowcase categories={categories} />
        <FeaturedProducts products={featured} />
        <BlogArea posts={blog} />
        <Newsletter />
      </main>
      <Footer />
    </Wrapper>
  );
}
```

NOTE: Block components currently expect block-payload props (e.g. `{ block: { config, items } }`). If they do, write tiny adapter wrappers in `frontend/src/components/home-fixed/` rather than editing the block components — keep block components reusable. Use whichever shape the existing component accepts.

- [ ] **Step 3: Start the frontend dev server**

Run: `cd frontend && npm run dev`
Run in background. Wait ~10 seconds for compile.

- [ ] **Step 4: Verify homepage renders**

Open browser at `http://localhost:3000`. Expected:
- Hero slider shows active banners (or empty state if none)
- Category showcase renders
- Featured products grid renders
- Blog preview renders
- No console errors in DevTools

If broken: fix before continuing. Common issue is block component prop shape mismatch — write the adapter wrappers from Step 2.

- [ ] **Step 5: Stop dev server, commit**

Stop the dev server.

```bash
git add frontend/src/pages/index.jsx frontend/src/components/home-fixed/ 2>/dev/null
git commit -m "refactor(storefront): replace block-rendered homepage with fixed layout"
```

### Task 3: Remove CMS endpoints from RTK Query slice

**Files:**
- Modify: `frontend/src/redux/features/cms/cmsApi.js`

- [ ] **Step 1: Read the file**

Read `frontend/src/redux/features/cms/cmsApi.js`. Find:
- The `getPageBySlug` endpoint definition
- The `getMenuByLocation` endpoint definition
- Any exported hooks for these two (`useGetPageBySlugQuery`, `useGetMenuByLocationQuery`)

- [ ] **Step 2: Remove the two endpoint definitions**

Delete the `getPageBySlug` and `getMenuByLocation` blocks from `endpoints: (builder) => ({ ... })`. Remove the corresponding hook exports from the bottom of the file.

- [ ] **Step 3: Find and remove all callers**

Run: `grep -rn "useGetPageBySlugQuery\|useGetMenuByLocationQuery" frontend/src`
Expected: matches in 1-3 files.

For each match, either delete the usage (if the surrounding code is dead after Task 2) or replace with a hardcoded fallback. The known callers from the spec:
- `frontend/src/pages/index.jsx` — already replaced in Task 2 (no `useGetPageBySlugQuery` should remain).
- `frontend/src/components/layout/headers/DynamicMenu.jsx` — will be edited in Task 4.

- [ ] **Step 4: Type-check the storefront**

Run: `cd frontend && npm run lint`
Expected: passes (or pre-existing warnings only — no new errors referencing removed exports).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/redux/features/cms/cmsApi.js
git commit -m "refactor(storefront): drop CMS page+menu RTK Query endpoints"
```

### Task 4: Drop CMS branch from DynamicMenu

**Files:**
- Modify: `frontend/src/components/layout/headers/DynamicMenu.jsx`

- [ ] **Step 1: Read the file**

Read `frontend/src/components/layout/headers/DynamicMenu.jsx`. Identify:
- The CMS path: a `useGetMenuByLocationQuery('header')` call (or similar)
- The fallback path: derives menu from categories

- [ ] **Step 2: Delete the CMS branch**

Remove the `useGetMenuByLocationQuery` call and the conditional that prefers its data. Keep only the category-derived rendering. The component should now unconditionally render the category-based menu.

- [ ] **Step 3: Verify in browser**

Restart frontend dev server (`cd frontend && npm run dev` in background).
Open `http://localhost:3000`. Verify header menu shows category names. No console errors.

- [ ] **Step 4: Stop server, commit**

```bash
git add frontend/src/components/layout/headers/DynamicMenu.jsx
git commit -m "refactor(storefront): use category-derived menu unconditionally"
```

### Task 5: Hardcode theme CSS variables

**Files:**
- Modify: `frontend/public/assets/scss/utils/_variables.scss`
- Modify (or find): the place that applies `SiteSetting.theme` to CSS variables at runtime (likely in `frontend/src/pages/_app.jsx` or a `ThemeProvider` component)

- [ ] **Step 1: Find runtime CSS-var application**

Run: `grep -rn "setProperty\|--tp-theme-primary\|--tp-theme" frontend/src`
Expected: 1-3 hits. Note the file that calls `document.documentElement.style.setProperty('--tp-theme-primary', ...)`.

- [ ] **Step 2: Remove the runtime injection**

In the file from Step 1, delete the `useEffect` (or wherever the `setProperty` calls live). The CSS vars will now come from SCSS at build time only.

- [ ] **Step 3: Hardcode the variables**

Read `frontend/public/assets/scss/utils/_variables.scss`. Find any `:root { --tp-theme-primary: ...; ... }` block. Replace any variables that were previously overridden by settings with their default values. Example final state:

```scss
:root {
  --tp-theme-primary: #0989FF;
  --tp-theme-secondary: #FA8232;
  // ... other brand vars previously dynamic
}
```

(Use whatever default values the existing code already sets — the engineer should not change brand colors, only freeze them.)

- [ ] **Step 4: Verify storefront renders with same colors**

Run frontend dev server, open homepage. Visual check: header, buttons, links use the same brand colors as before.

- [ ] **Step 5: Commit**

```bash
git add frontend/public/assets/scss/utils/_variables.scss frontend/src/pages/_app.jsx
git commit -m "refactor(storefront): freeze theme CSS variables, drop runtime injection"
```

---

## Phase 2 — CRM UI deletion

### Task 6: Inspect CRM sidebar + routes

**Files:**
- Read: `crm/crm-ui/src/App.tsx`
- Read: `crm/crm-ui/src/components/commons/MainLayout.tsx`

- [ ] **Step 1: Read App.tsx**

Read `crm/crm-ui/src/App.tsx`. Find the `<Route>` definitions for:
- `/cms/pages`, `/cms/pages/:id`
- `/cms/menus`, `/cms/menus/:id`
- `/settings/theme`
- `/settings/email-templates`
- `/reviews`

Note the exact route paths and the lazy import statements at the top.

- [ ] **Step 2: Read MainLayout.tsx**

Read `crm/crm-ui/src/components/commons/MainLayout.tsx`. Find the sidebar menu items for the same routes. Note the structure (likely an array of menu objects with `key`, `label`, `icon`, `children`).

This is read-only — no commit.

### Task 7: Delete CRM UI page folders

**Files:**
- Delete: `crm/crm-ui/src/features/cms/pages/`
- Delete: `crm/crm-ui/src/features/cms/menus/`
- Delete: `crm/crm-ui/src/features/settings/ThemeSettingsPage.tsx`
- Delete: `crm/crm-ui/src/features/settings/EmailTemplatesPage.tsx`
- Delete: `crm/crm-ui/src/features/reviews/`

- [ ] **Step 1: Delete the folders and files**

```bash
rm -rf crm/crm-ui/src/features/cms/pages
rm -rf crm/crm-ui/src/features/cms/menus
rm    crm/crm-ui/src/features/settings/ThemeSettingsPage.tsx
rm    crm/crm-ui/src/features/settings/EmailTemplatesPage.tsx
rm -rf crm/crm-ui/src/features/reviews
```

- [ ] **Step 2: Search for any remaining references**

Run: `grep -rn "ThemeSettingsPage\|EmailTemplatesPage\|PagesListPage\|PageEditorPage\|MenusPage\|MenuEditorPage\|ReviewsPage" crm/crm-ui/src`
Expected: only hits in `App.tsx` and `MainLayout.tsx` (which Task 8 cleans up).

If hits in other files, that file also needs cleanup before this phase is done.

This step is verification — no commit yet.

### Task 8: Prune App.tsx routes

**Files:**
- Modify: `crm/crm-ui/src/App.tsx`

- [ ] **Step 1: Remove lazy imports**

In `crm/crm-ui/src/App.tsx`, remove the `lazy(() => import(...))` lines for the 7 deleted pages (PagesListPage, PageEditorPage, MenusPage, MenuEditorPage, ThemeSettingsPage, EmailTemplatesPage, ReviewsPage).

- [ ] **Step 2: Remove Route elements**

Remove the `<Route path="/cms/pages" ... />` and all 6 other deleted routes from the `<Routes>` tree.

- [ ] **Step 3: TypeScript check**

Run: `cd crm/crm-ui && npx tsc --noEmit`
Expected: passes with no errors referencing the deleted modules.

If errors remain, fix the remaining import references found in Task 7 Step 2.

- [ ] **Step 4: Commit (do not include MainLayout yet — separate commit for clarity)**

```bash
git add crm/crm-ui/src/App.tsx crm/crm-ui/src/features/cms/pages crm/crm-ui/src/features/cms/menus crm/crm-ui/src/features/settings/ThemeSettingsPage.tsx crm/crm-ui/src/features/settings/EmailTemplatesPage.tsx crm/crm-ui/src/features/reviews 2>/dev/null
git add -u  # picks up the deletions
git commit -m "refactor(crm-ui): delete CMS pages/menus, theme, email templates, reviews pages"
```

### Task 9: Prune MainLayout sidebar

**Files:**
- Modify: `crm/crm-ui/src/components/commons/MainLayout.tsx`

- [ ] **Step 1: Remove sidebar menu items**

In `crm/crm-ui/src/components/commons/MainLayout.tsx`, remove these menu entries:
- The two `cms.pages` and `cms.menus` children under the CMS submenu (CMS submenu now has only Blog + Banners)
- The two `settings.theme` and `settings.emailTemplates` children under Settings submenu (Settings now has only General, Payment, Shipping)
- The top-level `reviews` menu item

Also remove any icon imports that become unused.

- [ ] **Step 2: Start CRM UI dev server**

Run: `cd crm/crm-ui && npm run dev`
In background. Wait ~10 seconds.

- [ ] **Step 3: Verify sidebar**

Open `http://localhost:3001` (or whichever port the CRM UI uses). Log in. Verify sidebar shows:
```
Dashboard, Products, Categories, Orders, Users, Vendors, Coupons,
CMS [Blog, Banners],
Settings [General, Payment, Shipping],
Activity Log, AI Chatbot
```

No broken links. No console errors.

- [ ] **Step 4: Stop dev server, commit**

```bash
git add crm/crm-ui/src/components/commons/MainLayout.tsx
git commit -m "refactor(crm-ui): prune sidebar to 13 items"
```

---

## Phase 3 — CRM proxy server cleanup

### Task 10: Strip server.js proxy groups

**Files:**
- Modify: `crm/server.js`

- [ ] **Step 1: Read server.js**

Read `crm/server.js`. Find the `app.use('/api/...', ...)` lines for:
- `/api/cms/pages` (if a separate use) — note that `/api/cms` may be one umbrella registration
- `/api/cms/menus`
- `/api/email-templates`
- `/api/reviews`

Note the require/import statements for the route modules.

- [ ] **Step 2: Remove proxy registrations**

Edit `crm/server.js`:
- Remove `app.use('/api/email-templates', require('./routes/email-template.routes'))` (or equivalent — adjust to actual code)
- Remove `app.use('/api/reviews', require('./routes/review.routes'))`
- For CMS: if `cms.routes.js` covers all CMS resources, leave the `app.use('/api/cms', ...)` registration alone — the route file itself will be pruned in Task 11.

- [ ] **Step 3: Delete review.routes.js**

```bash
rm crm/routes/review.routes.js
```

- [ ] **Step 4: Delete email-template.routes.js if it exists**

```bash
[ -f crm/routes/email-template.routes.js ] && rm crm/routes/email-template.routes.js || echo "no such file"
```

- [ ] **Step 5: Verify CRM server boots**

Run: `cd crm && node -c server.js`
Expected: no syntax errors.

Then start the server: `cd crm && npm start` (background, wait 5s).
Hit `curl -s http://localhost:8080/api/me -o /dev/null -w "%{http_code}\n"` — expect 200 or 401, NOT 500.

Stop server.

- [ ] **Step 6: Commit**

```bash
git add crm/server.js crm/routes/review.routes.js crm/routes/email-template.routes.js 2>/dev/null
git add -u
git commit -m "refactor(crm-server): drop email-template + review proxy routes"
```

### Task 11: Prune cms.routes.js

**Files:**
- Modify: `crm/routes/cms.routes.js`

- [ ] **Step 1: Read cms.routes.js**

Read `crm/routes/cms.routes.js`. Identify the route handlers grouped by resource:
- `/pages/*` — DELETE
- `/menus/*` — DELETE
- `/blog/*` — KEEP
- `/banners/*` — KEEP
- `/settings/*` — KEEP

- [ ] **Step 2: Remove pages + menus handlers**

Delete every `router.get/post/put/patch/delete('/pages...')` and `router.get/post/put/patch/delete('/menus...')` line in this file. Also remove any helper imports that become unused (e.g. `pagesController`, `menusController`).

- [ ] **Step 3: Verify CRM server still boots**

Run: `cd crm && node -c server.js && cd crm && node -c routes/cms.routes.js`
Expected: no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add crm/routes/cms.routes.js
git commit -m "refactor(crm-server): strip CMS pages+menus route handlers"
```

---

## Phase 4 — Backend cleanup

### Task 12: Inspect backend route + controller surface

**Files:**
- Read: `backend/routes/v1/admin.js`
- Read: `backend/routes/v1/store.js`
- Read: `backend/controller/v1/cms.controller.js`
- Read: `backend/controller/v1/store-cms.controller.js`
- Read: `backend/controller/v1/review.controller.js`

- [ ] **Step 1: Skim each file**

For each file above, identify:
- In `admin.js`: lines registering `/pages/*`, `/menus/*`, `/email-templates/*`, `/reviews/*` (moderation)
- In `store.js`: lines registering `/pages/:slug`, `/menus/:location`
- In `cms.controller.js`: list the 7 page functions and 5 menu functions exported (note their names)
- In `store-cms.controller.js`: confirm `getPageBySlug` and `getMenuByLocation` exist
- In `review.controller.js`: list moderation function names (`approveReview`, `rejectReview`, `replyReview`, `adminListReviews`, etc.) and find the line that sets `status: 'pending'` for new reviews

This is read-only — no commit. Take notes for subsequent tasks.

### Task 13: Remove admin routes for deleted features

**Files:**
- Modify: `backend/routes/v1/admin.js`

- [ ] **Step 1: Delete route lines**

In `backend/routes/v1/admin.js`, remove these route registrations:
- All `/pages/*` routes
- All `/menus/*` routes
- All `/email-templates/*` routes
- All `/reviews/*` moderation routes (approve, reject, reply, admin list)

Also remove the corresponding controller imports if they become entirely unused (e.g. `emailTemplateController`).

- [ ] **Step 2: Run backend syntactically**

Run: `cd backend && node -c routes/v1/admin.js`
Expected: no syntax error.

- [ ] **Step 3: Commit**

```bash
git add backend/routes/v1/admin.js
git commit -m "refactor(backend): remove admin routes for deleted features"
```

### Task 14: Remove store routes for deleted features

**Files:**
- Modify: `backend/routes/v1/store.js`

- [ ] **Step 1: Delete route lines**

In `backend/routes/v1/store.js`, remove:
- `router.get('/pages/:slug', ...)`
- `router.get('/menus/:location', ...)`

- [ ] **Step 2: Syntax check**

Run: `cd backend && node -c routes/v1/store.js`
Expected: no syntax error.

- [ ] **Step 3: Commit**

```bash
git add backend/routes/v1/store.js
git commit -m "refactor(backend): remove store routes for CMS pages+menus"
```

### Task 15: Cut page + menu functions from cms.controller.js

**Files:**
- Modify: `backend/controller/v1/cms.controller.js`

- [ ] **Step 1: Delete the 12 functions**

In `backend/controller/v1/cms.controller.js`, delete the 7 Page functions and 5 Menu functions (names captured in Task 12). Also remove their `exports.functionName = ...` lines (if exports are in a single block at the bottom, prune those entries).

- [ ] **Step 2: Remove unused model requires**

If the file required `const Page = require('../../model/Page')` or `const Menu = require('../../model/Menu')` at the top and those models are no longer referenced, remove those lines.

- [ ] **Step 3: Syntax + import check**

Run: `cd backend && node -e "require('./controller/v1/cms.controller')" && echo "OK"`
Expected: `OK`. Any missing reference produces an error here.

- [ ] **Step 4: Commit**

```bash
git add backend/controller/v1/cms.controller.js
git commit -m "refactor(backend): cut Page+Menu functions from cms.controller"
```

### Task 16: Trim store-cms controller

**Files:**
- Modify: `backend/controller/v1/store-cms.controller.js`

- [ ] **Step 1: Delete two functions**

Remove `getPageBySlug` and `getMenuByLocation` (function bodies + exports). Remove unused model requires (Page, Menu) if any.

- [ ] **Step 2: Syntax check**

Run: `cd backend && node -e "require('./controller/v1/store-cms.controller')" && echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/controller/v1/store-cms.controller.js
git commit -m "refactor(backend): drop getPageBySlug + getMenuByLocation from store-cms"
```

### Task 17: Delete email-template controller

**Files:**
- Delete: `backend/controller/v1/email-template.controller.js`

- [ ] **Step 1: Verify no other code requires it**

Run: `grep -rn "email-template.controller\|emailTemplateController" backend/ --include="*.js"`
Expected: zero hits (we removed the admin route consumer in Task 13).

If hits remain, clean them up first.

- [ ] **Step 2: Delete the file**

```bash
rm backend/controller/v1/email-template.controller.js
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "refactor(backend): delete email-template controller"
```

### Task 18: Auto-approve new reviews + remove moderation functions

**Files:**
- Modify: `backend/controller/v1/review.controller.js`

- [ ] **Step 1: Remove moderation functions**

Delete these functions from `backend/controller/v1/review.controller.js` (names confirmed in Task 12 — substitute the actual names found there):
- `adminListReviews` (admin paginated list with filters)
- `approveReview`
- `rejectReview`
- `replyReview`

Keep: user-side submit, get product reviews, delete (if it's user-facing), and any other store-facing functions.

- [ ] **Step 2: Change new-review default status**

Find the function that handles a new review (`addReview` or `createReview`). Locate the line that builds the new Review doc — currently it sets `status: 'pending'`. Change to:

```js
status: 'approved',
```

- [ ] **Step 3: Syntax + import check**

Run: `cd backend && node -e "require('./controller/v1/review.controller')" && echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/controller/v1/review.controller.js
git commit -m "refactor(backend): auto-approve reviews, drop moderation handlers"
```

---

## Phase 5 — Email template migration

### Task 19: Inspect emailService.js

**Files:**
- Read: `backend/utils/emailService.js`

- [ ] **Step 1: Read the file**

Read `backend/utils/emailService.js`. Identify:
- The exported function (likely `sendTemplatedEmail(slug, recipient, data, language)`)
- The DB lookup (`EmailTemplate.findOne({ slug })`)
- The render call (likely `renderTemplate(template.html, data)` from `emailRenderer.js`)
- The transporter / nodemailer config

This is read-only — no commit.

### Task 20: Create utils/emailTemplates/ directory + index registry

**Files:**
- Create: `backend/utils/emailTemplates/index.js`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p backend/utils/emailTemplates
```

- [ ] **Step 2: Write the registry**

Create `backend/utils/emailTemplates/index.js`:

```js
const templates = {
  'order-confirmation':  require('./orderConfirmation'),
  'order-shipped':       require('./orderShipped'),
  'order-delivered':     require('./orderDelivered'),
  'order-cancelled':     require('./orderCancelled'),
  'welcome':             require('./welcome'),
  'password-reset':      require('./passwordReset'),
  'vendor-application':  require('./vendorApplication'),
  'vendor-approved':     require('./vendorApproved'),
  'low-stock-alert':     require('./lowStockAlert'),
};

function getTemplate(slug) {
  const t = templates[slug];
  if (!t) throw new Error(`Email template not found: ${slug}`);
  return t;
}

module.exports = { getTemplate, templates };
```

(No commit yet — the individual template files don't exist; the require calls will fail until Task 21.)

### Task 21: Create the nine template modules

**Files:**
- Create: `backend/utils/emailTemplates/orderConfirmation.js`
- Create: `backend/utils/emailTemplates/orderShipped.js`
- Create: `backend/utils/emailTemplates/orderDelivered.js`
- Create: `backend/utils/emailTemplates/orderCancelled.js`
- Create: `backend/utils/emailTemplates/welcome.js`
- Create: `backend/utils/emailTemplates/passwordReset.js`
- Create: `backend/utils/emailTemplates/vendorApplication.js`
- Create: `backend/utils/emailTemplates/vendorApproved.js`
- Create: `backend/utils/emailTemplates/lowStockAlert.js`

- [ ] **Step 1: Shared shape**

Every template module exports `{ subject(data, lang), html(data, lang) }`. Use this template as a starting point. Variables in the HTML use `${data.field}` (plain JS template literals — no merge-tag library needed).

- [ ] **Step 2: Write orderConfirmation.js**

```js
// backend/utils/emailTemplates/orderConfirmation.js
const subjects = {
  en: (d) => `Order #${d.orderNumber} confirmed`,
  vi: (d) => `Đơn hàng #${d.orderNumber} đã được xác nhận`,
};

const bodies = {
  en: (d) => `
    <h2>Thanks for your order, ${d.customerName}!</h2>
    <p>Your order <strong>#${d.orderNumber}</strong> has been placed and is being processed.</p>
    <p><strong>Total:</strong> ${d.total}</p>
    <p>We'll send another email when your order ships.</p>
  `,
  vi: (d) => `
    <h2>Cảm ơn bạn đã đặt hàng, ${d.customerName}!</h2>
    <p>Đơn hàng <strong>#${d.orderNumber}</strong> đã được tạo và đang được xử lý.</p>
    <p><strong>Tổng:</strong> ${d.total}</p>
    <p>Chúng tôi sẽ gửi email khi đơn được giao đi.</p>
  `,
};

module.exports = {
  subject: (data, lang = 'en') => (subjects[lang] || subjects.en)(data),
  html:    (data, lang = 'en') => (bodies[lang]   || bodies.en)(data),
};
```

- [ ] **Step 3: Write the remaining 8 template files**

Use the same shape. Suggested content per template:

| Slug | English subject | Vietnamese subject |
|---|---|---|
| order-shipped | `Order #${d.orderNumber} shipped` | `Đơn #${d.orderNumber} đã giao vận` |
| order-delivered | `Order #${d.orderNumber} delivered` | `Đơn #${d.orderNumber} đã giao đến` |
| order-cancelled | `Order #${d.orderNumber} cancelled` | `Đơn #${d.orderNumber} đã huỷ` |
| welcome | `Welcome to Shofy` | `Chào mừng đến Shofy` |
| password-reset | `Reset your password` | `Đặt lại mật khẩu của bạn` |
| vendor-application | `Vendor application received` | `Đã nhận đơn đăng ký vendor` |
| vendor-approved | `Your vendor application is approved` | `Đơn đăng ký vendor đã được duyệt` |
| low-stock-alert | `Low stock alert: ${d.productName}` | `Cảnh báo hết hàng: ${d.productName}` |

For each: write a short HTML body mirroring what the DB-seeded template would have said. Engineer can refer to `backend/seeds/email-templates.seed.js` for content — copy the HTML there and convert `{{variable}}` merge tags into `${data.variable}` template literals.

- [ ] **Step 4: Verify the registry loads**

Run: `cd backend && node -e "const t = require('./utils/emailTemplates'); console.log(Object.keys(t.templates).length, 'templates'); console.log(t.getTemplate('welcome').subject({}, 'en'))"`
Expected: `9 templates` and the English welcome subject.

- [ ] **Step 5: Commit**

```bash
git add backend/utils/emailTemplates
git commit -m "feat(backend): add file-based email template modules"
```

### Task 22: Rewire emailService.js

**Files:**
- Modify: `backend/utils/emailService.js`

- [ ] **Step 1: Replace DB lookup with file lookup**

In `backend/utils/emailService.js`, replace the DB lookup with the new registry. Keep the function signature identical so all call sites work.

```js
const nodemailer = (() => {
  try { return require('nodemailer'); } catch { return null; }
})();
const { getTemplate } = require('./emailTemplates');

let transporter = null;
function getTransporter() {
  if (!nodemailer || transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    host: process.env.HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
}

async function sendTemplatedEmail(slug, recipient, data = {}, language = 'en') {
  if (!nodemailer) return { sent: false, reason: 'nodemailer-not-installed' };
  const tpl = getTemplate(slug);
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'no-transporter' };
  await t.sendMail({
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: tpl.subject(data, language),
    html: tpl.html(data, language),
  });
  return { sent: true };
}

module.exports = { sendTemplatedEmail };
```

(Adjust to whatever names/exports the existing file uses — keep `sendTemplatedEmail` signature identical so the call sites in order/user/vendor controllers don't need changes.)

- [ ] **Step 2: Sanity load**

Run: `cd backend && node -e "const s = require('./utils/emailService'); console.log(typeof s.sendTemplatedEmail)"`
Expected: `function`

- [ ] **Step 3: Optional smoke test (if EMAIL_* env vars configured)**

Run: `cd backend && node -e "require('./utils/emailService').sendTemplatedEmail('welcome', process.env.EMAIL_USER, { customerName: 'Test User' }, 'en').then(console.log)"`
Expected: `{ sent: true }` and the test user receives the email. If env vars not configured, expect `{ sent: false, reason: 'nodemailer-not-installed' }` or `{ sent: false, reason: 'no-transporter' }` — that's fine.

- [ ] **Step 4: Commit**

```bash
git add backend/utils/emailService.js
git commit -m "refactor(backend): switch email service from DB lookup to file templates"
```

---

## Phase 6 — Data migration

### Task 23: Bulk-approve pending reviews

**Files:** none (DB operation)

- [ ] **Step 1: Confirm Mongo connection string**

The MongoDB target per the project memory: `mongodb://187.124.3.207:27017/shofy`. CONFIRM with the user that this is the correct database before running write commands.

- [ ] **Step 2: Count pending reviews first**

Run via MCP (`mcp__mongodb__find` or equivalent) or `mongosh`:
```js
db.reviews.countDocuments({ status: 'pending' })
```
Note the count — if 0, skip Step 3. If > 0, confirm with user before writing.

- [ ] **Step 3: Bulk update**

```js
db.reviews.updateMany({ status: 'pending' }, { $set: { status: 'approved' } })
```
Expected output: `{ acknowledged: true, matchedCount: N, modifiedCount: N }`

- [ ] **Step 4: No commit needed — DB-only operation**

Document the migration in a note for the eventual PR description (so it's not forgotten in production runbook).

---

## Phase 7 — Verification

### Task 24: Full-stack smoke test

**Files:** none (manual verification)

- [ ] **Step 1: Start all three services**

In separate terminals:
```bash
cd backend && npm run dev          # port 7001
cd crm    && npm run dev           # port 8080
cd frontend && npm run dev          # port 3000
```

(or `cd crm/crm-ui && npm run dev` if the UI runs separately on 3001)

Wait for all three to log "ready".

- [ ] **Step 2: CRM sidebar verification**

Open the CRM in a browser, log in. Verify sidebar shows exactly:
- Dashboard, Products, Categories, Orders, Users, Vendors, Coupons
- CMS submenu: Blog, Banners (no Pages, no Menus)
- Settings submenu: General, Payment, Shipping (no Theme, no Email Templates)
- Activity Log, AI Chatbot

No "Reviews" entry.

- [ ] **Step 3: Storefront homepage verification**

Open `http://localhost:3000`. In DevTools Network tab, filter for "pages" and "menus" — expect zero calls to `/api/v1/store/pages/*` or `/api/v1/store/menus/*`. Homepage should render with banners + categories + featured products + blog + newsletter.

- [ ] **Step 4: Review submission verification**

Log in as a customer on the storefront (any user who has a delivered order). Submit a review on a product. Refresh the product page — the review should appear immediately (no admin moderation step).

- [ ] **Step 5: Email send verification (if configured)**

Place a test order on the storefront. Check the customer's inbox — order confirmation email should arrive. The template comes from `backend/utils/emailTemplates/orderConfirmation.js`.

If email is not configured in the dev environment, skip this and note for the PR.

- [ ] **Step 6: Blog + Banner CRUD still work**

In the CRM:
- Edit a banner — should save.
- Edit a blog post — should save.
- View the changes on the storefront homepage / blog page.

- [ ] **Step 7: Stop all services, commit nothing**

The smoke test is verification only — no code changes.

### Task 25: PR + merge

**Files:** none (git operations)

- [ ] **Step 1: Verify branch state**

Run: `git log main..HEAD --oneline`
Expected: ~15 commits (one per task that had a commit step).

- [ ] **Step 2: Push branch**

```bash
git push -u origin refactor/crm-simplification
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "Simplify CRM: drop unused CMS/Settings/Reviews modules" --body "$(cat <<'EOF'
## Summary
- Removes 7 CRM pages: CMS Pages block editor, CMS Menus tree editor, Settings Theme, Settings Email Templates, Reviews moderation (+ 2 editor sub-pages)
- Auto-approves new reviews (no moderation queue)
- Switches email templates from DB-backed to file-backed (`backend/utils/emailTemplates/`)
- Rewrites storefront homepage to a fixed layout (no CMS block renderer)
- Hardcodes theme CSS variables

Models (`Page`, `Menu`, `EmailTemplate`) intentionally NOT deleted — rollback by reverting commits.

## Spec
docs/superpowers/specs/2026-05-19-crm-simplification-design.md

## Migration
Pre-deploy: `db.reviews.updateMany({ status: 'pending' }, { \$set: { status: 'approved' } })`

## Test plan
- [ ] CRM sidebar matches simplified structure
- [ ] Storefront homepage renders without CMS block API calls
- [ ] New user review appears immediately on product page
- [ ] Order confirmation email sends and uses file-based template
- [ ] Blog and Banner CRUD still work from CRM

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL.

---

## Summary

- 25 tasks, 7 phases.
- Each phase ends with a verified working state.
- Models preserved → fully reversible by `git revert`.
- New behavior: reviews auto-approve, emails from files, storefront homepage fixed-layout.
