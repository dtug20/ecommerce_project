/**
 * Socket.io event emitter utility
 * Emit real-time updates to all connected clients
 *
 * Current events (Phase 1):
 *   product:created/updated/deleted, products:refresh
 *   category:created/updated/deleted, categories:refresh
 *   order:created/updated/deleted, orders:refresh
 *   user:created/updated/deleted, users:refresh
 *
 * Planned events (Phase 2+):
 *   page:created, page:updated, page:deleted
 *   menu:updated
 *   banner:created, banner:updated, banner:deleted
 *   blog:published, blog:updated, blog:deleted
 *   settings:updated
 *   vendor:created, vendor:updated, vendor:statusChanged
 *   wishlist:updated
 *   review:moderated
 *
 * Consumers:
 *   - Storefront (Next.js): RTK Query cache invalidation via socketClient.js
 *   - CRM (React): TanStack Query invalidation via socket listener
 */

const emitEvent = (eventName, data = {}) => {
  if (global.io) {
    global.io.emit(eventName, {
      timestamp: new Date(),
      ...data
    });
    console.log(`[Socket.io] Event emitted: ${eventName}`);
  }
};

// Product events
const emitProductCreated = (product) => {
  emitEvent('product:created', { product });
};

const emitProductUpdated = (product) => {
  emitEvent('product:updated', { product });
};

const emitProductDeleted = (productId) => {
  emitEvent('product:deleted', { productId });
};

const emitProductsRefresh = () => {
  emitEvent('products:refresh');
};

// Category events
const emitCategoryCreated = (category) => {
  emitEvent('category:created', { category });
};

const emitCategoryUpdated = (category) => {
  emitEvent('category:updated', { category });
};

const emitCategoryDeleted = (categoryId) => {
  emitEvent('category:deleted', { categoryId });
};

const emitCategoriesRefresh = () => {
  emitEvent('categories:refresh');
};

// Order events
const emitOrderCreated = (order) => {
  emitEvent('order:created', { order });
};

const emitOrderUpdated = (order) => {
  emitEvent('order:updated', { order });
};

const emitOrderDeleted = (orderId) => {
  emitEvent('order:deleted', { orderId });
};

const emitOrdersRefresh = () => {
  emitEvent('orders:refresh');
};

// User events
const emitUserCreated = (user) => {
  emitEvent('user:created', { user });
};

const emitUserUpdated = (user) => {
  emitEvent('user:updated', { user });
};

const emitUserDeleted = (userId) => {
  emitEvent('user:deleted', { userId });
};

const emitUsersRefresh = () => {
  emitEvent('users:refresh');
};

module.exports = {
  emitEvent,
  emitProductCreated,
  emitProductUpdated,
  emitProductDeleted,
  emitProductsRefresh,
  emitCategoryCreated,
  emitCategoryUpdated,
  emitCategoryDeleted,
  emitCategoriesRefresh,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderDeleted,
  emitOrdersRefresh,
  emitUserCreated,
  emitUserUpdated,
  emitUserDeleted,
  emitUsersRefresh
};
