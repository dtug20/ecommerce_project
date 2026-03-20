# Shofy CRM — Admin User Guide

## Getting Started

Access the CRM at `http://localhost:8080` (or your configured CRM URL). You'll be redirected to Keycloak for authentication. Only users with `admin`, `manager`, or `staff` roles can access the CRM.

## Dashboard

The dashboard shows key business metrics at a glance:
- **Stats cards**: Total Products, Orders, Monthly Revenue (with % change), Users, Pending Orders, Out of Stock
- **Revenue chart**: Toggle between 7-day, 30-day, and 12-month views
- **Order status pie chart**: Visual breakdown of pending/processing/shipped/delivered/cancelled
- **Top selling products**: Horizontal bar chart of best-sellers by revenue
- **Customer growth**: Area chart showing new user registrations
- **Recent orders**: Quick access to the latest 10 orders
- **Low stock alerts**: Products with quantity <= 10

## Managing Products

### Creating a Product
1. Go to **Products** in the sidebar
2. Click **Add Product**
3. Fill in required fields: Title, Description, Price, Quantity, Product Type, Category, Brand, Image URL
4. Optional: Add variants (SKU, color, size, price, stock), SEO fields, weight/dimensions
5. Click **Save**

### Variants
In the product form, switch to the **Variants** tab to add color/size combinations. Each variant has its own SKU, price, and stock level.

### SEO
Switch to the **SEO** tab to set meta title (70 char max), meta description (160 char max), keywords, and OG image.

## Managing Categories

- View categories in table or **tree view** (toggle in page header)
- Create categories with parent name, children, product type, and status (Show/Hide)
- Categories with products cannot be deleted

## Managing Orders

### Order List
Filter by status, payment method, date range, or search by invoice number/customer name.

### Order Detail
- View customer info, items, amounts
- **Update status**: Change order status (pending → processing → shipped → delivered)
- **Shipping tracking**: Enter carrier, tracking number — tracking URL auto-generates for DHL, FedEx, GHTK, GHN, ViettelPost
- **Order timeline**: Visual history of all status changes

### Email Notifications
When you change order status, customers automatically receive email notifications (shipped, delivered, cancelled).

## Managing Users

- Filter by role (user/admin/vendor), status (active/inactive/blocked), email verification
- View user details and order history
- Change user status (block/unblock)

## Vendor Management

### Vendor Applications
When users apply to become vendors, they appear in **Vendors** with "Pending" status.

### Actions
- **Approve**: Sets user role to "vendor", enables vendor portal access
- **Reject**: Provide a reason — the user sees it in their profile
- **Suspend**: Blocks the vendor account and all their products
- **Edit Commission**: Set the platform commission rate (0-100%)

### Vendor Detail
Click a vendor to see their products, orders, payouts, and performance stats.

### Processing Payouts
When vendors request payouts, review in the Payouts tab and click **Process** to mark as paid with a transaction reference.

## Review Moderation

- **Pending reviews** need approval before appearing on the storefront
- **Approve/Reject** with bulk actions or individually
- **Reply** to reviews — your reply appears on the product page
- Filter by status, rating, product, or search by content

## CMS — Pages (Homepage Builder)

### Editing the Homepage
1. Go to **CMS → Pages**
2. Click the homepage entry
3. Use the three-panel editor:
   - **Left**: Block palette — drag blocks to add
   - **Center**: Block list — reorder and configure
   - **Right**: Block settings panel
4. Available blocks: Hero Slider, Featured Products, Category Showcase, Banner Grid, Text Block, Product Carousel
5. Click **Save** then **Publish**

## CMS — Menus

1. Go to **CMS → Menus**
2. Create menus for locations: `header-main`, `header-categories`, `footer`
3. Use the tree editor to add/nest menu items
4. Items can link to pages, categories, products, or custom URLs

## CMS — Blog

- Create blog posts with rich text content
- Set featured image, category, tags
- Publish/unpublish posts — only published posts appear on the storefront
- Posts have SEO fields and view counters

## CMS — Banners

Create announcement bars, popups, and promotional banners:
- Set scheduling (start/end dates)
- Target specific pages
- Priority ordering

## Settings

### Theme
Customize primary/secondary/accent colors and font family. Changes apply to the storefront in real-time.

### General
Site name, description, logo, favicon, contact info, social links, maintenance mode.

### Payment
Enable/disable payment gateways (COD, Bank Transfer, VNPay, MoMo, Stripe). Set currency.

### Shipping
Configure free shipping threshold, default shipping cost, enabled shipping methods.

### Email Templates
Edit email templates sent to customers:
- **Preview**: See rendered template with sample data
- **Test**: Send a test email to verify formatting
- **Variables**: Insert dynamic fields like `{{customerName}}`, `{{orderNumber}}`
- Templates support English and Vietnamese

## Coupons

Create discount coupons with:
- Percentage discount and minimum order amount
- Start/end dates
- Usage limits (total and per-user)
- Display rules (show on checkout, product page, or banner)
- Product/category targeting and exclusions

## Activity Log

View a chronological log of all admin actions:
- Filter by actor, action type, resource type, date range
- Click any entry to see full details
- Export filtered results as CSV
