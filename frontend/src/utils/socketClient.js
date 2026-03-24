/**
 * Socket.io client for real-time updates
 */
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';

let socket = null;
let invalidateCallbacks = {};

export const initSocket = (store) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    // connected
  });

  socket.on('disconnect', () => {
  });

  // Product events
  socket.on('product:created', (data) => {
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('product:updated', (data) => {
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('product:deleted', (data) => {
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('products:refresh', () => {
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  // Category events
  socket.on('category:created', (data) => {
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('category:updated', (data) => {
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('category:deleted', (data) => {
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('categories:refresh', () => {
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  // Order events
  socket.on('order:created', (data) => {
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('order:updated', (data) => {
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('order:deleted', (data) => {
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('orders:refresh', () => {
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  // User events
  socket.on('user:created', (data) => {
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('user:updated', (data) => {
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('user:deleted', (data) => {
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('users:refresh', () => {
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  // CMS Page events
  socket.on('page:created', () => {
    if (invalidateCallbacks.page) invalidateCallbacks.page();
  });
  socket.on('page:updated', () => {
    if (invalidateCallbacks.page) invalidateCallbacks.page();
  });
  socket.on('page:deleted', () => {
    if (invalidateCallbacks.page) invalidateCallbacks.page();
  });

  // Menu events
  socket.on('menu:updated', () => {
    if (invalidateCallbacks.menu) invalidateCallbacks.menu();
  });

  // Banner events
  socket.on('banner:created', () => {
    if (invalidateCallbacks.banner) invalidateCallbacks.banner();
  });
  socket.on('banner:updated', () => {
    if (invalidateCallbacks.banner) invalidateCallbacks.banner();
  });
  socket.on('banner:deleted', () => {
    if (invalidateCallbacks.banner) invalidateCallbacks.banner();
  });

  // Blog events
  socket.on('blog:created', () => {
    if (invalidateCallbacks.blog) invalidateCallbacks.blog();
  });
  socket.on('blog:published', () => {
    if (invalidateCallbacks.blog) invalidateCallbacks.blog();
  });
  socket.on('blog:updated', () => {
    if (invalidateCallbacks.blog) invalidateCallbacks.blog();
  });
  socket.on('blog:deleted', () => {
    if (invalidateCallbacks.blog) invalidateCallbacks.blog();
  });

  // Settings events
  socket.on('settings:updated', () => {
    if (invalidateCallbacks.settings) invalidateCallbacks.settings();
  });

  return socket;
};

export const registerInvalidateCallback = (resourceType, callback) => {
  invalidateCallbacks[resourceType] = callback;
};

/**
 * Register RTK Query cache invalidation callbacks.
 *
 * Call this once after initialising the socket, passing the Redux store and
 * the RTK Query api object, e.g.:
 *
 *   import { initSocket, registerCmsInvalidations } from '@/utils/socketClient';
 *   import { apiSlice } from '@/redux/api/apiSlice';
 *
 *   const socket = initSocket(store);
 *   registerCmsInvalidations(store, apiSlice);
 */
export const registerCmsInvalidations = (store, api) => {
  registerInvalidateCallback('page', () =>
    store.dispatch(api.util.invalidateTags(['Page']))
  );
  registerInvalidateCallback('menu', () =>
    store.dispatch(api.util.invalidateTags(['Menu']))
  );
  registerInvalidateCallback('banner', () =>
    store.dispatch(api.util.invalidateTags(['Banners']))
  );
  registerInvalidateCallback('blog', () =>
    store.dispatch(api.util.invalidateTags(['BlogPosts', 'BlogPost']))
  );
  registerInvalidateCallback('settings', () =>
    store.dispatch(api.util.invalidateTags(['SiteSettings']))
  );
};

export const getSocket = () => socket;
