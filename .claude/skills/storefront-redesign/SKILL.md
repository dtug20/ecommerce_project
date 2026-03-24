---
name: storefront-redesign
description: Apply when building or redesigning any Shofy storefront component. Ensures consistent design system, Bootstrap 5 patterns, i18n, and accessibility standards.
---
 
# Shofy Storefront Design System
 
## CSS Variables (defined in _variables.scss, values from CMS SiteSettings)
```scss
:root {
  // Brand (from CMS — these are defaults, overridden by JS from API)
  --tp-theme-primary: #a42c48;
  --tp-theme-secondary: #821f38;
  --tp-theme-accent: #0989FF;
 
  // Neutrals (fixed)
  --tp-gray-50: #f9fafb;
  --tp-gray-100: #f3f4f6;
  --tp-gray-200: #e5e7eb;
  --tp-gray-300: #d1d5db;
  --tp-gray-500: #6b7280;
  --tp-gray-700: #374151;
  --tp-gray-900: #111827;
 
  // Semantic
  --tp-success: #22c55e;
  --tp-error: #ef4444;
  --tp-warning: #f59e0b;
  --tp-info: #3b82f6;
 
  // Typography
  --tp-ff-body: 'Jost', sans-serif;
  --tp-fs-base: 15px;
  --tp-fs-sm: 13px;
  --tp-fs-lg: 18px;
  --tp-fs-xl: 24px;
  --tp-fs-2xl: 32px;
 
  // Spacing
  --tp-spacing-xs: 4px;
  --tp-spacing-sm: 8px;
  --tp-spacing-md: 16px;
  --tp-spacing-lg: 24px;
  --tp-spacing-xl: 32px;
  --tp-spacing-2xl: 48px;
 
  // Shapes
  --tp-radius-sm: 4px;
  --tp-radius-md: 8px;
  --tp-radius-lg: 12px;
  --tp-radius-full: 9999px;
  --tp-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --tp-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --tp-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```
 
## Product Card Pattern
```html
<div class="product-card h-100">
  <div class="product-card__image position-relative">
    <Image src={img} width={300} height={300} alt={title} class="img-fluid" />
    <div class="product-card__badges">
      {discount > 0 && <span class="badge bg-danger">-{discount}%</span>}
      {isNew && <span class="badge bg-success">New</span>}
    </div>
    <div class="product-card__actions">
      <button class="btn btn-sm" aria-label="Quick view">👁</button>
      <button class="btn btn-sm" aria-label="Add to wishlist">♡</button>
    </div>
  </div>
  <div class="product-card__body p-3">
    <p class="product-card__category text-muted small mb-1">{category}</p>
    <h3 class="product-card__title fs-6 fw-medium mb-2 text-truncate-2">{title}</h3>
    <div class="product-card__price">
      <span class="fw-bold text-primary">${finalPrice}</span>
      {discount > 0 && <span class="text-decoration-line-through text-muted ms-2 small">${price}</span>}
    </div>
    {vendor && <p class="small text-muted mt-1">Sold by <a href={vendorUrl}>{vendorName}</a></p>}
    <div class="product-card__rating mt-2">
      <StarRating value={rating} /> <span class="text-muted small">({reviewCount})</span>
    </div>
  </div>
  <div class="product-card__footer p-3 pt-0">
    <button class="btn btn-primary w-100 btn-sm">Add to Cart</button>
  </div>
</div>
```
 
## Loading Skeleton Pattern
```jsx
function ProductCardSkeleton() {
  return (
    <div class="product-card h-100">
      <div class="placeholder-glow">
        <div class="placeholder ratio ratio-1x1 rounded-top"></div>
        <div class="p-3">
          <div class="placeholder col-4 mb-2"></div>
          <div class="placeholder col-8 mb-2"></div>
          <div class="placeholder col-5"></div>
        </div>
      </div>
    </div>
  );
}
```
 
## Empty State Pattern
```jsx
function EmptyState({ icon, title, description, actionText, actionHref }) {
  return (
    <div class="text-center py-5">
      <div class="mb-3 text-muted" style={{fontSize: '48px'}}>{icon}</div>
      <h5>{title}</h5>
      <p class="text-muted">{description}</p>
      {actionText && <Link href={actionHref} class="btn btn-primary">{actionText}</Link>}
    </div>
  );
}
```
 
## Responsive Grid
- Products: `col-6 col-md-4 col-lg-3` (2 mobile, 3 tablet, 4 desktop)
- Blog cards: `col-12 col-md-6 col-lg-4` (1 mobile, 2 tablet, 3 desktop)
- Category tiles: `col-4 col-md-3 col-lg-2` (3 mobile, 4 tablet, 6 desktop)
