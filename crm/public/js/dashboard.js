// Dashboard JavaScript

let dashboardStats = {};
let monthlySalesChart = null;
let orderStatusChart = null;

// Load dashboard data
const loadDashboardData = async () => {
  try {
    // Load statistics from multiple endpoints
    const [productStats, orderStats, userStats, categoryStats] = await Promise.all([
      CRMUtils.apiRequest('/api/products/stats'),
      CRMUtils.apiRequest('/api/orders/stats'),
      CRMUtils.apiRequest('/api/users/stats'),
      CRMUtils.apiRequest('/api/categories/stats')
    ]);

    // Update dashboard cards
    updateDashboardCards(productStats.data, orderStats.data, userStats.data, categoryStats.data);
    
    // Update recent orders table
    updateRecentOrders();
    
    // Update low stock products
    updateLowStockProducts(productStats.data);
    
    // Update charts
    updateMonthlySalesChart(orderStats.data.monthlyStats);
    updateOrderStatusChart(orderStats.data);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    CRMUtils.showAlert('Error loading dashboard data', 'danger');
  }
};

// Update dashboard stat cards
const updateDashboardCards = (productStats, orderStats, userStats, categoryStats) => {
  document.getElementById('totalProducts').textContent = productStats.totalProducts || 0;
  document.getElementById('totalOrders').textContent = orderStats.totalOrders || 0;
  document.getElementById('totalUsers').textContent = userStats.totalUsers || 0;
  document.getElementById('totalCategories').textContent = categoryStats.totalCategories || 0;
};

// Update recent orders table
const updateRecentOrders = async () => {
  try {
    const response = await CRMUtils.apiRequest('/api/orders?limit=5&sortBy=createdAt&sortOrder=desc');
    const orders = response.data;
    
    const tbody = document.querySelector('#recentOrdersTable tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>${order.userId?.name || 'N/A'}</td>
        <td>${CRMUtils.formatCurrency(order.finalAmount)}</td>
        <td>${CRMUtils.getStatusBadge(order.orderStatus, 'order')}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading recent orders:', error);
  }
};

// Update low stock products
const updateLowStockProducts = async (productStats) => {
  try {
    const response = await CRMUtils.apiRequest('/api/products?quantity[lte]=10&limit=5');
    const products = response.data;
    
    const tbody = document.querySelector('#lowStockTable tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
      const row = document.createElement('tr');
      const stockStatus = product.quantity === 0 ? 'Out of Stock' : 'Low Stock';
      const statusClass = product.quantity === 0 ? 'danger' : 'warning';
      
      row.innerHTML = `
        <td>${product.title}</td>
        <td>${product.quantity}</td>
        <td><span class="badge bg-${statusClass}">${stockStatus}</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading low stock products:', error);
  }
};

// Update monthly sales chart
const updateMonthlySalesChart = (monthlyStats) => {
  const ctx = document.getElementById('monthlySalesChart').getContext('2d');
  
  if (monthlySalesChart) {
    monthlySalesChart.destroy();
  }
  
  const labels = monthlyStats.map(stat => `${stat._id.year}/${String(stat._id.month).padStart(2, '0')}`);
  const data = monthlyStats.map(stat => stat.totalRevenue || 0);
  
  monthlySalesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Monthly Sales',
        data: data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return CRMUtils.formatCurrency(value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Sales: ' + CRMUtils.formatCurrency(context.parsed.y);
            }
          }
        }
      }
    }
  });
};

// Update order status chart
const updateOrderStatusChart = (orderStats) => {
  const ctx = document.getElementById('orderStatusChart').getContext('2d');
  
  if (orderStatusChart) {
    orderStatusChart.destroy();
  }
  
  const data = [
    orderStats.pendingOrders || 0,
    orderStats.processingOrders || 0,
    orderStats.shippedOrders || 0,
    orderStats.deliveredOrders || 0,
    orderStats.cancelledOrders || 0
  ];
  
  orderStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      datasets: [{
        data: data,
        backgroundColor: [
          '#ffc107',
          '#007bff',
          '#17a2b8',
          '#28a745',
          '#dc3545'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
              return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
};

// Auto-refresh dashboard every 5 minutes
const startAutoRefresh = () => {
  setInterval(() => {
    loadDashboardData();
  }, 300000); // 5 minutes
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  loadDashboardData();
  checkSyncStatus();
  startAutoRefresh();
  
  // Check sync status every 2 minutes
  setInterval(checkSyncStatus, 120000);
});

// Check sync status with frontend
const checkSyncStatus = async () => {
  try {
    const response = await CRMUtils.apiRequest('/api/sync/sync-status');
    const { crm, frontend, synced } = response.data;
    
    // Update sync status badges
    document.getElementById('productsSync').textContent = `${frontend.products}/${crm.products}`;
    document.getElementById('productsSync').className = `badge ${synced.products ? 'bg-success' : 'bg-warning'}`;
    
    document.getElementById('categoriesSync').textContent = `${frontend.categories}/${crm.categories}`;
    document.getElementById('categoriesSync').className = `badge ${synced.categories ? 'bg-success' : 'bg-warning'}`;
    
    document.getElementById('usersSync').textContent = `${frontend.users}/${crm.users}`;
    document.getElementById('usersSync').className = `badge ${synced.users ? 'bg-success' : 'bg-warning'}`;
    
    // Update overall sync status
    const allSynced = synced.products && synced.categories && synced.users;
    document.getElementById('syncStatus').textContent = allSynced ? 'Synced' : 'Out of Sync';
    document.getElementById('syncStatus').className = `badge ${allSynced ? 'bg-success' : 'bg-warning'}`;
    
  } catch (error) {
    console.error('Error checking sync status:', error);
    document.getElementById('syncStatus').textContent = 'Error';
    document.getElementById('syncStatus').className = 'badge bg-danger';
  }
};

// Sync all data to frontend
const syncAll = async () => {
  try {
    CRMUtils.showAlert('Starting full synchronization...', 'info');
    
    const response = await CRMUtils.apiRequest('/api/sync/sync-all', {
      method: 'POST'
    });
    
    if (response.success) {
      CRMUtils.showAlert('✅ Full synchronization completed successfully!', 'success');
      checkSyncStatus(); // Refresh status
    } else {
      CRMUtils.showAlert('❌ Synchronization failed: ' + response.message, 'danger');
    }
  } catch (error) {
    console.error('Sync all error:', error);
    CRMUtils.showAlert('❌ Synchronization error: ' + error.message, 'danger');
  }
};

// Sync only products
const syncProducts = async () => {
  try {
    CRMUtils.showAlert('Syncing products...', 'info');
    
    const response = await CRMUtils.apiRequest('/api/sync/sync-products', {
      method: 'POST'
    });
    
    if (response.success) {
      CRMUtils.showAlert('✅ Products synchronized successfully!', 'success');
      checkSyncStatus();
    } else {
      CRMUtils.showAlert('❌ Products sync failed: ' + response.message, 'danger');
    }
  } catch (error) {
    console.error('Sync products error:', error);
    CRMUtils.showAlert('❌ Products sync error: ' + error.message, 'danger');
  }
};

// Sync only categories
const syncCategories = async () => {
  try {
    CRMUtils.showAlert('Syncing categories...', 'info');
    
    const response = await CRMUtils.apiRequest('/api/sync/sync-categories', {
      method: 'POST'
    });
    
    if (response.success) {
      CRMUtils.showAlert('✅ Categories synchronized successfully!', 'success');
      checkSyncStatus();
    } else {
      CRMUtils.showAlert('❌ Categories sync failed: ' + response.message, 'danger');
    }
  } catch (error) {
    console.error('Sync categories error:', error);
    CRMUtils.showAlert('❌ Categories sync error: ' + error.message, 'danger');
  }
};

// Sync only users
const syncUsers = async () => {
  try {
    CRMUtils.showAlert('Syncing users...', 'info');
    
    const response = await CRMUtils.apiRequest('/api/sync/sync-users', {
      method: 'POST'
    });
    
    if (response.success) {
      CRMUtils.showAlert('✅ Users synchronized successfully!', 'success');
      checkSyncStatus();
    } else {
      CRMUtils.showAlert('❌ Users sync failed: ' + response.message, 'danger');
    }
  } catch (error) {
    console.error('Sync users error:', error);
    CRMUtils.showAlert('❌ Users sync error: ' + error.message, 'danger');
  }
};