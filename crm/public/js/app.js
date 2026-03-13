// Common CRM Application JavaScript

// Global variables
let currentPage = 1;
let totalPages = 1;

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const showAlert = (message, type = 'success') => {
  const alertContainer = document.getElementById('alertContainer');
  const alertId = 'alert-' + Date.now();
  
  const alert = document.createElement('div');
  alert.id = alertId;
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    <strong>${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info!'}</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  alertContainer.appendChild(alert);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      alertElement.remove();
    }
  }, 5000);
};

const hideAlert = () => {
  const alertContainer = document.getElementById('alertContainer');
  alertContainer.innerHTML = '';
};

const showLoading = (element) => {
  element.classList.add('loading');
};

const hideLoading = (element) => {
  element.classList.remove('loading');
};

// API request wrapper
const apiRequest = async (url, options = {}) => {
  try {
    if (options.body) {
      console.log('API Request:', url, 'Body:', JSON.parse(options.body));
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    console.log('API Response:', response.status, data);
    
    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const fullError = {
        message: errorMsg,
        status: response.status,
        details: data.errors || data
      };
      console.error('API Error Details:', fullError);
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Generic CRUD operations
const deleteItem = async (endpoint, id, itemName = 'item') => {
  if (!confirm(`Are you sure you want to delete this ${itemName}?`)) {
    return false;
  }
  
  try {
    await apiRequest(`${endpoint}/${id}`, {
      method: 'DELETE'
    });
    
    showAlert(`${itemName} deleted successfully`);
    return true;
  } catch (error) {
    showAlert(error.message, 'danger');
    return false;
  }
};

// Status badge helper
const getStatusBadge = (status, type = 'general') => {
  const statusMappings = {
    general: {
      'Show': 'success',
      'Hide': 'secondary',
      'active': 'success',
      'inactive': 'secondary',
      'blocked': 'danger'
    },
    payment: {
      'pending': 'warning',
      'paid': 'success',
      'failed': 'danger',
      'refunded': 'info'
    },
    order: {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'primary',
      'shipped': 'info',
      'delivered': 'success',
      'cancelled': 'danger'
    }
  };
  
  const badgeType = statusMappings[type][status] || 'secondary';
  return `<span class="badge bg-${badgeType}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
};

// Pagination helper
const generatePagination = (containerSelector, totalPages, currentPage, onPageClick) => {
  const container = document.querySelector(containerSelector);
  if (!container || totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="${onPageClick}(${currentPage - 1}); return false;">Previous</a>
    </li>
  `;
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="${onPageClick}(1); return false;">1</a>
      </li>
    `;
    if (startPage > 2) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="${onPageClick}(${i}); return false;">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="${onPageClick}(${totalPages}); return false;">${totalPages}</a>
      </li>
    `;
  }
  
  // Next button
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="${onPageClick}(${currentPage + 1}); return false;">Next</a>
    </li>
  `;
  
  container.innerHTML = paginationHTML;
};

// Form validation helper
const validateForm = (formSelector) => {
  const form = document.querySelector(formSelector);
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    field.classList.remove('is-invalid');
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      isValid = false;
    }
  });
  
  return isValid;
};

// Clear form helper
const clearForm = (formSelector) => {
  const form = document.querySelector(formSelector);
  form.reset();
  form.querySelectorAll('.is-invalid').forEach(field => {
    field.classList.remove('is-invalid');
  });
};

// Search debouncing
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Initialize tooltips and popovers when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
});

// Export for use in other files
window.CRMUtils = {
  formatCurrency,
  formatDate,
  showAlert,
  hideAlert,
  showLoading,
  hideLoading,
  apiRequest,
  deleteItem,
  getStatusBadge,
  generatePagination,
  validateForm,
  clearForm,
  debounce
};