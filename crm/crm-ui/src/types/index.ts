// Product
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
  estimatedDelivery?: string;
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
  userId: string;
  productId: string;
  rating: number;
  comment: string;
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

export interface SyncStatus {
  crm: { products: number; categories: number; users: number };
  frontend: { products: number; categories: number; users: number };
  synced: { products: boolean; categories: boolean; users: boolean };
}
