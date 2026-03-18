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

export default api;
