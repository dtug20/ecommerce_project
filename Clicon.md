# Clicon eCommerce — Component Library Guide for Claude Code

> **Purpose**: This document is the single source of truth for building reusable React components for the Clicon eCommerce Marketplace. Feed this file to Claude Code so every component stays consistent in design tokens, naming, file structure, and quality.

---

## 1. Project Overview

**Template**: Clicon — eCommerce Marketplace Website  
**Figma Source**: `https://www.figma.com/design/ZFLy4PFcRWgeux77uOmsOh/Clicon---eCommerce-Marketplace-Website-Figma-Template`  
**Stack**: React 18+ · TypeScript · Tailwind CSS 3 · Lucide React Icons  
**Target**: Reusable component library consumed across all pages (Home, Shop, Product Detail, Cart, Checkout, Dashboard, Blog, Auth).

---

## 2. File & Folder Structure

```
src/
├── tokens/                       # Design tokens
│   ├── colors.ts                 # Color palette constants
│   ├── typography.ts             # Font families, sizes, weights
│   └── spacing.ts                # Spacing scale, border-radius, shadows
│
├── components/
│   ├── atoms/                    # Smallest reusable units
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.stories.tsx  # (optional) Storybook
│   │   │   └── index.ts
│   │   ├── Badge/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── RadioButton/
│   │   ├── StarRating/
│   │   ├── Tag/
│   │   ├── IconButton/
│   │   ├── Avatar/
│   │   ├── Breadcrumb/
│   │   ├── Pagination/
│   │   ├── QuantitySelector/
│   │   ├── PriceDisplay/
│   │   ├── Divider/
│   │   ├── Tooltip/
│   │   ├── Modal/
│   │   ├── Tabs/
│   │   ├── ProgressBar/
│   │   └── CountdownTimer/
│   │
│   ├── composites/               # Combine atoms into meaningful blocks
│   │   ├── ProductCard/
│   │   ├── ProductCardFeatured/
│   │   ├── CategoryCard/
│   │   ├── BannerHero/
│   │   ├── BannerPromo/
│   │   ├── FeatureCard/
│   │   ├── CartItem/
│   │   ├── MiniCart/
│   │   ├── SearchBar/
│   │   ├── NewsletterForm/
│   │   ├── ReviewCard/
│   │   ├── BlogCard/
│   │   ├── OrderStatusStepper/
│   │   ├── AddressCard/
│   │   ├── PaymentMethodCard/
│   │   └── FilterSidebar/
│   │
│   └── layouts/                  # Structural shells shared across pages
│       ├── TopBar/
│       ├── Header/
│       ├── MegaMenu/
│       ├── NavBar/
│       ├── Footer/
│       ├── PageLayout/
│       ├── DashboardLayout/
│       └── AuthLayout/
│
├── hooks/                        # Shared custom hooks
│   ├── useCountdown.ts
│   ├── useClickOutside.ts
│   └── useBreakpoint.ts
│
├── utils/                        # Shared helpers
│   ├── formatPrice.ts
│   └── cn.ts                     # classNames merge utility (clsx + twMerge)
│
└── types/                        # Shared TypeScript types
    ├── product.ts
    ├── cart.ts
    ├── user.ts
    └── order.ts
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component folder | PascalCase | `ProductCard/` |
| Component file | PascalCase | `ProductCard.tsx` |
| Types file | PascalCase + `.types.ts` | `ProductCard.types.ts` |
| Hook | camelCase with `use` prefix | `useCountdown.ts` |
| Utility | camelCase | `formatPrice.ts` |
| CSS class (Tailwind) | kebab-case via Tailwind | `text-gray-900` |
| Token constant | UPPER_SNAKE for raw, camelCase for objects | `PRIMARY_ORANGE`, `colors.primary` |

---

## 3. Design Tokens

All components MUST reference these tokens. Never hardcode hex values or pixel sizes directly in components.

### 3.1 Colors

```ts
// tokens/colors.ts
export const colors = {
  primary:   '#FA8232',  // Orange — CTAs, active states, prices
  secondary: '#2DA5F3',  // Blue — links, info badges

  // Semantic
  success:   '#2DB224',  // In stock, success messages
  warning:   '#EFD33D',  // Star ratings, caution
  danger:    '#EE5858',  // Errors, out-of-stock, delete

  // Neutrals (Gray scale)
  gray: {
    900: '#191C1F',  // Primary text, headings
    800: '#303639',  // Secondary text
    700: '#475156',  // Body text
    600: '#5F6C72',  // Placeholder text, captions
    500: '#77878F',  // Disabled text
    400: '#929FA5',  // Borders (active)
    300: '#ADB7BC',  // Borders (default)
    200: '#C9CFD2',  // Dividers
    100: '#E4E7E9',  // Input borders, card borders
    50:  '#F2F4F6',  // Background tint, hover states
  },

  white:     '#FFFFFF',
  black:     '#000000',

  // Rating stars
  starFilled:  '#EFD33D',
  starEmpty:   '#C9CFD2',
} as const;
```

### 3.2 Typography

```ts
// tokens/typography.ts
export const typography = {
  fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  fontSize: {
    xs:   '0.6875rem',  // 11px — tiny labels
    sm:   '0.75rem',    // 12px — captions, badges
    base: '0.875rem',   // 14px — body text
    md:   '1rem',       // 16px — large body
    lg:   '1.125rem',   // 18px — subtitles
    xl:   '1.25rem',    // 20px — card titles
    '2xl': '1.5rem',    // 24px — section headings
    '3xl': '2rem',      // 32px — page headings
    '4xl': '2.5rem',    // 40px — hero heading
  },

  fontWeight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  lineHeight: {
    tight:  1.2,   // headings
    snug:   1.4,   // subheadings
    normal: 1.5,   // body text
    relaxed: 1.6,  // large body
  },
} as const;
```

### 3.3 Spacing, Radius & Shadows

```ts
// tokens/spacing.ts
export const spacing = {
  0:  '0px',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const borderRadius = {
  none: '0px',
  sm:   '2px',   // Badges, tags
  md:   '4px',   // Buttons, inputs, cards
  lg:   '8px',   // Modals, large cards
  full: '9999px', // Avatars, pills
} as const;

export const shadows = {
  sm:  '0 1px 2px rgba(0, 0, 0, 0.06)',
  md:  '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg:  '0 4px 16px rgba(0, 0, 0, 0.12)',
  xl:  '0 8px 32px rgba(0, 0, 0, 0.16)',
} as const;

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1440px',  // Max container width
} as const;
```

### 3.4 Tailwind Config Extension

Make sure `tailwind.config.ts` extends with these tokens:

```ts
// tailwind.config.ts  (key overrides only)
export default {
  theme: {
    extend: {
      colors: {
        primary:   '#FA8232',
        secondary: '#2DA5F3',
        success:   '#2DB224',
        warning:   '#EFD33D',
        danger:    '#EE5858',
        gray: { /* full scale from tokens */ },
      },
      fontFamily: {
        sans: ['Public Sans', 'sans-serif'],
      },
      maxWidth: {
        container: '1440px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 2px 8px rgba(0,0,0,0.08)',
        lg: '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
};
```

---

## 4. Component Specifications

### 4.1 Atoms — Full API Reference

#### Button

```tsx
interface ButtonProps {
  variant: 'primary' | 'outlined' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | `#FA8232` | `#FFFFFF` | none | darken 10% |
| `outlined` | transparent | `#FA8232` | `1px #FA8232` | fill `#FA8232`, text white |
| `ghost` | transparent | `#FA8232` | none | bg `#FA8232/10` |
| `danger` | `#EE5858` | `#FFFFFF` | none | darken 10% |

| Size | Height | Padding (x) | Font size | Border radius |
|------|--------|-------------|-----------|---------------|
| `sm` | 36px | 16px | 14px | 4px |
| `md` | 44px | 24px | 14px | 4px |
| `lg` | 52px | 32px | 16px | 4px |

**States**: default, hover, active (scale 0.98), focus (ring `#FA8232` 2px offset), disabled (opacity 0.5), loading (spinner replaces text).

---

#### Badge

```tsx
interface BadgeProps {
  variant: 'hot' | 'sale' | 'sold-out' | 'best-deal' | 'discount';
  discountPercent?: number;  // Required when variant='discount'
}
```

| Variant | Background | Text | Label |
|---------|-----------|------|-------|
| `hot` | `#EE5858` | `#FFF` | `HOT` |
| `sale` | `#2DB224` | `#FFF` | `SALE` |
| `sold-out` | `#303639` | `#FFF` | `SOLD OUT` |
| `best-deal` | `#2DA5F3` | `#FFF` | `BEST DEAL` |
| `discount` | `#EFD33D` | `#191C1F` | `{n}% OFF` |

Style: `padding: 4px 10px`, `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `border-radius: 2px`.

---

#### Input

```tsx
interface InputProps {
  type: 'text' | 'password' | 'email' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}
```

Style: height `44px`, border `1px solid #E4E7E9`, radius `4px`, padding `0 16px`, font-size `14px`.  
**Focus**: border `#FA8232`, ring `0 0 0 2px rgba(250,130,50,0.15)`.  
**Error**: border `#EE5858`, helper text in red below.

---

#### StarRating

```tsx
interface StarRatingProps {
  value: number;           // 0–5, supports 0.5 increments
  max?: number;            // default 5
  size?: 'sm' | 'md';     // sm=16px, md=20px
  interactive?: boolean;   // clickable for reviews
  count?: number;          // e.g. "(738)" review count
  onChange?: (value: number) => void;
}
```

Uses `#EFD33D` filled, `#C9CFD2` empty. Gap between stars: `2px`.

---

#### PriceDisplay

```tsx
interface PriceDisplayProps {
  currentPrice: number;
  originalPrice?: number;       // shows strikethrough if present
  discountPercent?: number;     // auto-calculated if not provided
  size?: 'sm' | 'md' | 'lg';
  currency?: string;            // default '$'
}
```

| Size | Current price | Original price | Discount badge |
|------|--------------|----------------|----------------|
| `sm` | 14px, `#191C1F`, semibold | 12px, `#77878F`, line-through | — |
| `md` | 16px, `#191C1F`, bold | 14px, `#77878F`, line-through | 12px, `#2DB224` |
| `lg` | 24px, `#2DA5F3`, bold | 16px, `#77878F`, line-through | 14px badge |

---

#### QuantitySelector

```tsx
interface QuantitySelectorProps {
  value: number;
  min?: number;    // default 1
  max?: number;    // default 99
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

Layout: `[-] [input] [+]`, height `36px`. Buttons are `36×36px` squares with `#E4E7E9` border. Disabled buttons at min/max.

---

#### Pagination

```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;  // default 1
}
```

Active page: `bg #FA8232`, text white. Others: `bg transparent`, text `#475156`. Each cell `40×40px`, radius `4px`, gap `8px`.

---

#### CountdownTimer

```tsx
interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}
```

Shows boxes for Days / Hours / Minutes / Seconds. Box style: `bg #F2F4F6`, `padding 8px 12px`, `font-size 20px bold`, label below in `11px #5F6C72`.

---

#### Tabs

```tsx
interface TabsProps {
  items: { key: string; label: string; content: React.ReactNode }[];
  defaultActiveKey?: string;
  variant?: 'underline' | 'pill';
}
```

**Underline**: active tab has `border-bottom 2px #FA8232`, text `#FA8232`, others text `#5F6C72`.  
**Pill**: active tab has `bg #FA8232`, text white, radius `full`.

---

#### Modal

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';  // 400px / 560px / 720px max-width
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

Overlay: `bg black/50`, centered content, radius `8px`, padding `24px`. Close button top-right `X` icon.

---

### 4.2 Composites — Full API Reference

#### ProductCard

The most reused component across the entire site.

```tsx
interface ProductCardProps {
  product: {
    id: string;
    title: string;
    image: string;
    currentPrice: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    badge?: 'hot' | 'sale' | 'sold-out' | 'best-deal' | 'discount';
    discountPercent?: number;
  };
  variant: 'grid' | 'list' | 'compact';
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  onQuickView?: (id: string) => void;
  onCompare?: (id: string) => void;
}
```

**Grid variant** (default, used on Home & Shop):
- Card: `border 1px #E4E7E9`, `radius 4px`, `bg white`
- Image area: `aspect-ratio 1/1`, `bg #F2F4F6`, `padding 16px`, image centered contain
- Badge: absolute top-left, `8px` offset
- Hover overlay: action icons (heart, eye, compare) fade in on image hover
- Content area: `padding 16px`
  - Title: `14px`, `#191C1F`, `font-weight 400`, max 2 lines (line-clamp)
  - Rating: StarRating `sm` + count
  - Price: PriceDisplay `sm`

**List variant** (Shop list view):
- Horizontal layout: image left (`200×200px`), content right
- Title: `16px`, `font-weight 600`
- Shows short description (2 lines)
- Action buttons row at bottom

**Compact variant** (Best Deals sidebar):
- Smaller image (`80×80px`), title + price only

---

#### CartItem

```tsx
interface CartItemProps {
  item: {
    id: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    variant?: string;  // e.g. "Space Gray, 256GB"
  };
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}
```

Layout: `[image 80×80] [title + variant] [quantity selector] [line total] [X remove]`.  
Border-bottom `1px #E4E7E9` as separator between items.

---

#### SearchBar

```tsx
interface SearchBarProps {
  categories?: { value: string; label: string }[];
  onSearch: (query: string, category?: string) => void;
  placeholder?: string;
}
```

Layout: `[category dropdown | search input | search button]`.  
Combined border: `2px #FA8232`, radius `4px`.  
Dropdown: `bg #F2F4F6`, `border-right 1px #E4E7E9`.  
Search button: `bg #FA8232`, `44px square`, white search icon.

---

#### FilterSidebar

```tsx
interface FilterSidebarProps {
  categories: { name: string; count: number; subcategories?: ... }[];
  priceRange: { min: number; max: number };
  brands: { name: string; count: number }[];
  onFilterChange: (filters: FilterState) => void;
}
```

Sections separated by `Divider`. Each section: title `16px semibold`, collapsible. 
Price range: dual-thumb slider with min/max inputs.
Checkboxes for brands with count badges.

---

#### BlogCard

```tsx
interface BlogCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    thumbnail: string;
    category: string;
    date: string;
    author: { name: string; avatar: string };
  };
  variant?: 'default' | 'horizontal';
}
```

Default: vertical card with image top, content bottom.  
Horizontal: image left `(260×180px)`, content right.

---

### 4.3 Layouts — Full API Reference

#### TopBar

Fixed utility strip at the very top.

```
[Welcome to Clicon...]  [Follow us: social icons]  [Language ▾]  [Currency ▾]
```

Height: `36px`. Background: `#1B6392` (dark blue). Text: `white`, `12px`.

---

#### Header

Main navigation header.

```
[Logo]  [SearchBar (expanded)]  [Compare icon + count]  [Wishlist icon + count]  [Cart icon + count]  [User avatar / Sign In]
```

Height: `80px`. Background: `#1B6392`. Logo left, actions right.  
Icon buttons: `white`, `24px`, with `badge count` as `12px` circle `#FA8232`.

---

#### NavBar

Secondary navigation below Header.

```
[☰ All Category (MegaMenu trigger)]  [Track Order]  [Compare]  [Customer Support]  [...phone number right-aligned]
```

Height: `48px`. Background: `#FFFFFF`, border-bottom `1px #E4E7E9`.

---

#### Footer

4-column layout:

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Logo, tagline, customer support info, social icons | TOP CATEGORIES: list of links | QUICK LINKS: list of links | DOWNLOAD APP: App Store + Google Play badges, Popular Tags |

Background: `#191C1F` (near black). Text: `#77878F`. Links hover: `#FA8232`.  
Bottom strip: `border-top 1px #303639`, copyright text centered.

---

#### PageLayout

Wraps every public page.

```tsx
interface PageLayoutProps {
  breadcrumbs?: { label: string; href: string }[];
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}
```

Structure: `TopBar → Header → NavBar → Breadcrumb → [sidebar? + main content] → Footer`.  
Max container width: `1440px`, centered, `padding 0 16px`.

---

#### DashboardLayout

For account pages (order history, settings, address book, etc.).

```tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

Left sidebar `(248px)`: user avatar + name, navigation links (Dashboard, Order History, Track Order, Shopping Cart, Wishlist, Compare, Cards & Addresses, Browsing History, Settings).  
Active link: `bg #FA8232`, text white, `radius 4px`.  
Right content: remaining width with `padding-left 24px`.

---

#### AuthLayout

Centered card for Sign In, Sign Up, Forgot Password, Verify.

```tsx
interface AuthLayoutProps {
  children: React.ReactNode;
}
```

Full page `bg #F2F4F6`. Centered card `max-width 424px`, `bg white`, `padding 32px`, `radius 8px`, `shadow lg`.
Logo centered above form.

---

## 5. Component Implementation Rules

These rules MUST be followed for every component:

### 5.1 General Rules

1. **TypeScript strict mode** — no `any` types, export all interfaces from `.types.ts`
2. **Functional components only** — use hooks, never class components
3. **Forward refs** — all interactive atoms must use `React.forwardRef`
4. **Default exports** — each component folder has `index.ts` with named re-export
5. **No inline styles** — use Tailwind classes exclusively; use `cn()` utility for conditional classes
6. **Accessible by default** — proper `aria-*` attributes, keyboard navigation, focus management
7. **Responsive** — mobile-first; test at `375px`, `768px`, `1024px`, `1440px`

### 5.2 Tailwind Rules

```tsx
// Use the cn() utility for conditional classes
import { cn } from '@/utils/cn';

// cn.ts implementation:
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in components:
<button className={cn(
  'inline-flex items-center justify-center font-semibold transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  variant === 'primary' && 'bg-primary text-white hover:bg-primary/90',
  variant === 'outlined' && 'border border-primary text-primary hover:bg-primary hover:text-white',
  size === 'sm' && 'h-9 px-4 text-sm rounded',
  size === 'md' && 'h-11 px-6 text-sm rounded',
  disabled && 'opacity-50 cursor-not-allowed',
  className  // always allow className override as last
)}>
```

### 5.3 Icon Usage

Use **Lucide React** for all icons. Map Clicon's icons to the closest Lucide equivalent:

```tsx
import {
  Heart, ShoppingCart, Eye, GitCompare, Search, X, ChevronDown,
  ChevronLeft, ChevronRight, Star, Truck, RotateCcw, CreditCard,
  Headphones, MapPin, Phone, Mail, Facebook, Twitter, Instagram,
  Youtube, Minus, Plus, Trash2, Edit, User, Package, Clock,
  ArrowRight, Menu, Grid, List,
} from 'lucide-react';
```

Default icon sizes: `16px` (sm), `20px` (md), `24px` (lg).

### 5.4 Image Handling

- All product images use `next/image` (if Next.js) or `<img>` with lazy loading
- Placeholder: solid `#F2F4F6` background while loading
- Aspect ratios: product cards `1:1`, banners `16:9` or `3:1`, blog thumbnails `16:10`
- Always include `alt` text from product title

### 5.5 Animation & Transitions

Keep animations subtle and fast:

```css
/* Standard transition for all interactive elements */
transition: all 150ms ease-in-out;

/* Hover effects */
.product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.product-card:hover .action-icons { opacity: 1; transform: translateY(0); }

/* Modal entry */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(16px); } to { transform: translateY(0); } }
```

---

## 6. Build Priority

### Sprint 1 — Foundation (Week 1–2)

Build order matters — later components depend on earlier ones.

```
Step 1:  tokens/ (colors, typography, spacing) + tailwind.config.ts
Step 2:  cn() utility + shared types (product.ts, cart.ts)
Step 3:  Button → Input → Badge → StarRating → IconButton
Step 4:  PriceDisplay → QuantitySelector → Breadcrumb → Pagination
Step 5:  ProductCard (grid variant first, then list, then compact)
```

**Milestone**: Render a grid of ProductCards with all atoms working.

### Sprint 2 — Page Shell (Week 3–4)

```
Step 6:  TopBar → Header (with SearchBar + MiniCart integrated)
Step 7:  NavBar + MegaMenu
Step 8:  Footer
Step 9:  PageLayout (compose TopBar + Header + NavBar + Footer)
Step 10: CategoryCard → FeatureCard → BannerHero → BannerPromo
```

**Milestone**: Full Home page renders with layout + hero + categories + featured products.

### Sprint 3 — Features (Week 5–6)

```
Step 11: FilterSidebar → Tabs → Modal
Step 12: CartItem → full Cart page
Step 13: ReviewCard → Product Detail page tabs
Step 14: BlogCard → Blog listing
Step 15: DashboardLayout + AuthLayout
Step 16: OrderStatusStepper → AddressCard → PaymentMethodCard
Step 17: CountdownTimer → NewsletterForm → Divider → Tooltip
```

**Milestone**: All pages functional with real component composition.

---

## 7. Quality Checklist

Before marking any component as "done", verify:

- [ ] **Props**: All required props documented with TypeScript interfaces
- [ ] **Variants**: Every variant visually matches the Figma design
- [ ] **States**: Default, hover, active, focus, disabled, loading (where applicable)
- [ ] **Responsive**: Tested at 375px, 768px, 1024px, 1440px
- [ ] **Accessibility**: Keyboard navigable, screen reader tested, proper ARIA
- [ ] **Dark mode**: Not required for V1, but tokens must support future extension
- [ ] **Performance**: No unnecessary re-renders, images lazy-loaded, lists virtualized if >50 items
- [ ] **Edge cases**: Empty states, long text truncation, missing images, zero values

---

## 8. Figma-to-Code Reference

When extracting details from the Figma file, use these node references:

| Page Section | Figma Node Area | Key Details |
|-------------|----------------|-------------|
| Home Hero Banner | Top of Homepage | Slider with Xbox console, price badge, CTA |
| Feature Strip | Below hero | 4 icons: delivery, returns, payment, support |
| Best Deals | Homepage mid | Countdown + large featured card + product grid |
| Category Section | Homepage mid | Scrollable category cards with icons |
| Product Grid | Homepage / Shop | 4-column grid of ProductCards |
| Product Detail | Product page | Image gallery + variant selectors + reviews tabs |
| Cart Page | Shopping Cart | CartItem list + order summary sidebar |
| Checkout | Checkout page | 2-column: billing form + order summary |
| Dashboard | Account pages | Sidebar nav + content area |
| Auth Forms | Sign In / Sign Up | Centered card with form fields |

For any component where the Figma details are unclear, use the Figma MCP tool:

```
Figma:get_design_context
  fileKey: ZFLy4PFcRWgeux77uOmsOh
  nodeId: <target-node-id>
```

---

## 9. Shared Utilities

### formatPrice

```ts
// utils/formatPrice.ts
export function formatPrice(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

### useCountdown

```ts
// hooks/useCountdown.ts
export function useCountdown(targetDate: Date) {
  // Returns { days, hours, minutes, seconds, isExpired }
  // Updates every second via setInterval
  // Cleans up on unmount
}
```

### useClickOutside

```ts
// hooks/useClickOutside.ts
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  // Used by: MegaMenu, MiniCart, Dropdown, Modal
}
```

---

## 10. Page Composition Examples

### Home Page

```tsx
<PageLayout>
  <BannerHero slides={heroSlides} />
  <div className="grid grid-cols-2 gap-6">
    <BannerPromo variant="horizontal" {...googlePixelPromo} />
    <BannerPromo variant="vertical" {...airpodsPromo} />
  </div>
  <FeatureStrip features={features} />
  <section>
    <SectionHeader title="Best Deals" countdown={dealEndDate} />
    <div className="grid grid-cols-[1fr_3fr]">
      <ProductCardFeatured product={featuredDeal} />
      <ProductGrid products={dealProducts} columns={4} />
    </div>
  </section>
  <CategorySection categories={categories} />
  <section>
    <SectionHeader title="Featured Products" tabs={['All', 'Phones', 'Laptops']} />
    <ProductGrid products={featuredProducts} columns={4} />
  </section>
  <NewsletterForm variant="inline" />
</PageLayout>
```

### Shop Page

```tsx
<PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}>
  <div className="grid grid-cols-[248px_1fr] gap-6">
    <FilterSidebar {...filters} onFilterChange={handleFilter} />
    <div>
      <ShopToolbar
        viewMode={viewMode}
        sortBy={sortBy}
        resultCount={totalProducts}
      />
      <ProductGrid
        products={products}
        columns={viewMode === 'grid' ? 3 : 1}
        variant={viewMode}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  </div>
</PageLayout>
```

---

*Last updated: March 2026*  
*Template version: Clicon eCommerce Marketplace v1.0*