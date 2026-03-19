import axios from 'axios';
import type {
  ApiResponse,
  Product,
  ProductStats,
  Category,
  CategoryStats,
  Order,
  OrderStats,
  User,
  UserStats,
  SyncStatus,
  Page,
  ContentBlock,
  CmsMenu,
  Banner,
  BlogPost,
  SiteSettings,
  Coupon,
  Review,
} from '@/types/index';

// Axios instance with relative baseURL — proxied by Vite to the CRM backend
const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  brand?: string;
  productType?: string;
  sort?: string;
}

export const productsApi = {
  getAll: (params?: ProductQuery) =>
    api.get<ApiResponse<Product[]>>('/api/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/api/products/${id}`).then((r) => r.data),

  create: (data: Partial<Product>) =>
    api.post<ApiResponse<Product>>('/api/products', data).then((r) => r.data),

  update: (id: string, data: Partial<Product>) =>
    api.put<ApiResponse<Product>>(`/api/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/products/${id}`).then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<ProductStats>>('/api/products/stats').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  productType?: string;
}

export const categoriesApi = {
  getAll: (params?: CategoryQuery) =>
    api.get<ApiResponse<Category[]>>('/api/categories', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Category>>(`/api/categories/${id}`).then((r) => r.data),

  create: (data: Partial<Category>) =>
    api.post<ApiResponse<Category>>('/api/categories', data).then((r) => r.data),

  update: (id: string, data: Partial<Category>) =>
    api.put<ApiResponse<Category>>(`/api/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/categories/${id}`).then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<CategoryStats>>('/api/categories/stats').then((r) => r.data),

  getTree: () =>
    api.get<ApiResponse<Category[]>>('/api/categories/tree').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export const ordersApi = {
  getAll: (params?: OrderQuery) =>
    api.get<ApiResponse<Order[]>>('/api/orders', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`).then((r) => r.data),

  create: (data: Partial<Order>) =>
    api.post<ApiResponse<Order>>('/api/orders', data).then((r) => r.data),

  update: (id: string, data: Partial<Order>) =>
    api.put<ApiResponse<Order>>(`/api/orders/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api
      .patch<ApiResponse<Order>>(`/api/orders/${id}/status`, { status })
      .then((r) => r.data),

  updateTracking: (
    id: string,
    data: {
      trackingNumber?: string;
      carrier?: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
    },
  ) => api.patch<ApiResponse<Order>>(`/api/orders/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/orders/${id}`).then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<OrderStats>>('/api/orders/stats').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  sort?: string;
}

export const usersApi = {
  getAll: (params?: UserQuery) =>
    api.get<ApiResponse<User[]>>('/api/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/api/users/${id}`).then((r) => r.data),

  create: (data: Partial<User>) =>
    api.post<ApiResponse<User>>('/api/users', data).then((r) => r.data),

  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/api/users/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api
      .patch<ApiResponse<User>>(`/api/users/${id}/status`, { status })
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/users/${id}`).then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<UserStats>>('/api/users/stats').then((r) => r.data),

  getUserOrders: (id: string, params?: { page?: number; limit?: number }) =>
    api
      .get<ApiResponse<Order[]>>(`/api/users/${id}/orders`, { params })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
}

export const syncApi = {
  syncAll: () =>
    api.post<ApiResponse<SyncResult>>('/api/sync/sync-all').then((r) => r.data),

  syncProducts: () =>
    api.post<ApiResponse<SyncResult>>('/api/sync/sync-products').then((r) => r.data),

  syncCategories: () =>
    api.post<ApiResponse<SyncResult>>('/api/sync/sync-categories').then((r) => r.data),

  syncUsers: () =>
    api.post<ApiResponse<SyncResult>>('/api/sync/sync-users').then((r) => r.data),

  getSyncStatus: () =>
    api.get<ApiResponse<SyncStatus>>('/api/sync/sync-status').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// CMS — Pages
// ---------------------------------------------------------------------------
export const pagesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<ApiResponse<Page[]>>('/api/cms/pages', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Page>>(`/api/cms/pages/${id}`).then(r => r.data),
  create: (data: Partial<Page>) =>
    api.post<ApiResponse<Page>>('/api/cms/pages', data).then(r => r.data),
  update: (id: string, data: Partial<Page>) =>
    api.patch<ApiResponse<Page>>(`/api/cms/pages/${id}`, data).then(r => r.data),
  updateBlocks: (id: string, blocks: ContentBlock[]) =>
    api.patch<ApiResponse<Page>>(`/api/cms/pages/${id}/blocks`, { blocks }).then(r => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/cms/pages/${id}`).then(r => r.data),
  duplicate: (id: string) =>
    api.post<ApiResponse<Page>>(`/api/cms/pages/${id}/duplicate`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// CMS — Menus
// ---------------------------------------------------------------------------
export const menusApi = {
  getAll: () =>
    api.get<ApiResponse<CmsMenu[]>>('/api/cms/menus').then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<CmsMenu>>(`/api/cms/menus/${id}`).then(r => r.data),
  create: (data: Partial<CmsMenu>) =>
    api.post<ApiResponse<CmsMenu>>('/api/cms/menus', data).then(r => r.data),
  update: (id: string, data: Partial<CmsMenu>) =>
    api.patch<ApiResponse<CmsMenu>>(`/api/cms/menus/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/cms/menus/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// CMS — Banners
// ---------------------------------------------------------------------------
export const bannersApi = {
  getAll: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<Banner[]>>('/api/cms/banners', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Banner>>(`/api/cms/banners/${id}`).then(r => r.data),
  create: (data: Partial<Banner>) =>
    api.post<ApiResponse<Banner>>('/api/cms/banners', data).then(r => r.data),
  update: (id: string, data: Partial<Banner>) =>
    api.patch<ApiResponse<Banner>>(`/api/cms/banners/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/cms/banners/${id}`).then(r => r.data),
  updatePriority: (items: Array<{ id: string; priority: number }>) =>
    api.patch<ApiResponse<null>>('/api/cms/banners/priority', { items }).then(r => r.data),
};

// ---------------------------------------------------------------------------
// CMS — Blog
// ---------------------------------------------------------------------------
export const blogApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) =>
    api.get<ApiResponse<BlogPost[]>>('/api/cms/blog', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<BlogPost>>(`/api/cms/blog/${id}`).then(r => r.data),
  create: (data: Partial<BlogPost>) =>
    api.post<ApiResponse<BlogPost>>('/api/cms/blog', data).then(r => r.data),
  update: (id: string, data: Partial<BlogPost>) =>
    api.patch<ApiResponse<BlogPost>>(`/api/cms/blog/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/cms/blog/${id}`).then(r => r.data),
  publish: (id: string) =>
    api.patch<ApiResponse<BlogPost>>(`/api/cms/blog/${id}/publish`).then(r => r.data),
  unpublish: (id: string) =>
    api.patch<ApiResponse<BlogPost>>(`/api/cms/blog/${id}/unpublish`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// CMS — Settings
// ---------------------------------------------------------------------------
export const settingsApi = {
  get: () =>
    api.get<ApiResponse<SiteSettings>>('/api/cms/settings').then(r => r.data),
  update: (data: Partial<SiteSettings>) =>
    api.patch<ApiResponse<SiteSettings>>('/api/cms/settings', data).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const couponsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; productType?: string; search?: string }) =>
    api.get<ApiResponse<Coupon[]>>('/api/coupons', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Coupon>>(`/api/coupons/${id}`).then(r => r.data),
  create: (data: Partial<Coupon>) =>
    api.post<ApiResponse<Coupon>>('/api/coupons', data).then(r => r.data),
  update: (id: string, data: Partial<Coupon>) =>
    api.patch<ApiResponse<Coupon>>(`/api/coupons/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/coupons/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface ReviewQuery {
  page?: number;
  limit?: number;
  status?: string;
  rating?: number;
  search?: string;
  productId?: string;
}

export const reviewsApi = {
  getAll: (params?: ReviewQuery) =>
    api.get<ApiResponse<Review[]>>('/api/reviews', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Review>>(`/api/reviews/${id}`).then((r) => r.data),

  approve: (id: string) =>
    api.patch<ApiResponse<Review>>(`/api/reviews/${id}/approve`).then((r) => r.data),

  reject: (id: string, reason?: string) =>
    api.patch<ApiResponse<Review>>(`/api/reviews/${id}/reject`, { reason }).then((r) => r.data),

  reply: (id: string, text: string) =>
    api.post<ApiResponse<Review>>(`/api/reviews/${id}/reply`, { text }).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/reviews/${id}`).then((r) => r.data),
};

export default api;
