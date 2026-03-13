/**
 * Socket.io event emitter utility
 * Emit real-time updates to all connected clients
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
