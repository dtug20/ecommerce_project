// Users Management JavaScript

let users = [];
let currentFilters = {};
let selectedUserId = null;

// Initialize users page
document.addEventListener('DOMContentLoaded', function() {
  loadUsers();
  setupEventListeners();
});

// Setup event listeners
const setupEventListeners = () => {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', CRMUtils.debounce(() => {
    currentFilters.search = searchInput.value;
    loadUsers();
  }, 500));

  // Filter change handlers
  document.getElementById('roleFilter').addEventListener('change', (e) => {
    currentFilters.role = e.target.value;
    loadUsers();
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadUsers();
  });

  document.getElementById('verifiedFilter').addEventListener('change', (e) => {
    currentFilters.emailVerified = e.target.value;
    loadUsers();
  });

  // Form submit handler
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
};

// Load users with filters
const loadUsers = async (page = 1) => {
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...currentFilters
    });

    CRMUtils.showLoading(document.querySelector('.card-body'));
    
    const response = await CRMUtils.apiRequest(`/api/users?${params}`);
    users = response.data;
    
    updateUsersTable(users);
    updatePagination(response.pagination);
    
  } catch (error) {
    console.error('Error loading users:', error);
    CRMUtils.showAlert('Error loading users', 'danger');
  } finally {
    CRMUtils.hideLoading(document.querySelector('.card-body'));
  }
};

// Update users table
const updateUsersTable = (users) => {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No users found</td></tr>';
    return;
  }
  
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        ${user.avatar ? 
          `<img src="${user.avatar}" class="avatar" alt="${user.name}">` : 
          `<div class="avatar bg-primary text-white d-flex align-items-center justify-content-center">${user.name.charAt(0)}</div>`
        }
      </td>
      <td>
        <div class="fw-bold">${user.name}</div>
        ${user.phone ? `<small class="text-muted">${user.phone}</small>` : ''}
      </td>
      <td>
        <div>${user.email}</div>
        ${user.lastLogin ? `<small class="text-muted">Last: ${CRMUtils.formatDate(user.lastLogin)}</small>` : ''}
      </td>
      <td>
        <span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'staff' ? 'bg-warning' : 'bg-secondary'}">${user.role}</span>
      </td>
      <td>
        <span class="badge bg-primary">${user.orders ? user.orders.length : 0}</span>
      </td>
      <td>${CRMUtils.getStatusBadge(user.status)}</td>
      <td>
        ${user.emailVerified ? 
          '<i class="bi bi-check-circle-fill text-success"></i>' : 
          '<i class="bi bi-x-circle-fill text-danger"></i>'
        }
      </td>
      <td>
        <small>${CRMUtils.formatDate(user.createdAt)}</small>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editUser('${user._id}')" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-info" onclick="viewUser('${user._id}')" title="View">
            <i class="bi bi-eye"></i>
          </button>
          <div class="btn-group" role="group">
            <button class="btn btn-outline-warning dropdown-toggle" data-bs-toggle="dropdown" title="Status">
              <i class="bi bi-gear"></i>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" onclick="updateUserStatus('${user._id}', 'active')">Activate</a></li>
              <li><a class="dropdown-item" href="#" onclick="updateUserStatus('${user._id}', 'inactive')">Deactivate</a></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="updateUserStatus('${user._id}', 'blocked')">Block</a></li>
            </ul>
          </div>
          <button class="btn btn-outline-danger" onclick="deleteUser('${user._id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
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
  
  CRMUtils.generatePagination('#usersPagination', totalPages, currentPage, 'goToPage');
};

// Go to specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages) {
    loadUsers(page);
  }
};

// Clear filters
const clearFilters = () => {
  currentFilters = {};
  document.getElementById('searchInput').value = '';
  document.getElementById('roleFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('verifiedFilter').value = '';
  loadUsers();
};

// Handle user form submission
const handleUserSubmit = async (e) => {
  e.preventDefault();
  
  if (!CRMUtils.validateForm('#userForm')) {
    CRMUtils.showAlert('Please fill in all required fields', 'danger');
    return;
  }
  
  const formData = new FormData(e.target);
  const userData = {};
  
  // Convert form data to object
  for (let [key, value] of formData.entries()) {
    // Skip the 'id' field since it's in the URL, not the body
    if (key === 'id') continue;
    
    // Skip empty values for optional fields during update
    const userId = document.getElementById('userId').value;
    if (userId && !value && !key.startsWith('address.')) continue;
    
    if (key.startsWith('address.')) {
      if (!userData.address) userData.address = {};
      userData.address[key.replace('address.', '')] = value;
    } else if (key === 'emailVerified') {
      userData[key] = formData.has('emailVerified');
    } else if (key === 'dateOfBirth' && value) {
      userData[key] = new Date(value);
    } else {
      userData[key] = value;
    }
  }
  
  try {
    const userId = document.getElementById('userId').value;
    const url = userId ? `/api/users/${userId}` : '/api/users';
    const method = userId ? 'PUT' : 'POST';
    
    // Don't send password if it's empty during update
    if (userId && !userData.password) {
      delete userData.password;
    }
    
    await CRMUtils.apiRequest(url, {
      method,
      body: JSON.stringify(userData)
    });
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
    modal.hide();
    
    CRMUtils.showAlert(userId ? 'User updated successfully' : 'User created successfully');
    CRMUtils.clearForm('#userForm');
    loadUsers();
    
  } catch (error) {
    console.error('Error saving user:', error);
    CRMUtils.showAlert(error.message, 'danger');
  }
};

// Edit user
const editUser = async (userId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/users/${userId}`);
    const user = response.data;
    
    // Populate form
    document.getElementById('userModalLabel').textContent = 'Edit User';
    document.getElementById('userId').value = user._id;
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('role').value = user.role;
    document.getElementById('status').value = user.status;
    document.getElementById('gender').value = user.gender || '';
    document.getElementById('avatar').value = user.avatar || '';
    document.getElementById('emailVerified').checked = user.emailVerified;
    
    if (user.dateOfBirth) {
      document.getElementById('dateOfBirth').value = new Date(user.dateOfBirth).toISOString().split('T')[0];
    }
    
    if (user.address) {
      document.getElementById('street').value = user.address.street || '';
      document.getElementById('city').value = user.address.city || '';
      document.getElementById('state').value = user.address.state || '';
      document.getElementById('zipCode').value = user.address.zipCode || '';
      document.getElementById('country').value = user.address.country || '';
    }
    
    // Make password optional for editing
    document.getElementById('password').removeAttribute('required');
    document.getElementById('password').placeholder = 'Leave blank to keep current password';
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading user:', error);
    CRMUtils.showAlert('Error loading user details', 'danger');
  }
};

// View user details
const viewUser = async (userId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/users/${userId}`);
    const user = response.data;
    selectedUserId = userId;
    
    const userDetailsBody = document.getElementById('userDetailsBody');
    userDetailsBody.innerHTML = `
      <div class="row">
        <div class="col-md-4 text-center">
          ${user.avatar ? 
            `<img src="${user.avatar}" class="rounded-circle mb-3" style="width: 120px; height: 120px; object-fit: cover;">` :
            `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 120px; height: 120px; font-size: 48px;">${user.name.charAt(0)}</div>`
          }
          <h5>${user.name}</h5>
          <p class="text-muted">${user.email}</p>
          ${CRMUtils.getStatusBadge(user.status)}
          <span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'staff' ? 'bg-warning' : 'bg-secondary'} ms-2">${user.role}</span>
        </div>
        <div class="col-md-8">
          <h6>User Information</h6>
          <table class="table table-sm">
            <tr><th>Email:</th><td>${user.email}</td></tr>
            <tr><th>Phone:</th><td>${user.phone || 'N/A'}</td></tr>
            <tr><th>Gender:</th><td>${user.gender || 'N/A'}</td></tr>
            <tr><th>Date of Birth:</th><td>${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</td></tr>
            <tr><th>Email Verified:</th><td>${user.emailVerified ? '<i class="bi bi-check-circle-fill text-success"></i> Yes' : '<i class="bi bi-x-circle-fill text-danger"></i> No'}</td></tr>
            <tr><th>Joined:</th><td>${CRMUtils.formatDate(user.createdAt)}</td></tr>
            <tr><th>Last Login:</th><td>${user.lastLogin ? CRMUtils.formatDate(user.lastLogin) : 'Never'}</td></tr>
          </table>
          
          ${user.address && (user.address.street || user.address.city) ? `
            <h6>Address</h6>
            <address class="small">
              ${user.address.street ? user.address.street + '<br>' : ''}
              ${user.address.city ? user.address.city + ', ' : ''}${user.address.state ? user.address.state + ' ' : ''}${user.address.zipCode ? user.address.zipCode + '<br>' : ''}
              ${user.address.country ? user.address.country : ''}
            </address>
          ` : ''}
        </div>
      </div>
      
      <h6>Order History</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr><th>Order #</th><th>Date</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody id="userOrdersTable">
            <tr><td colspan="4" class="text-center">Loading orders...</td></tr>
          </tbody>
        </table>
      </div>
    `;
    
    // Load user orders
    loadUserOrders(userId);
    
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading user:', error);
    CRMUtils.showAlert('Error loading user details', 'danger');
  }
};

// Load user orders
const loadUserOrders = async (userId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/users/${userId}/orders?limit=5`);
    const orders = response.data;
    
    const tbody = document.getElementById('userOrdersTable');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No orders found</td></tr>';
      return;
    }
    
    orders.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>${CRMUtils.formatDate(order.createdAt)}</td>
        <td>${CRMUtils.formatCurrency(order.finalAmount)}</td>
        <td>${CRMUtils.getStatusBadge(order.orderStatus, 'order')}</td>
      `;
      tbody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Error loading user orders:', error);
    document.getElementById('userOrdersTable').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading orders</td></tr>';
  }
};

// Update user status
const updateUserStatus = async (userId, status) => {
  try {
    await CRMUtils.apiRequest(`/api/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    
    CRMUtils.showAlert(`User status updated to ${status}`);
    loadUsers();
    
  } catch (error) {
    console.error('Error updating user status:', error);
    CRMUtils.showAlert(error.message, 'danger');
  }
};

// Delete user
const deleteUser = async (userId) => {
  if (await CRMUtils.deleteItem('/api/users', userId, 'user')) {
    loadUsers();
  }
};

// Reset user modal when hidden
document.getElementById('userModal').addEventListener('hidden.bs.modal', function() {
  document.getElementById('userModalLabel').textContent = 'Add User';
  document.getElementById('password').setAttribute('required', 'required');
  document.getElementById('password').placeholder = '';
  CRMUtils.clearForm('#userForm');
});

// Export functions for global access
window.goToPage = goToPage;
window.editUser = editUser;
window.viewUser = viewUser;
window.updateUserStatus = updateUserStatus;
window.deleteUser = deleteUser;
window.clearFilters = clearFilters;
window.loadUsers = loadUsers;