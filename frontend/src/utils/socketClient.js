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
    console.log('[Socket.io] Connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Disconnected');
  });

  // Product events
  socket.on('product:created', (data) => {
    console.log('[Socket.io] Product created:', data);
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('product:updated', (data) => {
    console.log('[Socket.io] Product updated:', data);
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('product:deleted', (data) => {
    console.log('[Socket.io] Product deleted:', data);
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  socket.on('products:refresh', () => {
    console.log('[Socket.io] Products refresh');
    if (invalidateCallbacks.product) invalidateCallbacks.product();
  });

  // Category events
  socket.on('category:created', (data) => {
    console.log('[Socket.io] Category created:', data);
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('category:updated', (data) => {
    console.log('[Socket.io] Category updated:', data);
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('category:deleted', (data) => {
    console.log('[Socket.io] Category deleted:', data);
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  socket.on('categories:refresh', () => {
    console.log('[Socket.io] Categories refresh');
    if (invalidateCallbacks.category) invalidateCallbacks.category();
  });

  // Order events
  socket.on('order:created', (data) => {
    console.log('[Socket.io] Order created:', data);
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('order:updated', (data) => {
    console.log('[Socket.io] Order updated:', data);
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('order:deleted', (data) => {
    console.log('[Socket.io] Order deleted:', data);
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  socket.on('orders:refresh', () => {
    console.log('[Socket.io] Orders refresh');
    if (invalidateCallbacks.order) invalidateCallbacks.order();
  });

  // User events
  socket.on('user:created', (data) => {
    console.log('[Socket.io] User created:', data);
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('user:updated', (data) => {
    console.log('[Socket.io] User updated:', data);
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('user:deleted', (data) => {
    console.log('[Socket.io] User deleted:', data);
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  socket.on('users:refresh', () => {
    console.log('[Socket.io] Users refresh');
    if (invalidateCallbacks.user) invalidateCallbacks.user();
  });

  return socket;
};

export const registerInvalidateCallback = (resourceType, callback) => {
  invalidateCallbacks[resourceType] = callback;
};

export const getSocket = () => socket;
