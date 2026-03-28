// Product
export interface ProductVariant {
  _id?: string;
  sku: string;
  color: { name: string; clrCode: string };
  size: string;
  price: number;
  stock: number;
  images?: string[];
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

export interface Product {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  img?: string;
  price: number;
  discount?: number;
  quantity: number;
  shipping?: number;
  category?: { _id: string; parent: string };
  brand?: { _id: string; name: string };
  status: string;
  featured?: boolean;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  productType?: string;
  sellCount?: number;
  reviews?: Review[];
  variants?: ProductVariant[];
  seo?: ProductSeo;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  _id: string;
  parent: string;
  children: string[];
  productType: string;
  img?: string;
  description?: string;
  products?: string[];
  status: 'Show' | 'Hide';
  featured?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// Order
export interface OrderStatusHistory {
  status: string;
  timestamp: string;
  updatedBy?: string;
  note?: string;
}

export interface Order {
  _id: string;
  invoice?: number;
  orderNumber?: string;
  user?: { _id: string; name: string; email: string };
  name?: string;
  email?: string;
  contact?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  cart?: OrderItem[];
  products?: OrderItem[];
  subTotal?: number;
  totalAmount?: number;
  finalAmount?: number;
  shippingCost?: number;
  discount?: number;
  tax?: number;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus?: string;
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  shipper?: { _id: string; name: string; email?: string };
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  statusHistory?: OrderStatusHistory[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id?: string;
  title: string;
  img?: string;
  image?: string;
  price: number;
  quantity?: number;
  orderQuantity?: number;
  color?: string;
  size?: string;
}

// User
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  emailVerified?: boolean;
  lastLogin?: string;
  orders?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Review
export interface Review {
  _id: string;
  userId: { _id: string; name: string; email: string; imageURL?: string };
  productId: { _id: string; title: string; img?: string; slug?: string };
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  isVerifiedPurchase: boolean;
  helpful?: { count: number };
  adminReply?: { text: string; repliedAt: string; repliedBy: string };
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

// Stats types
export interface ProductStats {
  totalProducts: number;
  activeProducts?: number;
  lowStockProducts?: number;
  outOfStockProducts?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders?: number;
  processingOrders?: number;
  shippedOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalRevenue?: number;
  monthlyStats?: MonthlyStats[];
}

export interface MonthlyStats {
  _id: { year: number; month: number };
  totalRevenue: number;
  totalOrders: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers?: number;
  inactiveUsers?: number;
  blockedUsers?: number;
}

export interface CategoryStats {
  totalCategories: number;
  productTypeStats?: { _id: string; count: number }[];
}

// ---------------------------------------------------------------------------
// CMS Types
// ---------------------------------------------------------------------------

export interface ContentBlock {
  _id?: string;
  blockType: string;
  title?: string;
  subtitle?: string;
  order: number;
  settings: Record<string, unknown>;
  isVisible: boolean;
  visibleFrom?: string;
  visibleUntil?: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  type: 'home' | 'landing' | 'custom';
  status: 'draft' | 'published' | 'archived';
  blocks: ContentBlock[];
  seo: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  publishedAt?: string;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  _id?: string;
  label: string;
  labelVi?: string;
  type: 'link' | 'page' | 'category' | 'product' | 'custom';
  url?: string;
  target?: '_self' | '_blank';
  reference?: { model?: string; id?: string };
  icon?: string;
  image?: string;
  children: MenuItem[];
  order: number;
  isVisible: boolean;
}

export interface CmsMenu {
  _id: string;
  name: string;
  slug: string;
  location: string;
  items: MenuItem[];
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerContent {
  text?: string;
  textVi?: string;
  buttonText?: string;
  buttonTextVi?: string;
  buttonUrl?: string;
  image?: string;
  imageMobile?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface Banner {
  _id: string;
  title: string;
  type: 'announcement-bar' | 'popup' | 'hero-slide' | 'promotional-banner' | 'category-banner';
  content: BannerContent;
  scheduling: { startDate?: string; endDate?: string; isAlwaysActive: boolean };
  targeting: { pages: string[]; userSegments: string[] };
  position?: string;
  priority: number;
  status: 'active' | 'inactive' | 'scheduled';
  dismissible: boolean;
  analytics: { impressions: number; clicks: number; dismissals: number };
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  author: { _id: string; name: string };
  category?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views: number;
  publishedAt?: string;
  seo: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  i18n: { titleVi?: string; excerptVi?: string; contentVi?: string };
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  _id?: string;
  siteName: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  ogImage?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    headerStyle: string;
    footerStyle: string;
  };
  contact: {
    email?: string;
    phone?: string;
    address?: string;
    socialLinks: Array<{ platform: string; url: string }>;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    enabledMethods: string[];
  };
  payment: {
    enabledGateways: string[];
    currency: string;
    currencySymbol: string;
  };
  seo: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultKeywords: string[];
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  maintenance: {
    isEnabled: boolean;
    message?: string;
  };
  i18n: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export interface VendorProfile {
  storeName?: string;
  storeSlug?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription?: string;
  commissionRate: number;
  bankInfo?: Record<string, unknown>;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
}

export interface Vendor extends User {
  vendorProfile?: VendorProfile;
}

export interface VendorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export interface Payout {
  _id: string;
  vendor: string | { _id: string; name: string };
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  bankDetails?: Record<string, unknown>;
  transactionRef?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  note?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export interface ActivityLogEntry {
  _id: string;
  actor: { id: string; name: string; role: string; type: string };
  action: string;
  resource: { type: string; id?: string; name?: string };
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Email Template
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  _id: string;
  name: string;
  slug: string;
  type: string;
  subject: string;
  subjectVi?: string;
  body: string;
  bodyVi?: string;
  variables: string[];
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface DashboardAnalytics {
  todayRevenue: number;
  yesterdayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalUsers: number;
  revenueChange: number;
}

export interface RevenueDataPoint {
  // legacy shape
  _id?: string;
  revenue?: number;
  orders?: number;
  // backend v1 shape (varies by groupBy)
  date?: string;
  week?: string;
  month?: string;
  orderCount?: number;
}

// Backend wraps revenue + growth rows in { groupBy, rows }
export interface RevenueResponse {
  groupBy: string;
  rows: RevenueDataPoint[];
}

export interface TopProduct {
  _id: string;
  title: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
}

export interface CustomerGrowthPoint {
  // legacy shape
  _id?: string;
  count?: number;
  // backend v1 shape
  month?: string;
  week?: string;
  newUsers?: number;
}

export interface CustomerGrowthResponse {
  groupBy: string;
  rows: CustomerGrowthPoint[];
}

export interface Coupon {
  _id: string;
  title: string;
  logo?: string;
  couponCode: string;
  startTime: string;
  endTime: string;
  discountPercentage: number;
  minimumAmount: number;
  productType: string;
  status: 'active' | 'inactive';
  usageLimit?: number;
  usageCount?: number;
  perUserLimit?: number;
  displayRules?: {
    showOnBanner?: boolean;
    showOnCheckout?: boolean;
    showOnProductPage?: boolean;
    targetPages?: string[];
  };
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  usedBy?: Array<{ userId: string; usedAt: string }>;
  createdAt: string;
  updatedAt: string;
}
