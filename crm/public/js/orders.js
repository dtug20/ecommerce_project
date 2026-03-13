// Orders Management JavaScript

let orders = [];
let currentFilters = {};
let selectedOrderId = null;

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
  loadOrders();
  setupEventListeners();
});

// Setup event listeners
const setupEventListeners = () => {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', CRMUtils.debounce(() => {
    currentFilters.search = searchInput.value;
    loadOrders();
  }, 500));

  // Filter change handlers
  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadOrders();
  });

  document.getElementById('paymentStatusFilter').addEventListener('change', (e) => {
    currentFilters.paymentStatus = e.target.value;
    loadOrders();
  });

  document.getElementById('paymentMethodFilter').addEventListener('change', (e) => {
    currentFilters.paymentMethod = e.target.value;
    loadOrders();
  });
};

// Load orders with filters
const loadOrders = async (page = 1) => {
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...currentFilters
    });

    CRMUtils.showLoading(document.querySelector('.card-body'));
    
    const response = await CRMUtils.apiRequest(`/api/orders?${params}`);
    orders = response.data;
    
    updateOrdersTable(orders);
    updatePagination(response.pagination);
    
  } catch (error) {
    console.error('Error loading orders:', error);
    CRMUtils.showAlert('Error loading orders', 'danger');
  } finally {
    CRMUtils.hideLoading(document.querySelector('.card-body'));
  }
};

// Update orders table
const updateOrdersTable = (orders) => {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
    return;
  }
  
  orders.forEach(order => {
    const row = document.createElement('tr');
    const cartItems = order.cart || order.products || [];
    const orderNum = order.invoice ? `#${order.invoice}` : (order.orderNumber || order._id);
    const orderStatus = order.orderStatus || order.status || 'pending';
    
    row.innerHTML = `
      <td>
        <div class="fw-bold">${orderNum}</div>
        ${order.trackingNumber ? `<small class="text-muted">Tracking: ${order.trackingNumber}</small>` : ''}
      </td>
      <td>
        <div>${order.name || order.user?.name || 'N/A'}</div>
        <small class="text-muted">${order.email || order.user?.email || ''}</small>
      </td>
      <td>
        <small>${cartItems.length} item(s)</small>
        ${cartItems.slice(0, 2).map(p => `<div class="text-truncate" style="max-width: 150px;">${p.title}</div>`).join('')}
        ${cartItems.length > 2 ? `<small class="text-muted">+${cartItems.length - 2} more</small>` : ''}
      </td>
      <td>
        <div class="fw-bold">${CRMUtils.formatCurrency(order.totalAmount || order.finalAmount)}</div>
        ${order.shippingCost > 0 ? `<small class="text-muted">+${CRMUtils.formatCurrency(order.shippingCost)} shipping</small>` : ''}
      </td>
      <td>
        <div>${CRMUtils.getStatusBadge(order.paymentStatus || 'pending', 'payment')}</div>
        <small class="text-muted">${order.paymentMethod}</small>
      </td>
      <td>${CRMUtils.getStatusBadge(orderStatus, 'order')}</td>
      <td>
        <div>${CRMUtils.formatDate(order.createdAt)}</div>
        ${order.estimatedDelivery ? `<small class="text-muted">Est: ${new Date(order.estimatedDelivery).toLocaleDateString()}</small>` : ''}
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="viewOrder('${order._id}')" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <div class="btn-group" role="group">
            <button class="btn btn-outline-success dropdown-toggle" data-bs-toggle="dropdown" title="Update Status">
              <i class="bi bi-gear"></i>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order._id}', 'pending')">Pending</a></li>
              <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order._id}', 'confirmed')">Confirmed</a></li>
              <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order._id}', 'processing')">Processing</a></li>
              <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order._id}', 'shipped')">Shipped</a></li>
              <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order._id}', 'delivered')">Delivered</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="updateOrderStatus('${order._id}', 'cancelled')">Cancel</a></li>
            </ul>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
};

// Update pagination
const updatePagination = (pagination) => {
  currentPage = pagination.currentPage;
  totalPages = pagination.totalPages;
  
  CRMUtils.generatePagination('#ordersPagination', totalPages, currentPage, 'goToPage');
};

// Go to specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages) {
    loadOrders(page);
  }
};

// Clear filters
const clearFilters = () => {
  currentFilters = {};
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('paymentStatusFilter').value = '';
  document.getElementById('paymentMethodFilter').value = '';
  loadOrders();
};

// View order details
const viewOrder = async (orderId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/orders/${orderId}`);
    const order = response.data;
    selectedOrderId = orderId;
    
    const orderDetailsBody = document.getElementById('orderDetailsBody');
    orderDetailsBody.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h6>Order Information</h6>
          <table class="table table-sm">
            <tr><th>Order Number:</th><td>${order.orderNumber}</td></tr>
            <tr><th>Status:</th><td>${CRMUtils.getStatusBadge(order.orderStatus, 'order')}</td></tr>
            <tr><th>Payment Status:</th><td>${CRMUtils.getStatusBadge(order.paymentStatus, 'payment')}</td></tr>
            <tr><th>Payment Method:</th><td>${order.paymentMethod}</td></tr>
            <tr><th>Order Date:</th><td>${CRMUtils.formatDate(order.createdAt)}</td></tr>
            ${order.trackingNumber ? `<tr><th>Tracking:</th><td>${order.trackingNumber}</td></tr>` : ''}
            ${order.estimatedDelivery ? `<tr><th>Est. Delivery:</th><td>${new Date(order.estimatedDelivery).toLocaleDateString()}</td></tr>` : ''}
          </table>
        </div>
        <div class="col-md-6">
          <h6>Customer Information</h6>
          <table class="table table-sm">
            <tr><th>Name:</th><td>${order.name || order.user?.name || 'N/A'}</td></tr>
            <tr><th>Email:</th><td>${order.email || order.user?.email || 'N/A'}</td></tr>
            <tr><th>Phone:</th><td>${order.contact || order.user?.phone || 'N/A'}</td></tr>
          </table>
          
          <h6>Shipping Address</h6>
          <address class="small">
            ${order.name || 'N/A'}<br>
            ${order.address || 'N/A'}<br>
            ${order.city || 'N/A'}, ${order.zipCode || 'N/A'}<br>
            ${order.country || 'N/A'}
            ${order.contact ? `<br>Phone: ${order.contact}` : ''}
          </address>
        </div>
      </div>
      
      <h6>Order Items</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${(order.cart || order.products || []).map(item => `
              <tr>
                <td>
                  <div class="d-flex align-items-center">
                    ${item.img || item.image ? `<img src="${item.img || item.image}" class="img-thumbnail me-2" style="width: 40px; height: 40px;">` : ''}
                    <div>
                      <div>${item.title}</div>
                      ${item.color || item.size ? `<small class="text-muted">${[item.color, item.size].filter(Boolean).join(', ')}</small>` : ''}
                    </div>
                  </div>
                </td>
                <td>${item.orderQuantity || item.quantity || 1}</td>
                <td>${CRMUtils.formatCurrency(item.price)}</td>
                <td>${CRMUtils.formatCurrency(item.price * (item.orderQuantity || item.quantity || 1))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="row mt-3">
        <div class="col-md-6 offset-md-6">
          <table class="table table-sm">
            <tr><th>Subtotal:</th><td class="text-end">${CRMUtils.formatCurrency(order.subTotal || order.totalAmount)}</td></tr>
            ${order.discount > 0 ? `<tr><th>Discount:</th><td class="text-end text-success">-${CRMUtils.formatCurrency(order.discount)}</td></tr>` : ''}
            ${order.shippingCost > 0 ? `<tr><th>Shipping:</th><td class="text-end">${CRMUtils.formatCurrency(order.shippingCost)}</td></tr>` : ''}
            ${order.tax > 0 ? `<tr><th>Tax:</th><td class="text-end">${CRMUtils.formatCurrency(order.tax)}</td></tr>` : ''}
            <tr class="fw-bold"><th>Total:</th><td class="text-end">${CRMUtils.formatCurrency(order.totalAmount || order.finalAmount)}</td></tr>
          </table>
        </div>
      </div>
      
      ${order.notes ? `
        <div class="mt-3">
          <h6>Notes</h6>
          <p class="small">${order.notes}</p>
        </div>
      ` : ''}
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading order:', error);
    CRMUtils.showAlert('Error loading order details', 'danger');
  }
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  try {
    await CRMUtils.apiRequest(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    
    CRMUtils.showAlert(`Order status updated to ${status}`);
    
    // Close modal if open
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
    if (modal) {
      modal.hide();
    }
    
    loadOrders();
    
  } catch (error) {
    console.error('Error updating order status:', error);
    CRMUtils.showAlert(error.message, 'danger');
  }
};

// Export functions for global access
window.goToPage = goToPage;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.clearFilters = clearFilters;
window.loadOrders = loadOrders;