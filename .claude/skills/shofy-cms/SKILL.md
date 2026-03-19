---
name: shofy-cms
description: Apply when building any CMS-driven content feature for Shofy (content blocks, page builder, dynamic menus, banners, blog posts). Ensures all content is admin-configurable and follows the CMS architecture.
---

# Shofy CMS Content Block Pattern

## Content Block Architecture
Every storefront page is composed of ordered content blocks stored in MongoDB.

### ContentBlock Schema Pattern
- type: string (hero, featured-products, banner, text, gallery, etc.)
- data: Mixed (flexible JSON per block type)
- order: number (sort position on page)
- page: ObjectId ref to Page
- status: enum [active, draft, scheduled]
- schedule: { startDate, endDate }
- i18n: { en: {}, vi: {} }

### API Pattern
- GET /api/v1/store/pages/:slug → returns page with populated, ordered blocks
- Admin CRUD at /api/v1/admin/pages/:pageId/blocks

### CRM Pattern
- Drag-and-drop block reordering (Ant Design Sortable)
- Block type selector → type-specific form
- Preview button that renders storefront view

### Storefront Pattern
- Dynamic block renderer component
- Switch on block.type → render appropriate component
- SSG with ISR (revalidate on CMS update via webhook)
